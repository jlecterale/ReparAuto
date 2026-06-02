# App ReparAuto (Android/iOS) — Como as atualizações funcionam

Este documento responde a uma dúvida central do projeto:

> **Quando eu mudo algo no site, o app já reflete automaticamente? Ou toda vez que eu adicionar algo no site vou precisar publicar um novo release do app?**

A resposta curta é: **depende do tipo de mudança.** Conteúdo aparece na hora; mudanças de
código/visual exigem um novo release nas lojas. Os detalhes estão abaixo.

> Para o passo a passo de setup, build e submissão, veja
> [`docs/app-nativa-setup.md`](../app-nativa-setup.md) e
> [`docs/lojas-submissao.md`](../lojas-submissao.md).

---

## Por que existe essa diferença?

O app **não** é um app separado com código próprio. Ele é um **shell nativo Capacitor**
que carrega a **mesma codebase do site** (Next.js + React). A diferença está em *como* cada
parte chega até o usuário:

- **Os dados** (anúncios, preços, peças, oficinas, fotos, perfis, chat, notificações) vêm
  do **Firebase (Firestore + Storage) em tempo real**, via o SDK JS — exatamente como no
  site. O app busca esses dados ao vivo, toda vez que abre/atualiza a tela.

- **A interface (código/visual)** é empacotada **dentro do binário** do app no momento do
  build. O Capacitor está configurado com `webDir: 'out'` (um *export estático* do
  Next.js) e **sem `server.url`** — ou seja, o app carrega uma "fotografia" da UI gravada
  dentro do APK/IPA. Ele **não** baixa a UI do site ao vivo.

Resultado: dados são dinâmicos (atualizam sozinhos), mas o código/visual fica "congelado"
na versão que foi publicada nas lojas.

---

## Tabela resumo — o que reflete sozinho e o que exige novo release

| Tipo de mudança | No site (web) | No app (Android/iOS) |
|---|---|---|
| Novo anúncio, peça ou oficina | Imediato | **Imediato** (vem do Firebase) |
| Mudar preço, descrição, fotos de um anúncio | Imediato | **Imediato** |
| Aprovar / rejeitar / remover anúncio (admin) | Imediato | **Imediato** |
| Imagens novas no Storage | Imediato | **Imediato** |
| Mudança nas regras do Firestore/Storage | Imediato | **Imediato** |
| Nova tela, componente ou layout (código) | Deploy do site | **Novo release nas lojas** |
| Correção de bug no código (`.ts`/`.tsx`) | Deploy do site | **Novo release nas lojas** |
| Texto fixo/estático embutido na UI | Deploy do site | **Novo release nas lojas** |
| Permissões nativas, ícones, splash, plugins | — | **Novo release nas lojas** |

**Regra prática:** se a mudança é **conteúdo/dado** (algo que você cadastra ou aprova pelo
site/admin), o app mostra na hora. Se a mudança é **código** (mexer em arquivos do projeto
e fazer deploy), o app só reflete depois de um novo release.

---

## Exemplos do dia a dia

- **"Adicionei um carro novo / mudei um preço / aprovei um anúncio."**
  → Aparece **na hora** no app, sem republicar. É conteúdo do Firebase.

- **"Mudei o layout da tela de detalhes / adicionei um botão / corrigi um bug."**
  → É código embutido no binário. Precisa de **`cap:sync` + rebuild + nova submissão** na
  Play Store / App Store para o app refletir.

- **"Mudei um texto que está escrito direto no componente (ex.: rótulo de um botão)."**
  → Isso é código. **Precisa de novo release.** (Se esse texto viesse do Firestore, seria
  imediato — mas hoje ele vem do código.)

---

## Como publicar um novo release do app (quando o código muda)

```sh
npm run cap:sync      # rebuild do out/ + copia a UI atualizada para android/ e ios/
npm run cap:android   # abre o Android Studio para gerar o binário assinado
npm run cap:ios       # abre o Xcode (somente em macOS)
```

Depois, gere o build assinado e envie para a loja (veja
[`docs/lojas-submissao.md`](../lojas-submissao.md)). Só após a aprovação/publicação da loja
os usuários recebem as mudanças de código.

---

## E se eu quiser que mudanças de código também apareçam sem republicar?

Hoje **não** está configurado — por padrão, mudança de código = novo release. Se no futuro
isso virar uma necessidade, existem duas abordagens (cada uma com trade-offs):

1. **Apontar o Capacitor para o site ao vivo** (`server.url` na `capacitor.config.ts`).
   O app passaria a carregar a UI direto do site, então **toda** mudança refletiria
   imediatamente. Em troca, perde o funcionamento offline, exige conexão sempre, e algumas
   lojas têm restrições para apps que são "só um navegador" do site.

2. **Atualizações Over-the-Air (OTA / Live Updates)** — ferramentas como Capacitor Live
   Updates (Appflow) ou Capgo entregam um novo bundle de UI direto ao app, sem passar pela
   revisão da loja (dentro das regras das lojas). Mudanças *nativas* (plugins, permissões,
   ícones) continuam exigindo release.

Enquanto nenhuma dessas estiver ativa, vale a regra da tabela acima: **dados = imediato,
código = novo release.**
