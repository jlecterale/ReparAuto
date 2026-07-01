# 22 — Vincular Métodos de Login (Account Linking) — Web + Mobile

## Contexto / problema

Uma conta no Firebase Auth é identificada pelo **provider + UID**. Hoje um
utilizador pode entrar por email/password, Google ou Apple, mas **não tem forma de
associar mais do que um método à mesma conta**. Isto cria um ponto único de falha,
sobretudo por causa do *Sign in with Apple*:

- Quem se registou com **Apple + "Ocultar o meu email"** fica com uma identidade
  `xxxx@privaterelay.appleid.com`. Esse endereço **não serve** para login por
  password (o utilizador não o escreve nem recebe lá correio arbitrário) e **não faz
  auto-merge** com o email Google da pessoa.
- Se essa pessoa troca de telemóvel (iPhone → Android) ou perde o dispositivo, no
  Android só vê Google + email/password → **fica trancada fora da conta** e perde
  favoritos, anúncios e histórico de chat, criando uma conta nova com UID diferente.

A solução é deixar o utilizador **adicionar métodos de login à conta que já tem**
(`linkWithCredential` / `linkWithPopup`), para que possa entrar por qualquer um deles
em qualquer plataforma, sempre com o **mesmo UID**.

**A peça que fecha o problema:** o *Sign in with Apple* já existe no site (plano do
PR de login web). Logo, mesmo quem perdeu o iPhone consegue **entrar no browser com a
Apple ID** (que não depende do dispositivo — só das credenciais Apple) e **vincular ali**
um Google/password. O site passa a ser o **paraquedas universal de recuperação**;
com isto, *não é preciso* Apple no Android.

## Benchmark competitivo

A pesquisa confirmou que **gestão explícita de métodos de login é rara ou inexistente**
nestes marketplaces — quase todos oferecem vários providers no *ecrã de login*, mas
**não** expõem um ecrã para ligar/desligar métodos numa conta existente:

- **OLX PT / OLX Brasil / Standvirtual** (mesma stack de auth do grupo OLX): Google,
  Facebook e Apple como métodos de *entrada*; a documentação de ajuda cobre "fazer
  login", mas **não** descreve um ecrã de "contas associadas". A Standvirtual nota que
  o Apple ID não partilha foto de perfil.
- **Mercado Livre / ML Veículos:** a segurança gira em torno de **2FA / métodos de
  verificação** (Google Authenticator, push, SMS/WhatsApp), **não** de ligar providers
  sociais. Há reclamações recorrentes (Reclame Aqui) de gente **trancada fora** depois
  de mudanças no método de acesso ou após ligar o Google — exatamente a classe de
  problema que este plano resolve.
- **Webmotors, iCarros, Mobiauto, AutoScout24, CustoJusto:** sem documentação pública
  de um fluxo de "adicionar método de login" — reportado como *não encontrado*, não
  inventado.

**Leitura:** um ecrã limpo de "Métodos de login" é um **diferenciador** aqui, não o
mínimo esperado — mas os fios de reclamação dos concorrentes (lock-out após mudança de
login social) confirmam que a dor é real e vale resolver.

## Decisões

- **Fluxo principal = adicionar método enquanto já autenticado.** Como Apple + relay
  não faz auto-merge, o utilizador tem de estar logado (por qualquer método) e então
  **adicionar ativamente** os outros. Nada de tentar fundir contas em silêncio no login.
- **Manter a definição do projeto em "One account per email".** É a que permite
  auto-link por email verificado e retorno de perfil dos providers; "Multiple accounts
  per email" tornaria o linking mais frágil e é a escolha errada aqui.
- **Salvaguarda dura:** nunca permitir remover o **último** método; antes de desligar
  um provider social, exigir **definir uma password** (ou outro provider), para a pessoa
  nunca ficar sem forma de entrar.
- **Simetria web + app**, mas a **web é o paraquedas** — se só houver tempo para uma
  superfície primeiro, é a web (é onde quem perdeu o telemóvel consegue chegar).
- **Sem alterações de schema Firestore nem de regras de segurança** no caminho
  principal — é tudo Firebase Auth sobre o `currentUser`. O único ponto que toca
  Firestore é o **merge de dados** no caso de conflito (ver Casos extremos), tratado à
  parte e explicitamente delimitado.

## User stories

- Como utilizador que se registou com **Apple no iPhone**, quero **definir uma password**
  ou **ligar o meu Google** na minha conta, para conseguir entrar no Android/site mais
  tarde sem perder nada.
- Como utilizador que **perdeu o iPhone**, quero **entrar com a Apple no site** e a partir
  daí **adicionar outro método**, para recuperar o acesso à minha conta original.
- Como utilizador, quero **ver quais métodos estão ligados** à minha conta e **remover**
  um que já não uso — sem risco de me trancar fora.
- Como utilizador que sem querer **criou uma segunda conta** no Android, quero uma
  mensagem clara de que aquele Google/email **já tem conta**, para entrar por ela em vez
  de duplicar.

## Âmbito

### Tipos (`src/types/` e `mobile/src/`)

- Nenhuma mudança de modelo de dados. O estado dos providers ligados lê-se de
  `auth.currentUser.providerData` (cada entrada tem `providerId`, `email`, `uid`).
- Novo tipo de apoio partilhado por UI, ex.: `LinkedProvider = { id: 'password' |
  'google.com' | 'apple.com'; email: string | null; connected: boolean }`.

### Lógica de auth (testável — TDD)

Camada fina e pura sobre o SDK, mas com lógica de decisão que **deve** ser coberta por
testes (a parte "qual botão fica desativado", "isto pode ser removido?", tradução de
erros):

- **Web `src/lib/auth.ts`** e **Mobile `mobile/src/lib/auth.ts`**:
  - `linkGoogle()` — `linkWithPopup` (web) / `linkWithCredential` a partir da credencial
    nativa (mobile).
  - `linkApple()` — idem para `apple.com`.
  - `linkPassword(email, password)` — `EmailAuthProvider.credential` + `linkWithCredential`.
  - `unlinkProvider(providerId)` — `unlink`, com reautenticação prévia quando o SDK pedir.
  - `listLinkedProviders()` — deriva a lista a partir de `providerData`.
- **`src/lib/authLinking.ts` (novo, puro e testável)** — funções sem SDK:
  - `canUnlink(providers, providerId)` → `false` se for o último método.
  - `deriveLinkState(providerData)` → `LinkedProvider[]` para renderizar.
  - `mapLinkError(code)` → mensagem PT para `credential-already-in-use`,
    `email-already-in-use`, `provider-already-linked`, `account-exists-with-different-credential`,
    `requires-recent-login`.

### UI

- **Web — `src/screens/PerfilScreen` (ou equivalente) → nova secção "Métodos de login"**
  em Definições/Segurança: lista Google, Apple, Email+Password com estado
  ligado/não-ligado (ícone **+** texto, nunca só cor — WCAG 1.4.1), o email associado, e
  um botão por linha (Ligar / Desligar). Botão de "Desligar" **desativado** quando é o
  último método. Fluxo "Definir password" quando ainda não existe. Toasts de
  sucesso/erro; re-leitura de `providerData` após cada ação.
- **Mobile — `mobile/src/` ecrã de Perfil/Definições:** mesma secção e regras.
- Nota de **consentimento Apple** no fluxo de ligação (política da Apple sobre associar
  dados identificáveis a um ID anonimizado).

### Firestore / regras

- Caminho principal: **sem mudanças**. O merge de dados do caso de conflito (abaixo) é o
  único que leria/escreveria Firestore e fica **fora do MVP** — documentado como fluxo
  de suporte/etapa 2.

## Sequência de commits (test-first)

1. **`test(auth): pure linking helpers`** — `authLinking.test.ts`: `canUnlink`,
   `deriveLinkState`, `mapLinkError` (RED → GREEN sobre `src/lib/authLinking.ts`).
2. **`feat(auth): link/unlink wrappers`** — `linkGoogle/linkApple/linkPassword/unlink`
   em `src/lib/auth.ts` (web). Wrappers finos (exceção TDD), verificados por tsc/build.
3. **`feat(perfil): login methods section (web)`** — secção "Métodos de login" com
   estados e salvaguarda do último método.
4. **`feat(auth,perfil): mobile parity`** — espelho no `mobile/`.
5. **`docs: mark plan 22 shipped`** — quando entregar, virar o `implemented` no
   `docs/plans/index.html`.

## Casos extremos

- **Apple private relay:** confirmado que **não** há auto-merge — a credencial Apple não
  pode ser reutilizada para ligar a uma conta existente por email. O utilizador tem de
  estar autenticado e adicionar ativamente. É o próprio motivo da funcionalidade.
- **Provider já ligado** (`auth/provider-already-linked`): botão "Ligar" fica em estado
  "Ligado" e desativado.
- **Credencial já pertence a outra conta** (`auth/credential-already-in-use` /
  `email-already-in-use` / `account-exists-with-different-credential`): **não dá para
  ligar** — o Firebase não funde os dados por nós. MVP: mensagem clara ("esse Google/email
  já tem conta — entre por ela"). Etapa 2 (suporte): padrão `fetch methods → sign-in na
  conta existente → merge de favoritos/anúncios no Firestore por nós → apagar conta
  redundante`. *Nota:* `fetchSignInMethodsForEmail` pode vir vazio por proteção contra
  enumeração de email — tratar o **erro lançado**, não confiar só nesse fetch.
- **Remover o último método:** bloqueado por `canUnlink` (testado). Antes de remover um
  social, oferecer "Definir password primeiro".
- **`auth/requires-recent-login`** no unlink (e o bug conhecido unlink→relink imediato,
  firebase-js-sdk #6420): fazer `reauthenticateWithCredential` e repetir.
- **Mobile / React Native Firebase:** a API espelha a web, mas corre sobre os SDKs
  nativos — testar que **ligar o Google não *substitui* o Apple** (discussion #5897) e
  que os erros de conflito surgem corretamente (#4911), nas versões de BOM em uso.

## Verificação

- `npm test` — helpers puros de linking verdes (RED→GREEN demonstrável).
- Web: `npx tsc --noEmit` e `npm run build` — limpos.
- Mobile: `npx tsc --noEmit` — limpo.
- Manual (web): entrar por Apple → definir password → sair → entrar por email/password
  (mesmo UID, favoritos intactos). Ligar Google. Tentar remover o último método (deve
  estar bloqueado). Tentar ligar um Google que já tem conta (mensagem clara).
- Manual (mobile): mesma bateria; confirmar que ligar Google não remove o Apple.
