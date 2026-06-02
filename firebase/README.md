# Firebase — config nativa (Android / iOS)

Os plugins nativos (`@capacitor-firebase/messaging`, `@capacitor-firebase/authentication`)
chamam `FirebaseApp.configure()` no boot. Sem o arquivo de config nativo, o app
**crasha imediatamente** ao abrir. A config JS em `src/lib/firebase.ts` cobre só a web —
o lado nativo precisa destes arquivos.

## Arquivos a colocar aqui

Baixe do [Firebase Console](https://console.firebase.google.com/) → projeto `reparauto-site`
→ **Project Settings** → seus apps:

| Plataforma | Arquivo                     | App / bundle no Firebase |
|------------|-----------------------------|--------------------------|
| iOS        | `GoogleService-Info.plist`  | bundle `pt.reparauto.app` |
| Android    | `google-services.json`      | package `pt.reparauto.app` |

> Se o app iOS/Android ainda não existir no Firebase, clique em **Add app**,
> registre com o bundle/package `pt.reparauto.app` e baixe o arquivo gerado.

Resultado esperado:

```
firebase/
├── GoogleService-Info.plist   # iOS
└── google-services.json       # Android
```

## Onde cada arquivo precisa ir no build nativo

- **iOS**: `GoogleService-Info.plist` precisa estar em `ios/App/App/` **e** referenciado
  no target `App` do Xcode (Build Phases → Copy Bundle Resources).
- **Android**: `google-services.json` precisa estar em `android/app/`.

O script `npm run cap:sync` (e os `debug:*`) copia automaticamente os arquivos desta
pasta para os locais corretos antes de buildar — veja `scripts/copy-firebase-config.mjs`.

## Segurança

Estes arquivos contêm identificadores do projeto (API key, app id). Para apps móveis
Firebase eles são considerados públicos (assim como a config web em `src/lib/firebase.ts`),
mas o controle de acesso real vem das **regras** (`firestore.rules` / `storage.rules`) e do
App Check. Decida no `.gitignore` se quer versioná-los ou mantê-los só localmente.
