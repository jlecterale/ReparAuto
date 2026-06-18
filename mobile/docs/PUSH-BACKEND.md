# Push notifications — backend (Cloud Function)

A app **regista o token FCM** de cada dispositivo em `users/{uid}.fcmTokens`
(ver `src/lib/push.ts`) e trata da apresentação em foreground e do tap
(deep-link). As **notificações in-app** (coleção `notifications`, em tempo real)
já funcionam sem backend.

Para **entregar push quando a app está fechada**, é necessária uma Cloud
Function que, ao ser criada uma notificação, envia FCM para os tokens do
destinatário. **Essa função já está implementada no repositório**, em
[`functions/`](../../functions) (`pushOnNotification`) — só falta fazer o deploy.

## Ativar (resumo)

```sh
cd functions
npm install
firebase deploy --only functions
```

Pré-requisitos: projeto `reparauto-site` no **plano Blaze** e, para iOS,
a **APNs Auth Key** carregada no Firebase Console → Cloud Messaging. Detalhes
completos em [`functions/README.md`](../../functions/README.md).

---

## Função de referência (já incluída em `functions/src/index.ts`)

```ts
// functions/src/index.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();

export const pushOnNotification = onDocumentCreated(
  'notifications/{id}',
  async (event) => {
    const n = event.data?.data();
    if (!n) return;

    const userSnap = await getFirestore().doc(`users/${n.uid}`).get();
    const tokens: string[] = userSnap.get('fcmTokens') ?? [];
    if (tokens.length === 0) return;

    const res = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title: n.titulo, body: n.mensagem },
      data: { link: n.link ?? '' },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });

    // Limpar tokens inválidos.
    const invalid: string[] = [];
    res.responses.forEach((r, i) => {
      if (
        !r.success &&
        ['messaging/registration-token-not-registered',
         'messaging/invalid-argument'].includes(r.error?.code ?? '')
      ) {
        invalid.push(tokens[i]);
      }
    });
    if (invalid.length) {
      await userSnap.ref.update({ fcmTokens: FieldValue.arrayRemove(...invalid) });
    }
  },
);
```

## Passos para ativar

1. No projeto `reparauto-site`, criar a pasta `functions/` (`firebase init functions`,
   TypeScript) e colar a função acima.
2. **iOS**: no Firebase Console → **Cloud Messaging** → carregar a **APNs Auth
   Key** (.p8) da conta Apple Developer. Sem isto, o FCM não entrega no iOS.
3. `firebase deploy --only functions`.
4. Testar: criar uma mensagem na app (gera um doc em `notifications`) e
   confirmar a chegada do push no dispositivo do destinatário.

> A app já está pronta do lado do cliente: pede permissão, guarda o token,
> mostra push em foreground e faz deep-link ao tocar. Só falta esta função.
