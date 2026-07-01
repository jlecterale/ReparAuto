# RecarGarage — Cloud Functions

Entrega de **notificações push** (FCM) para a app mobile. Quando é criado um
documento em `notifications/{id}` (já escrito pela web e pela app — ex.: nova
mensagem de chat, anúncio aprovado), a função envia um push para todos os tokens
do destinatário guardados em `users/{uid}.fcmTokens`.

> A app mobile já regista o token e trata da apresentação/deep-link
> (`mobile/src/lib/push.ts`). Esta função é o único passo de backend que faltava.

## Função

- `pushOnNotification` — trigger Firestore `onCreate` em `notifications/{id}`,
  região `europe-west1`. Envia via `sendEachForMulticast` e remove tokens
  inválidos.

## Pré-requisitos

1. **Plano Blaze** no projeto `reparauto-site` (Cloud Functions v2 exige-o).
2. **APNs Auth Key (iOS)**: Firebase Console → *Project Settings* → *Cloud
   Messaging* → carregar a chave `.p8` da conta Apple Developer. Sem isto, o FCM
   **não entrega no iOS** (Android funciona via `google-services.json`).

## Instalar e fazer deploy

```sh
cd functions
npm install
npm run build          # tsc → lib/
firebase deploy --only functions
```

(O `firebase.json` já tem o `predeploy` que compila automaticamente.)

## Testar

1. Garantir que o utilizador-alvo abriu a app mobile pelo menos uma vez (para
   registar o token em `users/{uid}.fcmTokens`).
2. Enviar-lhe uma mensagem de chat a partir de outra conta (gera um doc em
   `notifications`).
3. Confirmar a chegada do push. Logs: `npm run logs`.

## Notas

- O payload inclui `data.link` para deep-linking (a app navega para esse caminho
  ao tocar na notificação).
- Tokens reportados como inválidos pelo FCM são removidos automaticamente do
  documento do utilizador.
