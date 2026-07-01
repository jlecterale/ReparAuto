# Plano de Implementação: Suíte de Testes Automatizados + TDD

**Data:** Junho 2026
**Versão:** 1.0
**Status:** Proposta para análise
**Tipo:** Plano técnico (infraestrutura / qualidade)

---

## 1. Visão Geral

### Objetivo
Introduzir uma suíte de testes automatizados (Jest + React Testing Library) no
ReparAuto e adotar **Test-Driven Development (TDD)** como prática obrigatória
para qualquer mudança futura (feature, fix, refactor). Hoje o projeto tem
**cobertura zero**: a única verificação é `npx tsc --noEmit` + `npm run build`,
que apanha erros de tipo mas não regressões de comportamento.

### Por que agora
- A base de código cresceu para ~50 funções de dados em `db.ts`, lógica de
  *matching* não-trivial (intenções de compra, compatibilidade de peças),
  validações de domínio (NIF, código postal, intenção de compra) e fluxos
  offline. Estes são exatamente os pontos onde um bug silencioso custa caro
  (notificações erradas, *matches* perdidos, dados corrompidos).
- Vários fluxos críticos só são exercitados manualmente. Sem testes, cada
  refactor é uma aposta.
- O custo de adicionar testes cresce com o tempo. Começar agora, em modo
  incremental e TDD, evita o "vamos testar depois" que nunca chega.

### Princípio orientador (skill `tdd`)
Testes verificam **comportamento através da interface pública**, não detalhes de
implementação. Bons testes leem-se como especificação ("utilizador favorita um
anúncio offline e a ação é sincronizada ao reconectar") e sobrevivem a
refactors. **Fatias verticais (tracer bullets)**: um teste → uma implementação →
repetir. Nunca escrever todos os testes primeiro (anti-padrão "horizontal").

---

## 2. Benchmark de Práticas

| Prática | Padrão da indústria | Decisão para o ReparAuto |
|---|---|---|
| Runner | Jest (com `next/jest`) é o caminho oficial do Next.js | **Jest + `next/jest`** (transform via SWC, zero-config para o alias `@/`) |
| DOM/hooks | jsdom + React Testing Library | **jsdom** como ambiente padrão; RTL para hooks/componentes |
| Pirâmide | Maioria unitários, alguns de integração, poucos E2E | Foco em **unitários puros** + **integração com Firebase mockado**. E2E fica fora de escopo (futuro: Playwright) |
| Server Components async | Jest **não** suporta (limitação conhecida do React) | `db.server.ts` e Server Components async **não** entram na suíte Jest — cobrir por E2E no futuro |
| Cobertura | Métrica útil, não objetivo cego | Sem *gate* rígido inicial; priorizar lógica crítica sobre % |

---

## 3. Stack de Testes

### Dependências (devDependencies)
```
jest
jest-environment-jsdom
@testing-library/react
@testing-library/dom
@testing-library/jest-dom
@testing-library/user-event
@types/jest
ts-node            # para jest.config.ts
```

### Arquivos de configuração a criar
- `jest.config.ts` — usa `next/jest` (`createJestConfig`), `testEnvironment: 'jsdom'`,
  `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`, `moduleNameMapper` para o
  alias `@/` (o `next/jest` já resolve via `tsconfig`, mas reforçamos), e
  `testMatch` para `**/*.test.ts(x)`.
- `jest.setup.ts` — importa `@testing-library/jest-dom`; *polyfills* para
  `localStorage`, `matchMedia`, `navigator.onLine` e `crypto.randomUUID` quando
  faltarem no jsdom.
- `src/test/` — helpers partilhados: *factories* de dados (`makeCarro`,
  `makePeca`, `makeIntencao`, `makeUsuario`) e mocks de Firebase.

### Scripts em `package.json`
```jsonc
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

### Convenções (skill `javascript-typescript-jest`)
- Ficheiros `*.test.ts` / `*.test.tsx` **ao lado do código** que testam.
- `describe('Função/Hook', () => { it('descreve o comportamento esperado', …) })`.
- Mock de dependências externas (Firebase, Storage) com `jest.mock()`;
  `jest.spyOn()` para funções pontuais; `jest.resetAllMocks()` em `afterEach`.
- Async sempre com `async/await` e matchers `resolves`/`rejects`.
- Hooks testados com `renderHook` + `act` do RTL; nunca testar estado interno
  diretamente — apenas o que a interface do hook expõe.

---

## 4. Análise dos Pontos Críticos e Superfície Testável

A superfície foi inventariada e classificada por **risco × testabilidade**.
"Puro" = sem I/O, testável sem mocks. "Mockado" = precisa de Firebase/Storage
mockados. "DOM" = precisa de jsdom (canvas, localStorage).

### Tier 1 — Lógica de domínio pura (alto valor, sem mocks) → **começar aqui**
| Alvo | Ficheiro | Porquê é crítico |
|---|---|---|
| `validarIntencaoCompra` | `src/lib/utils.ts` | 10+ regras de negócio; *gate* de criação de intenção |
| `validarNif` | `src/lib/utils.ts` | Checksum mod-11; falso positivo/negativo afeta verificação |
| `validarCodigoPostal` / `formatarCodigoPostal` | `src/lib/utils.ts` | Formato `####-###`, transformação |
| `validarEmail` / `validarTelefone` | `src/lib/utils.ts` | Validação de entrada em formulários |
| `formatarPreco` / `formatarData` / `formatarDataHora` | `src/lib/utils.ts` | Locale PT; lida com `Timestamp`/`string`/`Date`/`null` |
| `gerarTituloIntencao` | `src/lib/utils.ts` | Gera título a partir de critérios |
| `renderDescricao` | `src/lib/utils.ts` | **Sanitização HTML** + markdown — risco de XSS se quebrar |
| `obterWhatsApp` / `gerarLinkWhatsApp` | `src/lib/utils.ts` | Normalização de número + código de país |
| `motorMatches`, `entryMatchesCar`, `pecaCompatibleWithCar`, `entriesShareScope`, `pecasShareCompatibility` | `src/lib/compatibility.ts` | **Núcleo do matching de peças** — fuzzy, ranges de ano, tokens de motor |
| `pickDefined` | `src/lib/compatibility.ts` | Remove `undefined` (evita gravar lixo no Firestore) |
| `haversineKm`, `getConcelhos`, `getCoordenadas`, `getCentroDistrito`, `getDistritoForConcelho` | `src/lib/geo.ts` | Distância geográfica usada no ranking de matches |
| `contemProfanity` | `src/lib/profanity.ts` | Normalização (acentos, leet `0→a`, `3→e`) + ofuscação |

### Tier 2 — Lógica de dados com Firebase mockado (alto valor)
A lógica de negócio dentro de `db.ts` (defaults de status, timestamps,
validação de posse, matching, contadores) é testável mockando o SDK Firestore.
| Alvo | Comportamento a fixar |
|---|---|
| `addCarro` / `addPeca` / `addOficina` | status default `'pendente'`, `dataCriacao` |
| `updateCarroStatus` | grava `dataAprovacao` quando vira `'aprovado'` |
| `buscarIntencoesMatch` | filtros por categoria, range de ano (limites), preço, combustível/`'qualquer'`, transmissão, km, localização; exclui o próprio dono |
| `matchAndNotifyForPeca` | encontra procuras compatíveis, evita auto-match e duplicados por criador, devolve contagem |
| `criarIntencaoCompra` | status `'ativa'`, `criadaEm`/`atualizadaEm`, `stats` zerados |
| `atualizarIntencaoCompra` / `deletar` / `pausar` / `reativar` | **validação de posse** (userId tem de bater certo); soft-delete |
| `addReview` | **rejeita comentário com profanity** (throw); status `'pendente'` |
| `updateSellerRating` | recálculo de `media` (1 casa decimal) e `totalReviews` |
| `setUserPlan` | cálculo de expiração (`now + dias * 86400000`); metadados |
| `criarNotificacao` | `lida=false`, `dataCriacao`, link opcional |
| `incrementCampo` / `decrementCampo` | usa `increment()` no campo certo |
| `iniciarContatoIntencao` | cria contato `'aberto'` + chat associado |

### Tier 3 — Hooks com lógica derivada (RTL `renderHook`)
| Hook | Lógica testável (não o "glue" de subscrição) |
|---|---|
| `useFavoritos` | prefixos `car_`/`part_`/`service_`; **migração de IDs legados**; fila offline; armazenamento duplo (Firestore vs localStorage); não notifica o próprio dono |
| `useIntencoes` | filtra intenções `deletada`; recarrega após mutação |
| `useReviews` | derivados `media` e `total` |
| `usePropostas` | separa `enviadas` vs `recebidas`; update otimista |
| `useChat` | contagem de não-lidas; marca como lida em lote ao abrir |
| `useCodigoPostal` | validação de formato |

### Tier 4 — DOM/localStorage puros (jsdom, sem Firebase)
| Alvo | Ficheiro | Foco |
|---|---|---|
| `enqueue`, `peekQueue`, `removeFromQueue`, `processQueue`, `hasQueued` | `src/lib/offlineQueue.ts` | fila em localStorage, filtro por uid, succeeded/failed |
| `getCachedLqip`, `cacheLqip` | `src/lib/lqip.ts` | cache LRU (máx 200, evita o mais antigo) |

### Fora de escopo (Jest não cobre bem)
- `db.server.ts` (`getCarrosServer`, etc.) — Server Components/fetchers async.
- Componentes Server async (`app/**/page.tsx`).
- `comprimirImagem`, `generateLqipFromImage/FromFile` — dependem de `canvas`
  real (jsdom não desenha); cobrir por E2E/visual no futuro.
- `auth.ts`, `upload.ts`, `fcm.ts` — *wrappers* finos de SDK; valor de teste
  unitário baixo. Cobrir indiretamente via hooks ou E2E.

---

## 5. Background Tasks / Fluxos Assíncronos

Análise específica pedida — o que dá para testar e como:

| Background task | O que é testável em Jest | Estratégia |
|---|---|---|
| **Fila offline** (`offlineQueue.ts`) usada por favoritos e chat | enfileirar offline → `processQueue` no reconnect → IDs succeeded/failed; handler que falha não perde a ação | Unitário puro com localStorage do jsdom + handler mock que resolve/rejeita |
| **Matching + notificação ao aprovar peça** (`matchAndNotifyForPeca`) | encontra procuras compatíveis, exclui self/duplicados, cria N notificações | Integração com Firestore mockado; asserir chamadas a `criarNotificacao` |
| **Matching de intenções ao publicar carro** (`buscarIntencoesMatch`) | regras de critério nos limites; ordenação por distância | Integração mockada com *factories* de carro/intenção |
| **Recálculo de rating** (`updateSellerRating`) ao aprovar/remover review | agrega reviews aprovadas → média | Integração mockada |
| **Cache LQIP** (`lqip.ts`) | eviction LRU ao passar 200 entradas | Unitário jsdom |
| **FCM** (`fcm.ts`) | retorna `null` graciosamente sem VAPID key | Teste leve com `Notification`/messaging mockados (baixa prioridade) |
| **Expiração de intenções** (90 dias) | — | Provavelmente Cloud Function agendada — **fora de escopo** (pasta `functions/`); só validamos a constante `TEMPO_EXPIRACAO_INTENCAO_MS` |

---

## 6. Estratégia de Mocking

- **Firestore (`@/lib/firebase`)**: `jest.mock('@/lib/firebase')` expondo um `db`
  fake; mockar as funções do `firebase/firestore` (`collection`, `query`,
  `where`, `getDocs`, `addDoc`, `updateDoc`, `writeBatch`, `increment`,
  `serverTimestamp`) com implementações em memória nos helpers de `src/test/`.
  Asserir **comportamento observável** (que `addDoc` recebeu `status: 'pendente'`)
  em vez de detalhes internos.
- **localStorage / navigator**: providos pelo jsdom; resetados em `beforeEach`.
- **Timestamps**: `jest.useFakeTimers()` + `setSystemTime` para tornar
  `dataCriacao`, expiração de plano e `gerarId` determinísticos.
- **Factories** (`src/test/factories.ts`): `makeCarro(overrides)`,
  `makePeca`, `makeIntencao`, `makeUsuario`, `makeReview` — reduzem ruído e
  mantêm os testes legíveis como especificação.

---

## 7. Sequência de Commits (TDD, fatias verticais)

Cada commit de teste segue **RED → GREEN** por unidade de comportamento. Como o
código já existe, o ciclo é: escrever 1 teste que descreve o comportamento
atual/desejado → confirmar que passa (ou expor um bug e corrigir) → próximo.
**Nunca** escrever todos os testes de um módulo de uma vez.

1. `tech: add Jest + Testing Library setup` — deps, `jest.config.ts`,
   `jest.setup.ts`, scripts, um *smoke test* trivial que passa.
2. `test: cover price/date/format utils` — `formatarPreco`, `formatarData`,
   `formatarDataHora`, `renderFoto`.
3. `test: cover validation utils` — `validarEmail`, `validarTelefone`,
   `validarCodigoPostal`, `formatarCodigoPostal`, `validarNif` (incl. checksum).
4. `test: cover validarIntencaoCompra + gerarTituloIntencao` — todas as regras
   e limites.
5. `test: cover renderDescricao sanitization` — markdown + escape de HTML
   (casos de XSS).
6. `test: cover WhatsApp helpers` — `obterWhatsApp`, `gerarLinkWhatsApp`.
7. `test: cover compatibility matching` — `motorMatches`, `entryMatchesCar`,
   `pecaCompatibleWithCar`, `entriesShareScope`, `pecasShareCompatibility`,
   `pickDefined`.
8. `test: cover geo utils` — `haversineKm` e lookups.
9. `test: cover profanity detection` — lista + ofuscação leet.
10. `test: cover offline queue` — enqueue/peek/remove/process/has.
11. `test: cover LQIP cache eviction`.
12. `tech: add Firebase mock harness + data factories` (`src/test/`).
13. `test: cover listing creation/approval defaults` — `addCarro`/`addPeca`/
    `updateCarroStatus`.
14. `test: cover buscarIntencoesMatch criteria` — limites de cada critério.
15. `test: cover matchAndNotifyForPeca` — self/duplicados/contagem.
16. `test: cover intencao ownership guards` — atualizar/pausar/reativar/deletar.
17. `test: cover addReview profanity guard + updateSellerRating`.
18. `test: cover setUserPlan expiry + criarNotificacao`.
19. `test: cover useFavoritos (prefix, migration, offline, notify)`.
20. `test: cover useIntencoes / useReviews / usePropostas derived state`.
21. `docs: mark plan 20 (testes/TDD) as shipped` + atualização do
    `CLAUDE.md`/`AGENTS.md` com o mandato TDD.

> Commits 1–12 não exigem deploy nem tocam em comportamento de produção. Se
> algum teste expuser um bug real, o fix vai num commit `fix:` próprio antes de
> continuar.

---

## 8. Edge Cases a Cobrir

- `formatarData` com `null`, `Timestamp` do Firestore, `Date`, ISO string e
  string inválida.
- `validarNif` com NIF válido, dígito de controlo errado, comprimento errado,
  caracteres não-numéricos.
- `buscarIntencoesMatch` nos **limites exatos** de ano/preço/km (`<=` vs `<`) e
  com `'qualquer'` em combustível/transmissão.
- `useFavoritos`: ID legado sem prefixo → migra; offline → enfileira → reconnect
  processa; favoritar próprio anúncio → **não** notifica.
- `offlineQueue.processQueue`: handler que rejeita mantém a ação na fila
  (`failed`), handler que resolve remove-a (`succeeded`).
- `cacheLqip`: 201ª entrada remove a mais antiga.
- `contemProfanity`: ofuscação (`p0rra`, `f0da`), acentos, falsos positivos
  (palavras inocentes que contêm substring).

---

## 9. Verificação

1. `npm test` — toda a suíte verde.
2. `npm run test:coverage` — relatório de cobertura (linha de base; sem *gate*).
3. `npx tsc --noEmit` — tipos OK (config de testes incluída).
4. `npm run build` — build de produção continua a passar.

---

## 10. Mudança de Processo: TDD Obrigatório

Após este plano, **TDD passa a ser a regra para qualquer mudança** (feature,
fix, refactor) em código com lógica testável:

1. **RED** — escrever um teste que falha e descreve o comportamento desejado.
2. **GREEN** — escrever o mínimo de código para o teste passar.
3. **REFACTOR** — limpar com os testes verdes.
4. Repetir em **fatias verticais** (um teste → uma implementação).

Exceções (onde TDD não se aplica): mudanças puramente visuais/Tailwind, conteúdo
estático, Server Components async e *wrappers* finos de SDK — aí mantém-se
`tsc --noEmit` + `build` + revisão manual. O `CLAUDE.md` e o `AGENTS.md` são
atualizados para refletir esta política e o checklist de pré-conclusão passa a
incluir "testes adicionados/atualizados e a passar".
