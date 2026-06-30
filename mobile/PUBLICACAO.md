# Publicação nas lojas — RecarGarage (iOS & Android)

Guia passo a passo para publicar a app na **Apple App Store** e na **Google
Play**, usando **EAS** (Expo Application Services). Bundle id / package:
**`com.recargarage`** nas duas plataformas.

> Faz tudo a partir da pasta `mobile/`.

---

## 0. Pré-requisitos (uma vez)

| Item | Notas |
| --- | --- |
| **Conta Apple Developer** | 99 €/ano — https://developer.apple.com/programs/ |
| **Conta Google Play Console** | 25 € (pagamento único) — https://play.google.com/console |
| **EAS CLI** | `npm i -g eas-cli` e `eas login` |
| **App no Firebase** | Apps iOS **e** Android registadas no projeto `reparauto-site` com o id `com.recargarage` |
| **Ficheiros nativos Firebase** | `firebase/GoogleService-Info.plist` e `firebase/google-services.json` (ver `firebase/README.md`) |
| **`.env`** | Copiar de `.env.example` e preencher (ver abaixo) |

### Variáveis de ambiente

```
GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.XXXX   # REVERSED_CLIENT_ID do plist
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=XXXX.apps.googleusercontent.com  # OAuth client tipo 3
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=XXXX   # Maps SDK for Android (mapa de oficinas)
```

> **Mapa (Android)**: criar a chave em Google Cloud Console → **Maps SDK for
> Android**, restringi-la ao package `com.recargarage` + SHA-1. No iOS o mapa
> usa **Apple Maps** (sem chave).
>
> **Push (entrega real)**: a app já regista o token FCM; para entregar push com
> a app fechada, falta uma Cloud Function — ver
> [`docs/PUSH-BACKEND.md`](./docs/PUSH-BACKEND.md). No iOS é preciso carregar a
> **APNs Auth Key** no Firebase Console → Cloud Messaging.

No EAS, garante que estas variáveis e os ficheiros do Firebase existem no build:
ou commitas num repositório privado, ou usas **EAS secrets / EAS file env**
(`eas env:create`). **Nunca** commitar credenciais reais num repositório público.

---

## 1. Inicializar o EAS

```sh
eas init                 # cria o projeto EAS e preenche extra.eas.projectId
eas build:configure      # gera/atualiza eas.json (já incluído)
```

---

## 2. Configurar capacidades específicas

### iOS — Sign in with Apple
1. Apple Developer → **Certificates, Identifiers & Profiles** → o **App ID**
   `com.recargarage` → ativar a capability **Sign In with Apple**.
   (O `app.config.ts` já declara `ios.usesAppleSignIn: true`.)
2. Firebase Console → **Authentication → Sign-in method** → ativar **Apple**.

### Android — Google Sign-In (SHA)
1. Obter as fingerprints da chave de assinatura do EAS:
   ```sh
   eas credentials   # Android → ver/!gerar keystore → copiar SHA-1 e SHA-256
   ```
2. Firebase Console → **Project Settings → app Android `com.recargarage`** →
   adicionar **SHA-1** e **SHA-256**.
3. Voltar a transferir o `google-services.json` atualizado para `firebase/`.

### Firebase — métodos de login
Ativar em **Authentication → Sign-in method**: **Email/Password**, **Google**, **Apple**.

---

## 3. Builds de produção

```sh
# iOS (.ipa assinado na nuvem — gere certificados/perfis automaticamente)
eas build --platform ios --profile production

# Android (.aab para a Play Store)
eas build --platform android --profile production
```

> O React Native Firebase exige um build nativo (Dev Client / EAS). **Não corre
> no Expo Go.** Para testar localmente antes: `eas build --profile development`
> e abrir com `npm run start`.

---

## 4. Submeter

```sh
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

Em alternativa, faz upload manual: o `.ipa` no **App Store Connect** (via
Transporter) e o `.aab` na **Play Console**.

---

## 5. App Store Connect (iOS)

1. **My Apps → +** → criar a app com o bundle id `com.recargarage`.
2. **TestFlight**: testar o build interno antes de submeter para revisão.
3. **App Information / Pricing**: categoria, preço (gratuito).
4. **App Privacy** (nutrition labels): declarar os dados recolhidos —
   *Contact Info* (email, telefone), *User Content* (fotos, mensagens de chat),
   *Identifiers* (user id, token de push) e *Location* (aproximada, em uso, para
   o mapa de oficinas). Indicar que **não** há tracking.
5. **Preparar para submissão**: preencher os textos (ver
   `store/textos-lojas-pt-PT.md`), screenshots (6.7", 6.5", 5.5" e iPad 12.9"),
   ícone 1024×1024, URL da política de privacidade e de suporte.
6. **Notas para o revisor**: fornecer uma **conta de teste** (email/password) e
   referir que a app permite navegar como convidado.
7. **Submeter para revisão.**

### Pontos de conformidade já tratados (evitam rejeição)
- Eliminação de conta in-app (Perfil → Eliminar conta) — Guideline 5.1.1(v).
- Sign in with Apple presente porque há login Google — Guideline 4.8.
- Navegação sem registo (convidado) — Guideline 5.1.1(i).
- Permissões mínimas: só câmara, pedida em runtime — Guideline 5.1.1 / 2.5.x.

---

## 6. Google Play Console (Android)

1. **Criar app** → nome, idioma padrão **Português (Portugal)**, gratuita.
2. **Testing → Internal testing**: subir o `.aab` e testar.
3. **Store listing**: textos (ver `store/textos-lojas-pt-PT.md`), ícone
   512×512, *feature graphic* 1024×500, screenshots de telefone (mín. 2).
4. **App content** (obrigatório):
   - **Data safety**: declarar dados recolhidos (email, telefone, fotos, user
     id), encriptados em trânsito, e a opção de eliminação de conta.
   - **Privacy policy**: URL.
   - **Content rating**: preencher o questionário (classificação ~PEGI 3 / 3+).
   - **Target audience**: maiores de idade / não dirigida a crianças.
   - **Permissões**: como **não** declaramos `READ_MEDIA_IMAGES`, **não** é
     preciso o formulário de *Photo & Video Permissions*.
5. **Production**: promover o build para produção e enviar para revisão.

---

## 7. Atualizações futuras

- **Código JS/TS (sem alterar nativo)**: `npm run update:production` (OTA via
  EAS Update, **sem** nova revisão da loja). A app já está ligada para receber
  estes updates — passo a passo completo (ativação, publicação, rollback) em
  [`docs/OTA-UPDATES.md`](./docs/OTA-UPDATES.md). Requer `EAS_PROJECT_ID`
  definido antes de fazer o build da loja.
- **Alterações nativas** (novas libs/permissões, ex.: Fases 4/5): novo
  `eas build` + `eas submit` e nova revisão. Estas mudam o *fingerprint* do
  runtime, por isso **não** podem ir por OTA.
- **Versionamento**: subir `version` no `app.config.ts`; o `buildNumber`/
  `versionCode` é auto-incrementado (`autoIncrement` no perfil `production`).

---

## Checklist rápido antes de submeter

- [ ] `npm run typecheck` sem erros e `npx expo-doctor` 19/19
- [ ] Ficheiros do Firebase em `firebase/` e SHA adicionados (Android)
- [ ] Sign in with Apple ativo (Apple Developer + Firebase)
- [ ] Conta de teste criada para os revisores
- [ ] Política de privacidade e página de suporte publicadas (URLs)
- [ ] Screenshots e ícones nos tamanhos exigidos
- [ ] Textos das lojas revistos (`store/textos-lojas-pt-PT.md`)
