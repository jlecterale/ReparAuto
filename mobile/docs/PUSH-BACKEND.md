# Push notifications — backend (Cloud Function)

A app **regista o token FCM** de cada dispositivo em `users/{uid}.fcmTokens`
(ver `src/lib/push.ts`), trata da apresentação em foreground, do handler de
background (`setBackgroundMessageHandler`) e do tap (deep-link). As
**notificações in-app** (coleção `notifications`, em tempo real) funcionam
sempre, mesmo sem backend.

A entrega de **push com a app fechada** é feita pela Cloud Function
`pushOnNotification` em [`functions/`](../../functions): ao ser criado um
documento em `notifications/{id}`, envia FCM para os tokens do destinatário.

> ✅ **Estado: a função já está implementada e deployada** no projeto
> `reparauto-site` (região `europe-west1`). Não é preciso mais nenhum passo do
> lado do backend para o funcionamento normal.

## O que a função faz (`functions/src/index.ts`)

- **`pushOnNotification`** — trigger em `onDocumentCreated('notifications/{id}')`.
  Lê os `fcmTokens` do utilizador, envia um multicast FCM (`notification` +
  `data: { link, tipo }`, `android.notification.channelId: 'default'`,
  `apns.sound: 'default'`) e remove automaticamente os tokens que o FCM reporta
  como inválidos.
- **`notifyAdminsOnCarPending` / `...PartPending` / `...ServicePending`** —
  quando um anúncio é criado com `status: 'pendente'`, escrevem uma notificação
  `info` (com `link: '/admin'`) para cada admin; o `pushOnNotification` acima
  converte cada uma num push.

## Re-deploy (quando a função mudar)

```sh
cd functions
npm install
firebase deploy --only functions
```

Pré-requisitos (já satisfeitos): projeto no **plano Blaze** e, para iOS, a
**APNs Auth Key** (.p8) carregada no Firebase Console → Cloud Messaging — sem
ela o FCM não entrega em iOS. Detalhes em
[`functions/README.md`](../../functions/README.md).

## Testar

Criar uma mensagem na app (gera um doc em `notifications`) e confirmar a
chegada do push no dispositivo do destinatário com a app fechada.
