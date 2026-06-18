# ReparAuto — App Mobile (React Native + Expo)

App nativa iOS/Android do marketplace ReparAuto, construída com **Expo SDK 55**,
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
      autenticação (email + Google), navegação protegida, design system.
- [x] **Fase 2 (parcial)**: listagem de carros em tempo real + detalhe.
- [ ] **Fase 2 (resto)**: peças, oficinas, favoritos, filtros.
- [ ] **Fase 3**: anunciar (câmara/upload) + perfil completo.
- [ ] **Fase 4**: chat em tempo real + notificações push.
- [ ] **Fase 5**: intenções, confiança, mapa de oficinas.
- [ ] **Fase 6**: polimento, offline e submissão às lojas.
