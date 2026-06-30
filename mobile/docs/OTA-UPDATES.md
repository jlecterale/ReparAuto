# OTA Updates — RecarGarage (EAS Update + expo-updates)

Guia completo para **ativar e operar** as atualizações over-the-air (OTA) da app
mobile. OTA permite publicar correções e melhorias de **JS/TS, estilos e assets**
diretamente nos telemóveis dos utilizadores **sem passar por nova revisão da App
Store / Google Play**.

> Tudo a partir da pasta `mobile/`. Bundle id: **`com.recargarage`**.

---

## O que já está implementado no código

Estas peças já estão no repositório — não é preciso voltar a fazê-las:

| Onde | O quê |
| --- | --- |
| `package.json` | Dependência `expo-updates` (~55.0.24, alinhada com o SDK 55) + scripts `update`, `update:preview`, `update:production` |
| `app.config.ts` | `runtimeVersion: { policy: 'fingerprint' }` e bloco `updates` (endpoint `https://u.expo.dev/<EAS_PROJECT_ID>`, sem bloquear o arranque) |
| `eas.json` | Canais por perfil: `development`, `preview`, `production` (já existiam) |
| `src/hooks/useOTAUpdates.ts` | Verifica/descarrega updates em silêncio no arranque e ao voltar ao primeiro plano; aplica no próximo arranque |
| `app/_layout.tsx` | Chama `useOTAUpdates()` no `RootNavigator` |
| `.env.example` | Variável `EAS_PROJECT_ID` |

**Falta apenas 1 coisa para ligar OTA**: criar o projeto EAS e definir
`EAS_PROJECT_ID` (secção 1). Sem isso, o `app.config.ts` deixa `updates`
indefinido e a app corre apenas o JS embebido — sem erros.

---

## Como funciona (modelo mental)

```
   eas update --branch production
            │  (sobe um novo bundle JS para a EAS)
            ▼
   ┌─────────────────────┐        a app, no arranque/foreground:
   │  EAS Update (u.expo) │  ◀───  checkForUpdateAsync()  → há novo bundle?
   └─────────────────────┘        fetchUpdateAsync()      → descarrega em silêncio
            │                      (aplica-se no PRÓXIMO arranque da app)
            ▼
   canal  ──► branch  ──► runtime (fingerprint)
```

- **Canal (channel)**: definido no `eas.json` por perfil de build. O binário que
  está na loja foi compilado com o canal `production`, por isso só recebe updates
  publicados nesse canal.
- **Branch**: o destino de `eas update --branch <nome>`. Por convenção mapeamos
  **1 canal → 1 branch com o mesmo nome** (`production` → `production`).
- **Runtime version (`fingerprint`)**: impede entregar JS incompatível. O
  fingerprint é calculado a partir do projeto nativo (deps, config, plugins).
  Como usamos **Continuous Native Generation** (`ios/` e `android/` são
  gerados por `expo prebuild` e estão no `.gitignore`), qualquer mudança nativa
  muda o fingerprint **automaticamente** — um update OTA nunca chega a um
  binário com runtime diferente.

### O que PODE e o que NÃO PODE ir por OTA

| ✅ Pode ir por OTA (só JS/assets) | ❌ Exige novo build + submissão à loja |
| --- | --- |
| Correções de bugs em JS/TS | Novas libs nativas / mudar versões nativas |
| Texto, traduções, estilos (NativeWind) | Novas permissões (câmara, localização, …) |
| Novos ecrãs/lógica em React | Bump do Expo SDK / React Native |
| Imagens e assets do bundle | Mudar ícone/splash/`app.config.ts` nativo |
| Ajustes de UX/fluxos existentes | Qualquer coisa que mude o **fingerprint** |

> Regra prática: se mexeste só em ficheiros dentro de `app/`, `src/`, `assets/`
> ou `global.css` → **OTA**. Se mexeste em `app.config.ts` (parte nativa),
> `plugins/`, ou `package.json` (deps nativas) → **novo build**.

---

## 1. Ativar (uma vez)

```sh
npm i -g eas-cli          # se ainda não tiveres
eas login                 # conta Expo da RecarGarage
cd mobile

eas init                  # cria o projeto EAS e imprime o Project ID (UUID)
eas update:configure      # confirma o bloco `updates` (já está no app.config.ts)
```

Depois define o `EAS_PROJECT_ID` com o UUID que o `eas init` imprimiu:

```sh
# .env local (desenvolvimento)
echo "EAS_PROJECT_ID=<o-uuid-do-eas-init>" >> .env
```

E **no EAS** (para que os builds na nuvem o conheçam):

```sh
eas env:create --name EAS_PROJECT_ID --value <o-uuid> \
  --environment production --environment preview --visibility plaintext
```

Confirma que ficou tudo ligado:

```sh
EAS_PROJECT_ID=<o-uuid> npx expo config --type public | grep -A2 -E "updates|runtimeVersion"
# deve mostrar url: https://u.expo.dev/<uuid> e policy: 'fingerprint'
```

> **Importante**: os builds que recebem OTA têm de ser feitos **depois** de o
> `EAS_PROJECT_ID` estar definido (o canal e o endpoint ficam embebidos no
> binário em tempo de build). Um binário compilado antes disto não recebe updates.

---

## 2. Publicar um update OTA

Fluxo típico depois de mexer só em JS/TS:

```sh
npm run typecheck                       # garante que compila
npm run update:production               # → eas update --branch production
#   (ou)  eas update --branch production --message "fix: corrige filtro de preço"
```

Para testar antes em utilizadores internos (perfil `preview`):

```sh
npm run update:preview                  # → eas update --branch preview
```

O comando faz o bundle do JS, sobe-o para o branch e fica imediatamente
disponível para todos os binários cujo **canal** aponta para esse branch **e**
cujo **runtime (fingerprint)** corresponde.

### Promover um update já testado (sem rebundle)

```sh
# Publica no preview, valida, e promove exatamente o mesmo bundle para produção:
eas channel:edit production --branch preview     # aponta o canal para o branch validado
#   — ou —
eas update:roll-back-to-embedded --branch production   # reverte para o JS embebido no binário
```

---

## 3. Reverter (rollback)

Se um update OTA partir algo, **reverte sem nova revisão da loja**:

```sh
# Opção A — voltar ao JS que veio embebido no binário da loja:
eas update:roll-back-to-embedded --branch production --message "rollback emergência"

# Opção B — republicar a partir de um commit anterior:
git checkout <commit-bom> -- .
eas update --branch production --message "rollback: republica bundle estável"
```

O rollback chega aos dispositivos pelo mesmo mecanismo (próximo arranque).

---

## 4. Comportamento na app (UX)

`src/hooks/useOTAUpdates.ts`:

- **Não bloqueia o arranque** (`fallbackToCacheTimeout: 0`): a app abre sempre
  com o bundle que já tem em cache.
- Verifica updates **no arranque** e **sempre que volta ao primeiro plano**.
- Quando há novo bundle, descarrega-o **em silêncio** e mostra um toast discreto:
  *"Atualização disponível. Será aplicada ao reiniciar a app."*
- **Nunca força reload a meio da sessão** — o novo bundle entra no **próximo
  arranque** (a forma menos intrusiva e a recomendada).
- É **no-op** em desenvolvimento (`__DEV__`), no Expo Go e em builds sem OTA
  configurado (`Updates.isEnabled === false`). Qualquer falha (offline, endpoint
  inacessível) é silenciosa — a app continua com o bundle atual.

> Se um dia quiseres aplicar imediatamente, troca a estratégia por
> `Updates.reloadAsync()` após o `fetchUpdateAsync()` — mas só faz sentido se o
> fizeres ainda durante o splash, para não interromper o utilizador.

---

## 5. Builds e OTA juntos

- Os perfis em `eas.json` já trazem `channel`: `development`, `preview`,
  `production`. Cada build fica "preso" ao seu canal.
- No perfil `production`, `autoIncrement` sobe o `buildNumber`/`versionCode` a
  cada build de loja — isto **não** afeta o runtime de OTA (que é por fingerprint).
- Sempre que fizeres uma **alteração nativa**, tens de fazer **novo build** e
  **submeter** (ver `PUBLICACAO.md`); o fingerprint muda e os utilizadores no
  binário antigo deixam de receber novos updates OTA (continuam no último
  compatível) até atualizarem pela loja.

---

## 6. Resolução de problemas

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| `eas update` diz "no project id" | `EAS_PROJECT_ID` não definido | Secção 1 (`eas init` + env) |
| Update publicado mas não chega | Binário compilado antes do OTA / canal errado | Refazer build com o canal certo |
| Update publicado mas não chega | Fingerprint diferente (mudaste algo nativo) | Tens de submeter novo build à loja |
| App não verifica updates | `__DEV__` ou Expo Go | Testa num build EAS (`development`/`preview`) |
| Update partiu a app | Bug no JS publicado | `eas update:roll-back-to-embedded` (secção 3) |

Diagnóstico no dispositivo (build de desenvolvimento):

```sh
eas update:list --branch production      # histórico de updates do branch
eas channel:view production              # que branch o canal está a servir
```

---

## Checklist de ativação

- [ ] `eas init` feito e `EAS_PROJECT_ID` no `.env` **e** em `eas env:create`
- [ ] `npx expo config --type public` mostra `updates.url` e `runtimeVersion.policy: fingerprint`
- [ ] Novo build EAS feito **depois** de definir o `EAS_PROJECT_ID`
- [ ] `eas update --branch preview` testado num dispositivo interno
- [ ] Sabes reverter: `eas update:roll-back-to-embedded`
