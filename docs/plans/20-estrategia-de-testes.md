# 20 — Estratégia de Testes (TDD + Jest)

> Estado: **Fase 0 e 1 implementadas** (harness web + mobile a verde, 58 testes).
> Restantes fases descritas abaixo como backlog priorizado.

Antes desta iniciativa o projeto não tinha **qualquer** ferramenta de testes nem
testes automatizados — a única verificação era `npx tsc --noEmit` + `npm run build`.
Este plano introduz Jest nas três áreas (web, mobile, functions) e estabelece
**TDD como prática obrigatória** para qualquer mudança futura (ver `CLAUDE.md` →
secção _Testing & TDD_).

As skills usadas como referência metodológica vivem em `.agents/skills/`:
- `tdd` — red→green→refactor em fatias verticais (um teste → uma implementação),
  testar **comportamento** através da interface pública, _mock_ só em fronteiras.
- `javascript-typescript-jest` — convenções Jest (estrutura, _mocking_, async, RTL).

---

## 1. Ferramentas por área

| Área | Runner | Ambiente | Notas |
| --- | --- | --- | --- |
| **Web** (`/`) | Jest 30 + `next/jest` | `jsdom` | SWC transform via `next/jest`; alias `@/`→`src/`. Config: `jest.config.js`. |
| **Mobile** (`mobile/`) | Jest + `jest-expo` 55 | RN preset | Transform Expo/RN + `transformIgnorePatterns`. Config: `mobile/jest.config.js`. |
| **Functions** (`functions/`) | `ts-jest` + `firebase-functions-test` | `node` | _A configurar_ (Fase 2). Trigger Firestore → mock de `getFirestore`/`getMessaging`. |
| Componentes | `@testing-library/react` (web) / `@testing-library/react-native` (mobile) | — | Testar comportamento/acessibilidade, `userEvent` > `fireEvent`. |

Comandos (já ligados em `package.json`):

```sh
npm test                     # testes web (Jest)
npm run test:watch           # modo watch
npm run test:coverage        # cobertura
npm --prefix mobile run test # testes mobile (jest-expo)
```

---

## 2. Mapa de pontos críticos (o que testar e porquê)

Organizado pelas categorias de risco mais relevantes da app. Prioridade =
`impacto × probabilidade de regressão × facilidade de teste`.

### 2.1 Cálculos e validações puras — **prioridade máxima** (sem I/O, alto valor)

| Módulo | Função | Porque é crítico |
| --- | --- | --- |
| `src/lib/utils.ts` | `validarNif` | _Checksum_ mod-11; um erro deixa passar NIFs inválidos. |
| `src/lib/utils.ts` | `renderDescricao` | **Escapa HTML** antes de alimentar `dangerouslySetInnerHTML` → vetor de XSS se quebrar. |
| `src/lib/utils.ts` | `validarIntencaoCompra` | Porta de entrada de dados de intenção (muitas regras de negócio). |
| `src/lib/utils.ts` | `validarTelefone`, `validar/formatarCodigoPostal`, `obterWhatsApp`, `formatarPreco`, `gerarTituloIntencao` | Formatadores/validadores visíveis ao utilizador. |
| `src/lib/profanity.ts` | `contemProfanity` | Moderação; normaliza _leetspeak_ — fácil de regredir. |
| `src/lib/geo.ts` | `haversineKm` + lookups | Distância para o filtro por raio; erro silencioso afeta resultados. |
| `mobile/src/lib/format.ts` | `formatPreco`, `formatPrecoOpcional` | Preço "Sob consulta" vs. valor. |

> ✅ **Implementado nesta fase** (`*.test.ts` ao lado de cada módulo).

### 2.2 Correspondência e sugestões ("coach"/matching) — **prioridade alta**

O motor de compatibilidade é **pura** e alimenta as notificações de
"peça encontrada" e a contagem de procuras.

| Módulo | Função | Notas |
| --- | --- | --- |
| `src/lib/compatibility.ts` | `motorMatches`, `entryMatchesCar`, `pecaCompatibleWithCar`, `entriesShareScope`, `pecasShareCompatibility`, `formatCompatibilityEntry` | Lógica pura, muitos ramos — ✅ implementado. |
| `src/lib/db.ts` | `matchAndNotifyForPeca`, `countProcurasForPeca` | Orquestram Firestore mas **delegam a decisão** a `pecasShareCompatibility`. Testar com Firestore _mockado_ (ver §4): garante "não notifica o próprio criador", "deduplica por `criadorUid`", "ignora `tipo:'procura'`". |
| `mobile/src/hooks/useCarFilters.ts` | `filtrados`, `filtersCount` | Filtro+ordenação+raio. Testar via `renderHook` **ou** extrair `filtrarCarros(carros, filtros)` puro (ver §5). |

### 2.3 Tarefas em segundo plano / sincronização — **prioridade alta**

| Módulo | Alvo | Estratégia |
| --- | --- | --- |
| `src/lib/offlineQueue.ts` | `enqueue`/`peekQueue`/`processQueue`/`hasQueued` | Fila de escritas offline → sincroniza ao voltar online. `handler` injetado = fronteira (DI). ✅ implementado. |
| `functions/src/index.ts` | `pushOnNotification` | _Trigger_ Firestore → FCM. Testar **poda de tokens inválidos** e _early returns_ (sem `uid`, sem tokens). Extrair `pickInvalidTokens(tokens, response)` puro (ver §5) e testar sem mocks. |
| `src/lib/db.ts` / `mobile/src/lib/*.ts` | `subscribe*` (`onSnapshot`) | Verificar mapeamento/ordenação do snapshot e `unsubscribe`. Mock do SDK. |
| `src/lib/compressImage.ts` | `comprimirImagem` | Usa `Image`/`canvas` (jsdom não tem canvas real) → testar caminhos de erro (`onerror`) com mocks; o redimensionamento fica para teste manual/integração. |

### 2.4 Registo de anúncios/intenções e agregações — **prioridade média**

| Módulo | Alvo | Notas |
| --- | --- | --- |
| `src/lib/db.ts` | `addCarro`, `addPeca`, `criarIntencaoCompra` | Garantir `status:'pendente'` por omissão e _shape_ exigido pelas `firestore.rules`. Mock do SDK. |
| `src/lib/db.ts` | `updateSellerRating` | **Cálculo de média + regra do badge `top_vendedor`** (`total≥5 && média≥4.5`). Extrair `computeSellerRating(reviews, badges)` puro (ver §5). |
| `mobile/src/lib/trust.ts` | `criarIntencao`, `addReview`, `addReport` | Default `status:'pendente'`. Mock RN Firebase. |

### 2.5 Componentes/hooks de UI — **prioridade média/baixa** (Fase 4)

`@testing-library`: `useCarFilters` (renderHook), formulários (`ReviewForm`,
`StepPreferencias`, `validarIntencaoCompra` no contexto do wizard), badges de
preço/confiança. Testar comportamento e acessibilidade, não estrutura interna.

---

## 3. Princípios TDD (obrigatórios)

1. **Fatias verticais**: um teste → implementação mínima → repetir. Nunca escrever
   todos os testes primeiro ("horizontal slicing").
2. **Comportamento, não implementação**: testar pela interface pública; o teste
   deve sobreviver a um _refactor_ interno. Nomes descrevem _o quê_, não _como_.
3. **_Mock_ só em fronteiras** (§4): SDKs externos, rede, tempo, aleatoriedade,
   `localStorage`, `canvas`. Nunca _mockar_ código nosso.
4. **Asserções estáveis**: evitar acoplar a strings dependentes de _locale_/ICU
   (ex.: separador de milhares) — asseverar estrutura (`toContain('€')`, regex).
5. **Refactor só a verde**.

---

## 4. Guia de _mocking_ (fronteiras)

```ts
// Firestore Web SDK (src/lib/db.ts) — mock no nível do módulo
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(), query: jest.fn(), where: jest.fn(),
  getDocs: jest.fn(async () => ({ docs: [/* {id, data:()=>({...})} */] })),
  // …apenas o que a função sob teste usa
}));

// React Native Firebase (mobile) — mock do default export
jest.mock('@react-native-firebase/firestore', () => /* fábrica */);

// Tempo e aleatoriedade (gerarId, timestamps, impulso/expiração)
jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));
jest.spyOn(Math, 'random').mockReturnValue(0.42);
```

- `processQueue(uid, handler)` já recebe o _handler_ por **injeção de dependência**
  → testar sem _mocks_ de módulo (padrão a preferir; ver `offlineQueue.test.ts`).
- Preferir interfaces estilo-SDK (uma função por operação) a _fetchers_ genéricos,
  para que cada _mock_ devolva uma forma específica.

---

## 5. _Refactors_ sugeridos pelo TDD (deep modules)

O TDD revela lógica pura presa dentro de funções com I/O. Extrair (com teste a
acompanhar) torna-a verificável **sem mocks**:

1. `computeSellerRating(reviews, existingBadges) → { mediaAvaliacoes, totalAvaliacoes, badges }`
   extraído de `db.ts:updateSellerRating`.
2. `pickInvalidTokens(tokens, multicastResponse) → string[]`
   extraído de `functions/src/index.ts:pushOnNotification`.
3. `filtrarCarros(carros, filtros) → Carro[]` (+ `contarFiltros`)
   extraído do `useMemo` de `mobile/src/hooks/useCarFilters.ts`.

Cada extração mantém a interface pública estável (o teste do _wrapper_ continua a
passar) e cria um ponto de teste puro de alto valor.

---

## 6. Backlog priorizado (fases)

- [x] **Fase 0 — Harness**: `next/jest` (web) + `jest-expo` (mobile), scripts, alias.
- [x] **Fase 1 — Lógica pura**: `compatibility`, `utils`, `profanity`, `geo`,
      `offlineQueue` (web) + `format` (mobile). **58 testes a verde.**
- [ ] **Fase 2 — Fronteiras/async**: `db.ts` (`matchAndNotifyForPeca`,
      `updateSellerRating` via extração), `subscribe*`, e `functions/`
      (`ts-jest` + `firebase-functions-test`, `pickInvalidTokens`).
- [ ] **Fase 3 — Hooks**: `useCarFilters` (`renderHook`) ou `filtrarCarros` puro.
- [ ] **Fase 4 — Componentes**: formulários e badges com `@testing-library`.
- [ ] **Fase 5 — CI + cobertura**: adicionar o workflow `.github/workflows/test.yml`
      (YAML em §7 — requer um token com _scope_ `workflow`) a correr web + mobile;
      definir limiar de cobertura em `src/lib`.

---

## 7. CI

Adicionar `.github/workflows/test.yml` com o conteúdo abaixo. **Não foi possível
incluí-lo neste commit** porque o token OAuth da sessão não tem o _scope_
`workflow`; criar o ficheiro pela UI do GitHub ou com um PAT com esse _scope_.
Manter o pipeline verde é pré-requisito para _merge_.

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  web:
    name: Web (Next.js) — typecheck + jest
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm test -- --ci

  mobile:
    name: Mobile (Expo) — jest
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: mobile/package-lock.json
      - run: npm ci
      - run: npm test -- --ci
```
