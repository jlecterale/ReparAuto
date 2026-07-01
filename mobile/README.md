# RecarGarage — App Mobile (React Native + Expo)

App nativa iOS/Android do marketplace RecarGarage, construída com **Expo SDK 55**,
**Expo Router**, **NativeWind** e **React Native Firebase**. Partilha o mesmo
backend Firebase (`reparauto-site`) do site, pelo que usa os mesmos dados,
utilizadores e regras de segurança.

> Implementação alinhada com `docs/plans/19-app-react-native.html`.
> Bundle id (iOS e Android): **`com.recargarage`**.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Expo SDK 55 (Dev Client) · React Native 0.83 · React 19 |
| Navegação | Expo Router (rotas por ficheiros, com typed routes) |
| Estilos | NativeWind 4 (tokens de marca em `tailwind.config.js`) |
| Backend | `@react-native-firebase/*` (Auth, Firestore, Storage, Messaging) |
| Auth | Email/password + Google Sign-In nativo |

## Pré-requisitos

1. Node 20+, e o EAS CLI: `npm i -g eas-cli`.
2. Colocar os ficheiros nativos do Firebase em `firebase/` (ver
   [`firebase/README.md`](./firebase/README.md)).
3. Copiar `.env.example` para `.env` e preencher os valores.

## Arranque

```sh
npm install
npx expo prebuild            # gera ios/ e android/ (necessário p/ RN Firebase)
npm run ios                  # ou: npm run android
npm run typecheck            # tsc --noEmit
```

> O React Native Firebase exige um **Dev Client** (não corre no Expo Go).
> Use `npx expo run:ios` / `run:android` ou builds EAS de desenvolvimento.

## Estrutura

```
app/                      # Expo Router (espelha as rotas do site)
├── _layout.tsx           # providers + navegação protegida por auth
├── (auth)/               # login, registar  (utilizador não autenticado)
├── (tabs)/               # Início, Peças, Oficinas, Favoritos, Perfil
├── detalhes/[id].tsx     # detalhe do carro (galeria + contacto)
└── anunciar.tsx          # assistente de anúncio (Fase 3)
firebase/                 # google-services.json / GoogleService-Info.plist
src/
├── components/ui/        # Button, Input, Logo, Screen, …
├── context/              # AuthContext, ToastContext
├── hooks/                # useCarros, …
├── lib/                  # firebase, auth, db, format
├── theme/                # colors (tokens de marca)
└── types/                # tipos de domínio (espelham src/types do site)
assets/                   # ícones e splash gerados a partir do logo da marca
```

## Estado da implementação (roadmap)

- [x] **Fase 1 — Fundação**: Expo + Router + NativeWind, Firebase nativo,
      autenticação (email + Google + Apple), navegação, design system.
- [x] **Fase 2 — Descoberta & Detalhe**: listagens em tempo real de carros,
      peças e oficinas, com pesquisa e filtros; ecrãs de detalhe; favoritos
      (conta + anónimo via AsyncStorage). Navegação aberta a convidados —
      login só é exigido para ações (favoritar, anunciar).
- [x] **Fase 3 — Anunciar & Perfil**: assistente para anunciar **carro**,
      **peça** e **oficina** (fotos via câmara/galeria, upload para
      `ads/{uid}`, criação como `pendente`); **editar perfil** e **os meus
      anúncios** (listar por estado + eliminar).
- [x] **Fase 4 — Chat & Notificações**: chat em tempo real (separador
      Mensagens, conversas, badge de não lidas), notificações in-app e **push**
      (FCM; token guardado em `users/{uid}.fcmTokens`, ver
      [`docs/PUSH-BACKEND.md`](./docs/PUSH-BACKEND.md)).
- [x] **Fase 5 — Procuras, Confiança & Mapa**: intenções de compra (procuras),
      **mapa de oficinas** (react-native-maps + localização), **avaliações** e
      **denúncias** de anúncios.
- [x] **Fase 6 — Polimento & Submissão**: banner offline (expo-network),
      ecrã **Definições** (versão + Termos/Privacidade/Cookies/Segurança/FAQ via
      browser), rodapé legal no login, feedback háptico nos favoritos. Pronta
      para submissão via EAS (ver `PUBLICACAO.md`).

## Conformidade com as lojas (já tratado)

- **Eliminação de conta in-app** (App Store 5.1.1(v)) — em Perfil → "Eliminar conta".
- **Sign in with Apple** (App Store 4.8) — apresentado no iOS quando há login Google.
- **Navegação sem registo** (App Store 5.1.1(i)) — convidados navegam livremente.
- **Permissões mínimas e contextuais** — pedidas em runtime, só quando a
  funcionalidade as usa:
  - **Galeria**: usa o **Photo Picker** do sistema → sem permissão (Android
    13+/iOS PHPicker). Não declaramos `READ_MEDIA_IMAGES` (evita o formulário
    "Photo & Video Permissions" do Google Play).
  - **Câmara**: pedida só ao tocar em "Tirar foto" no Anunciar.
  - **Notificações**: pedidas no registo de push (Fase 4).
  - **Localização**: pedida só ao usar "perto de mim" no mapa de oficinas (Fase 5).

## Publicação nas lojas

O passo a passo completo (Apple App Store + Google Play, via EAS) está em
[`PUBLICACAO.md`](./PUBLICACAO.md). Os textos das fichas das lojas (pt-PT) estão
em [`store/textos-lojas-pt-PT.md`](./store/textos-lojas-pt-PT.md).

## Atualizações OTA (EAS Update)

Correções e melhorias de **JS/TS, estilos e assets** chegam aos utilizadores
**sem nova revisão da loja** via **EAS Update** (`expo-updates`). A app já está
ligada para verificar e descarregar updates em silêncio (aplica no próximo
arranque). Ativação, publicação (`npm run update:production`) e rollback em
[`docs/OTA-UPDATES.md`](./docs/OTA-UPDATES.md).
