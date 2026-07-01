# Plano: Inteligencia de Precos

**Prioridade:** ALTA
**Estimativa Total:** 15-20 dias de desenvolvimento
**Impacto Principal:** Decisao de compra informada, diferenciacao competitiva, retencao
**Status:** Implementado (parcial). Entregue: badge de preco de 5 niveis (excelente/bom/justo/acima/sobrevalorizado) nos cards e na ficha do anuncio, pagina `/avaliar-veiculo` (estimador com intervalo P25-P75), dashboard `/mercado` (estatisticas + distribuicao + top marcas). Ficam para o proximo ciclo: alertas de queda de preco (depende do Plano 3.1 / Cloud Functions) e o cron que popula `priceSnapshots` para o grafico de tendencia historica (o componente `PriceChart` ja existe, so falta a fonte de dados).

---

## 1. Visao Geral

### O Que Resolve

Num marketplace de veiculos usados, o preco e a variavel mais sensivel e tambem a mais opaca. Compradores nao sabem se o preco pedido e justo, vendedores nao sabem como posicionar os seus anuncios, e ninguem tem visibilidade sobre tendencias de mercado. Este plano transforma o ReparAuto de um simples quadro de anuncios numa plataforma inteligente de precos, fornecendo indicadores visuais de preco justo, graficos de tendencia, alertas personalizados, uma ferramenta de estimativa de valor e um dashboard publico de estatisticas de mercado.

### Benchmark Competitivo

| Plataforma | Indicador Preco Justo | Graficos Tendencia | Alertas Preco | Estimativa Valor | Dashboard Mercado |
|---|---|---|---|---|---|
| **Standvirtual** | Nao | Nao | Basico (email) | Nao | Nao |
| **AutoScout24** | Sim (parcial) | Nao | Sim | Sim | Parcial |
| **AutoTrader UK** | Sim | Sim | Sim | Sim (Kelley Blue Book) | Sim |
| **OLX Portugal** | Nao | Nao | Nao | Nao | Nao |
| **ReparAuto (atual)** | Nao | Nao | Nao | Nao | Nao |
| **ReparAuto (proposto)** | Sim | Sim | Sim | Sim | Sim |

### Historias de Utilizador

1. **Como comprador**, quero ver num anuncio se o preco esta acima, abaixo ou na media do mercado para aquele tipo de veiculo, para que possa negociar com confianca ou identificar oportunidades.
2. **Como vendedor**, quero usar uma ferramenta "Quanto vale meu carro?" que me sugira um preco competitivo com base na marca, modelo, ano, quilometragem e estado, para que o meu anuncio atraia mais interessados.
3. **Como utilizador frequente**, quero receber um alerta quando o preco de um veiculo que favoritei baixar, ou quando um novo anuncio corresponder aos meus criterios de busca salva com preco abaixo da media, para nao perder oportunidades.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

#### 2.1 Indicador de Preco Justo
Badge visual em cada anuncio que classifica o preco em relacao a media do mercado. Calculo baseado nos anuncios ativos da mesma marca, modelo (ou grupo de modelos), faixa de ano (+/- 2 anos) e faixa de quilometragem (+/- 30.000 km). Classificacoes: "Excelente Preco" (>20% abaixo), "Bom Preco" (10-20% abaixo), "Preco Justo" (+/- 10%), "Acima da Media" (10-30% acima), "Preco Elevado" (>30% acima).

#### 2.2 Graficos de Tendencia de Preco
Visualizacao do historico de precos medios por marca/modelo ao longo do tempo. Dados agregados a partir de snapshots periodicos dos anuncios ativos. Graficos de linha interativos com filtros por marca, modelo, combustivel e periodo.

#### 2.3 Alertas de Preco
Notificacoes automaticas disparadas quando: (a) o preco de um veiculo favoritado e reduzido; (b) um novo anuncio corresponde a uma busca salva e tem preco abaixo da media. Utiliza a colecao `notifications` existente e o sistema de notificacoes ja implementado.

#### 2.4 Estimativa de Valor do Veiculo ("Quanto Vale Meu Carro?")
Ferramenta standalone acessivel via menu/pagina dedicada. O utilizador preenche marca, modelo, ano, quilometragem, combustivel, cambio e estado. O sistema calcula uma faixa de preco estimado (minimo, medio, maximo) com base nos dados internos dos anuncios.

#### 2.5 Dashboard de Mercado
Pagina publica com estatisticas agregadas: marcas mais buscadas, preco medio por regiao (concelho), distribuicao de precos, veiculos mais favoritados, volume de anuncios por categoria. Atualizado periodicamente.

### Fluxos de Utilizador

**Fluxo do Indicador de Preco Justo:**
1. Utilizador acede a pagina de detalhes de um carro
2. Sistema consulta anuncios ativos com criterios similares (marca, modelo, ano +/-2, km +/-30k)
3. Calcula media e desvio padrao dos precos
4. Classifica o preco do anuncio atual numa das 5 categorias
5. Exibe badge colorido junto ao preco (verde = excelente, azul = bom, cinza = justo, laranja = acima, vermelho = elevado)
6. Tooltip opcional mostra: "Baseado em X anuncios similares. Preco medio: Y EUR"

**Fluxo de Alerta de Preco:**
1. Utilizador favorita um veiculo (sistema ja existente via `useFavoritos`)
2. Background check periodico (ou trigger na atualizacao do documento): se `preco` do carro diminuiu em relacao ao valor anterior, cria notificacao
3. Notificacao aparece no sino (componente `NotificationBell` existente)
4. Utilizador clica → e redirecionado para a pagina do anuncio

**Fluxo "Quanto Vale Meu Carro?":**
1. Utilizador acede a pagina/seccao "Avaliar Veiculo" (acessivel sem login)
2. Preenche: marca (autocomplete do `marcas-modelos.json`), modelo, ano, km, combustivel, cambio, estado
3. Clica "Calcular"
4. Sistema consulta anuncios historicos e ativos com criterios similares
5. Exibe faixa de preco: minimo, estimado, maximo + grafico de distribuicao
6. Opcao: "Anunciar por este preco" → redireciona para `/anunciar` com dados pre-preenchidos

### Requisitos de UI/UX

- Indicador de preco justo deve ser visualmente proeminente na pagina de detalhes e subtil nos cartoes da grelha
- Cores consistentes em todo o sistema: verde (excelente), azul (bom), cinza (justo), laranja (acima), vermelho (elevado)
- Graficos de tendencia devem ser interativos (hover para ver valores) e responsivos para mobile
- Ferramenta de estimativa deve ter uma experiencia tipo "wizard" com resultado impactante e visualmente atrativo
- Dashboard de mercado deve carregar progressivamente (skeleton loading) dado o volume de dados

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Caminho | Finalidade |
|---|---|
| `src/types/preco.ts` | Interfaces para PriceIndicator, PriceHistory, PriceEstimate, MarketStats |
| `src/hooks/usePriceIndicator.ts` | Hook que calcula o indicador de preco justo para um anuncio |
| `src/hooks/usePriceHistory.ts` | Hook para obter historico de precos por marca/modelo |
| `src/hooks/usePriceEstimate.ts` | Hook para a ferramenta de estimativa de valor |
| `src/hooks/useMarketStats.ts` | Hook para estatisticas do dashboard de mercado |
| `src/hooks/usePriceAlerts.ts` | Hook para gerir alertas de preco sobre favoritos |
| `src/components/precos/PriceIndicatorBadge.tsx` | Badge visual do indicador de preco justo |
| `src/components/precos/PriceChart.tsx` | Grafico de tendencia de precos (usando Recharts) |
| `src/components/precos/PriceEstimator.tsx` | Formulario + resultado da estimativa de valor |
| `src/components/precos/PriceDistribution.tsx` | Grafico de distribuicao de precos (histograma) |
| `src/components/precos/MarketDashboard.tsx` | Dashboard completo com multiplos widgets |
| `src/components/precos/MarketWidget.tsx` | Widget individual reutilizavel (stat card) |
| `src/pages/AvaliarVeiculo.tsx` | Pagina "Quanto Vale Meu Carro?" |
| `src/pages/Mercado.tsx` | Pagina do dashboard de mercado |

### Modificacoes em Arquivos Existentes

| Caminho | Alteracoes |
|---|---|
| `src/types/carro.ts` | Adicionar campo opcional `precoAnterior?: number` para rastrear reducoes de preco |
| `src/lib/db.ts` | Adicionar funcoes: `getCarrosSimilares(marca, modelo, anoMin, anoMax, kmMin, kmMax)`, `getPriceSnapshots(marca, modelo)`, `savePriceSnapshot()`, `updateCarroPreco()` (atualiza preco e guarda precoAnterior) |
| `src/lib/constants.ts` | Adicionar `PRICE_INDICATOR_THRESHOLDS`, `PRICE_INDICATOR_LABELS`, `PRICE_INDICATOR_COLORS` |
| `src/components/home/CarCard.tsx` | Adicionar mini `PriceIndicatorBadge` junto ao preco |
| `src/pages/DetalhesCarro.tsx` | Integrar `PriceIndicatorBadge` completo com tooltip junto a seccao de preco |
| `src/components/layout/Header.tsx` | Adicionar links "Avaliar Veiculo" e "Mercado" ao menu de navegacao |
| `src/components/layout/BottomNav.tsx` | Adicionar entrada para pagina de mercado/avaliacao |
| `src/App.tsx` | Adicionar rotas `/avaliar-veiculo` e `/mercado` |
| `src/hooks/useNotificacoes.ts` | Nenhuma alteracao necessaria (usa a colecao `notifications` existente) |
| `src/hooks/useFavoritos.ts` | Adicionar funcao `getFavoritosComPreco()` que retorna os carros favoritos com preco atual para comparacao |

### Colecoes Firestore

#### Colecao `priceSnapshots` (nova)
```typescript
interface PriceSnapshot {
  id: string;
  marca: string;
  modelo: string;
  combustivel: string;
  anoMin: number;
  anoMax: number;
  precoMedio: number;
  precoMinimo: number;
  precoMaximo: number;
  totalAnuncios: number;
  data: Timestamp;         // Data do snapshot (diario ou semanal)
}
```

#### Colecao `savedSearches` (nova, para alertas)
```typescript
interface SavedSearch {
  id: string;
  uid: string;
  filtros: {
    marca?: string;
    modelo?: string;
    precoMax?: number;
    precoMin?: number;
    anoMin?: number;
    anoMax?: number;
    kmMax?: number;
    combustivel?: string;
    local?: string;
  };
  alertaAtivo: boolean;
  dataCriacao: Timestamp;
  ultimoAlerta?: Timestamp;
}
```

#### Atualizacao na colecao `cars`
```typescript
// Campos adicionais opcionais
{
  precoAnterior?: number;     // Preco anterior (antes da ultima alteracao)
  dataAlteracaoPreco?: Timestamp;
}
```

### Regras de Seguranca Firestore

```
match /priceSnapshots/{snapshotId} {
  allow read: if true;  // Dados agregados, sem informacao pessoal
  allow write: if isAdmin();  // Apenas admin ou Cloud Function cria snapshots
}

match /savedSearches/{searchId} {
  allow read: if isAuthenticated() && resource.data.uid == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
  allow update: if isAuthenticated() && resource.data.uid == request.auth.uid;
  allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
}
```

### APIs / Servicos Externos

Nenhuma API externa e necessaria para a implementacao base. Todas as funcionalidades utilizam dados internos da plataforma.

**Consideracoes futuras:**
- Eurotax/Schwacke para dados de mercado europeu mais robustos (quando volume interno for insuficiente)
- FIPE nao se aplica (mercado brasileiro, nao portugues)
- Possibilidade de scraping de dados publicos do Standvirtual para enriquecer a base (questoes legais a avaliar)

**Dependencia de biblioteca:**
- `recharts` (biblioteca de graficos React, leve, sem dependencia de D3 completa) — para os graficos de tendencia e distribuicao

### Componentes React Principais

```typescript
// src/components/precos/PriceIndicatorBadge.tsx
interface PriceIndicatorBadgeProps {
  preco: number;
  marca: string;
  modelo: string;
  ano: number;
  km: number;
  compact?: boolean;      // Versao compacta para cartoes
  showTooltip?: boolean;  // Mostrar detalhes ao hover
}

// src/components/precos/PriceChart.tsx
interface PriceChartProps {
  marca: string;
  modelo?: string;
  combustivel?: string;
  periodo?: '3m' | '6m' | '1a' | 'tudo';
}

// src/components/precos/PriceEstimator.tsx
interface PriceEstimatorProps {
  onEstimate?: (estimate: PriceEstimate) => void;
  initialData?: Partial<CarroFormData>;  // Para pre-preencher
}

// src/components/precos/PriceDistribution.tsx
interface PriceDistributionProps {
  precos: number[];         // Array de precos dos anuncios similares
  precoAtual?: number;      // Preco do anuncio atual (para destacar)
  bins?: number;            // Numero de bins do histograma (default 10)
}

// src/components/precos/MarketDashboard.tsx
interface MarketDashboardProps {
  // Sem props — busca dados internamente
}

// src/components/precos/MarketWidget.tsx
interface MarketWidgetProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  tendencia?: 'subida' | 'descida' | 'estavel';
  icone?: React.ReactNode;
}

// src/types/preco.ts
type PriceLevel = 'excelente' | 'bom' | 'justo' | 'acima' | 'elevado';

interface PriceIndicator {
  level: PriceLevel;
  label: string;            // "Excelente Preco", "Bom Preco", etc.
  color: string;            // Tailwind color class
  precoMedio: number;
  totalComparacoes: number;
  percentualDiferenca: number;  // +15%, -20%, etc.
}

interface PriceEstimate {
  precoMinimo: number;
  precoEstimado: number;
  precoMaximo: number;
  confianca: 'alta' | 'media' | 'baixa';  // Baseado no numero de anuncios comparaveis
  totalAnunciosBase: number;
}

interface MarketStats {
  totalAnuncios: number;
  precoMedioGeral: number;
  marcasMaisPopulares: { marca: string; count: number }[];
  precoMedioPorRegiao: { regiao: string; preco: number }[];
  distribuicaoCombustivel: { tipo: string; percentual: number }[];
}
```

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Tarefa | Esforco (dias) | Competencias |
|---|---|---|
| Tipos TypeScript (preco.ts, atualizacoes) | 0.5 | TypeScript |
| Funcoes de calculo de preco justo (logica pura) | 2 | Logica de negocios, Estatistica basica |
| Funcoes CRUD em `db.ts` (getCarrosSimilares, snapshots, saved searches) | 2 | Firestore |
| Regras Firestore para novas colecoes | 0.5 | Firestore Rules |
| Hook `usePriceIndicator` | 1 | React, Firestore |
| Hook `usePriceHistory` | 1 | React, Firestore |
| Hook `usePriceEstimate` | 1 | React, Firestore |
| Hook `useMarketStats` | 1 | React, Firestore |
| Hook `usePriceAlerts` | 1 | React, Firestore |
| Componente `PriceIndicatorBadge` | 1 | React, Tailwind |
| Componentes de graficos (`PriceChart`, `PriceDistribution`) | 2 | React, Recharts |
| Componente `PriceEstimator` + pagina `AvaliarVeiculo` | 2 | React, Tailwind |
| Componentes do dashboard (`MarketDashboard`, `MarketWidget`) + pagina `Mercado` | 2 | React, Tailwind, Recharts |
| Integracao nos componentes existentes (CarCard, DetalhesCarro, Header, BottomNav, App.tsx) | 1 | React |
| Snapshot scheduler (logica para criar snapshots periodicos — pode ser manual/admin inicialmente) | 1 | Firestore |
| Testes manuais e ajustes | 1.5 | QA |
| **Total** | **~20 dias** | |

### Avaliacao de Valor

| Dimensao | Impacto | Justificacao |
|---|---|---|
| **Aquisicao** | Muito Alto | Ferramenta "Quanto Vale Meu Carro?" atrai trafego organico (SEO); dashboard de mercado gera visitas recorrentes |
| **Retencao** | Alto | Alertas de preco trazem utilizadores de volta; indicador de preco justo aumenta tempo na plataforma |
| **Receita** | Medio | Potencial para modelo freemium (X consultas gratis/mes); dados de mercado premium para stands |
| **Diferenciacao** | Muito Alto | Nenhum concorrente direto em Portugal oferece este nivel de inteligencia de precos |

### Posicao na Matriz

**ESTRATEGICO** — Esforco medio (20 dias), valor muito alto. Este e um diferenciador chave que posiciona o ReparAuto como uma plataforma de referencia para informacao de precos no mercado automovel portugues, nao apenas um quadro de anuncios. O indicador de preco justo, em particular, tem impacto imediato na experiencia do utilizador com esforco relativamente contido.

---

## 5. Decisoes de Arquitetura

### Decisao 1: Fonte de Dados para Precos

**Contexto:** Necessitamos de dados de precos para alimentar o indicador de preco justo, graficos e estimativas. Duas abordagens foram avaliadas.

| Opcao | Pros | Contras |
|---|---|---|
| **Dados internos (anuncios da plataforma)** | Sem custo; dados reais e atualizados; controlo total; consistente com a realidade da plataforma | Volume inicial baixo (poucos anuncios); pode gerar indicadores pouco confiaveis no inicio; nao reflete mercado completo |
| **API externa (Eurotax/Schwacke)** | Dados robustos e abrangentes; cobertura de mercado ampla; maior credibilidade | Custo elevado (~5.000-15.000 EUR/ano); dependencia externa; dados podem nao refletir o nicho de "carros para reparar" |

**Recomendacao:** **Dados internos** como fonte primaria, com logica defensiva para lidar com volume baixo. Quando o numero de anuncios comparaveis for inferior a 5, o indicador mostra "Dados insuficientes" em vez de uma classificacao potencialmente incorreta. A medida que a plataforma cresce, a qualidade dos indicadores melhora naturalmente. API externa pode ser adicionada futuramente como layer complementar.

### Decisao 2: Algoritmo de Preco Justo

**Contexto:** Necessitamos definir como calcular se um preco e "justo" em relacao ao mercado.

| Opcao | Pros | Contras |
|---|---|---|
| **Media simples** | Simples de implementar; facil de explicar ao utilizador; transparente | Sensivel a outliers (um carro a 50.000 EUR distorce a media); nao considera variaveis importantes |
| **Mediana com filtros por variavel** | Resistente a outliers; considera faixas de ano e km; mais precisa | Um pouco mais complexa; necessita de mais dados para ser confiavel |
| **Regressao linear com variaveis (km, ano, combustivel, estado)** | Mais precisa; pondera corretamente o impacto de cada variavel | Complexidade significativa; necessita de volume grande de dados para treinar; dificil de explicar ao utilizador |

**Recomendacao:** **Mediana com filtros por variavel** como abordagem inicial. O algoritmo:
1. Filtra anuncios ativos: mesma marca, mesmo grupo de modelo (normalize "Golf IV 1.9 TDI" → "Golf"), ano +/- 2, km +/- 30.000
2. Se resultado < 5 anuncios, relaxa filtros (ano +/- 4, km +/- 50.000)
3. Se resultado < 3, marca como "Dados insuficientes"
4. Calcula mediana (nao media) dos precos filtrados
5. Classifica o preco do anuncio: excelente (<80% mediana), bom (80-90%), justo (90-110%), acima (110-130%), elevado (>130%)

Esta abordagem e pragmatica, resistente a outliers e escalavel. Pode evoluir para regressao quando houver volume suficiente.

---

## 6. Prompt de Implementacao

```
You are implementing the "Price Intelligence" feature set for ReparAuto, a Portuguese used-car and parts marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase.

IMPORTANT CONTEXT:
- All UI text must be in Portuguese (PT-PT). Code, comments, variable names in English.
- Import alias: @/ maps to src/. NEVER use relative imports.
- Styling: Tailwind utility classes only. Theme is in src/index.css.
- State: Context API + custom hooks. No Redux/Zustand.
- Real-time data via Firestore onSnapshot(). Clean up on unmount.
- Existing car data has: marca, modelo, anoFabricacao, km, preco, combustivel, cambio, estadoVeiculo, local.
- Existing notification system: criarNotificacao() in src/lib/db.ts, TipoNotificacao in src/types/notificacao.ts.

EXISTING FILES TO REFERENCE:
- src/types/carro.ts — Carro interface with marca, modelo, anoFabricacao, anoModelo, preco, km, combustivel, cambio, cor, portas, local, estadoVeiculo, fotos[], status, dataCriacao
- src/types/carro.ts — CarroFormData interface for form state
- src/lib/db.ts — CRUD functions: getCarros(), subscribeCarros(), addCarro(), getCarrosByCreator(), etc. Collection name: 'cars'
- src/lib/db.ts — criarNotificacao(uid, tipo, titulo, mensagem, link?) for sending notifications
- src/lib/constants.ts — CONCELHOS, TIPOS_COMBUSTIVEL, TIPOS_CAMBIO
- src/hooks/useCarros.ts — Car listing hook with filtering (filtroAtivo, searchQuery, advPriceMin/Max, advLocation, sortOrdem)
- src/hooks/useFavoritos.ts — Favorites hook (favoritos[], toggleFavorito, isFavorito)
- src/hooks/useNotificacoes.ts — Notification hook (notificacoes[], naoLidas, marcarLida)
- src/components/home/CarCard.tsx — Card component used in car grid
- src/components/CarAutocomplete.tsx — Autocomplete for marca/modelo using src/data/marcas-modelos.json
- src/pages/DetalhesCarro.tsx — Car detail page
- src/pages/Home.tsx — Home page with car grid
- src/App.tsx — HashRouter routes
- src/components/layout/Header.tsx — Navigation header
- src/components/layout/BottomNav.tsx — Mobile bottom navigation

INSTALL DEPENDENCY:
- Run: npm install recharts
- Recharts is a React charting library. Use <LineChart>, <BarChart>, <ResponsiveContainer> from 'recharts'.

TASKS — Implement in this order:

1. TYPE DEFINITIONS
   Create src/types/preco.ts with:
   - type PriceLevel = 'excelente' | 'bom' | 'justo' | 'acima' | 'elevado'
   - interface PriceIndicator { level: PriceLevel; label: string; color: string; precoMedio: number; precoMediano: number; totalComparacoes: number; percentualDiferenca: number; }
   - interface PriceEstimate { precoMinimo: number; precoEstimado: number; precoMaximo: number; confianca: 'alta' | 'media' | 'baixa'; totalAnunciosBase: number; }
   - interface PriceSnapshot { id: string; marca: string; modelo: string; combustivel: string; anoMin: number; anoMax: number; precoMedio: number; precoMinimo: number; precoMaximo: number; totalAnuncios: number; data: Timestamp; }
   - interface SavedSearch { id: string; uid: string; filtros: { marca?: string; modelo?: string; precoMax?: number; precoMin?: number; anoMin?: number; anoMax?: number; kmMax?: number; combustivel?: string; local?: string; }; alertaAtivo: boolean; dataCriacao: Timestamp; ultimoAlerta?: Timestamp; }
   - interface MarketStats { totalAnuncios: number; precoMedioGeral: number; marcasMaisPopulares: { marca: string; count: number }[]; precoMedioPorRegiao: { regiao: string; preco: number }[]; distribuicaoCombustivel: { tipo: string; percentual: number }[]; }

   Modify src/types/carro.ts:
   - Add optional field to Carro: precoAnterior?: number; dataAlteracaoPreco?: Timestamp;

2. CONSTANTS
   In src/lib/constants.ts, add:
   - PRICE_THRESHOLDS object: { excelente: 0.8, bom: 0.9, justo: 1.1, acima: 1.3 }
   - PRICE_LABELS: Record<PriceLevel, string> mapping to Portuguese labels
   - PRICE_COLORS: Record<PriceLevel, string> mapping to Tailwind classes (green-600, blue-600, slate-500, orange-500, red-600)
   - MIN_COMPARISONS = 3  (minimum similar cars to show indicator)
   - RELAXED_MIN_COMPARISONS = 5  (threshold to relax filters)

3. PRICE CALCULATION LOGIC
   Create a pure utility function in src/lib/priceUtils.ts:
   - calculatePriceIndicator(targetCar: Carro, similarCars: Carro[]): PriceIndicator | null
     - Filter similarCars by: same marca, modelo group (normalize by removing engine specs like "1.9 TDI"), anoFabricacao +/- 2, km +/- 30000
     - If < MIN_COMPARISONS, try relaxed: ano +/- 4, km +/- 50000
     - If still < MIN_COMPARISONS, return null
     - Calculate median price (not mean — resistant to outliers)
     - Classify: preco/median ratio against PRICE_THRESHOLDS
     - Return PriceIndicator object
   - calculatePriceEstimate(marca: string, modelo: string, ano: number, km: number, combustivel: string, similarCars: Carro[]): PriceEstimate | null
     - Similar filtering logic, then compute min/median/max
     - Confidence based on count: >= 10 = alta, >= 5 = media, >= 3 = baixa
   - normalizeModelo(modelo: string): string — strips engine specs for grouping
   - calculateMarketStats(carros: Carro[]): MarketStats

4. DATABASE LAYER
   In src/lib/db.ts, add:
   - getCarrosSimilares(marca: string, anoMin: number, anoMax: number): Promise<Carro[]> — query by marca and year range from 'cars' collection where status == 'aprovado'
   - savePriceSnapshot(snapshot: Omit<PriceSnapshot, 'id'>): Promise<void>
   - getPriceSnapshots(marca: string, modelo?: string): Promise<PriceSnapshot[]>
   - addSavedSearch(data: Omit<SavedSearch, 'id'>): Promise<string>
   - getSavedSearches(uid: string): Promise<SavedSearch[]>
   - deleteSavedSearch(id: string): Promise<void>

5. HOOKS
   Create src/hooks/usePriceIndicator.ts:
   - Takes a Carro object, returns { indicator: PriceIndicator | null, loading: boolean }
   - Fetches similar cars on mount, calculates indicator using priceUtils
   - Memoize result

   Create src/hooks/usePriceEstimate.ts:
   - Takes marca, modelo, ano, km, combustivel
   - Returns { estimate: PriceEstimate | null, loading: boolean, calculate: (params) => void }

   Create src/hooks/usePriceHistory.ts:
   - Takes marca, modelo (optional)
   - Returns { snapshots: PriceSnapshot[], loading: boolean }

   Create src/hooks/useMarketStats.ts:
   - No params, reads all approved cars
   - Returns { stats: MarketStats | null, loading: boolean }
   - Uses calculateMarketStats from priceUtils

   Create src/hooks/useSavedSearches.ts:
   - Takes uid
   - Returns { searches: SavedSearch[], addSearch, removeSearch, loading }

6. UI COMPONENTS
   Create src/components/precos/PriceIndicatorBadge.tsx:
   - Props: carro: Carro; compact?: boolean; showTooltip?: boolean
   - Uses usePriceIndicator hook internally
   - Compact mode: small colored dot + text label next to price
   - Full mode: colored badge with icon + label + "Baseado em X anuncios" + tooltip with details
   - If indicator is null, render nothing (or "Sem dados suficientes" in full mode)

   Create src/components/precos/PriceChart.tsx:
   - Props: marca: string; modelo?: string; periodo?: '3m' | '6m' | '1a' | 'tudo'
   - Uses usePriceHistory hook
   - Renders Recharts <LineChart> with <ResponsiveContainer>
   - X-axis: date, Y-axis: average price
   - Locale-aware number formatting (EUR)

   Create src/components/precos/PriceDistribution.tsx:
   - Props: precos: number[]; precoAtual?: number; bins?: number
   - Renders Recharts <BarChart> histogram
   - Highlights the bin containing precoAtual in a different color

   Create src/components/precos/PriceEstimator.tsx:
   - Full form: marca (CarAutocomplete), modelo, ano, km, combustivel (select), cambio (select), estadoVeiculo (select)
   - Calculate button → shows result card with min/estimado/max range
   - Visual gauge/bar showing where the estimate falls
   - "Anunciar por este preco" button → navigates to /anunciar with pre-filled data

   Create src/components/precos/MarketDashboard.tsx:
   - Uses useMarketStats hook
   - Grid of MarketWidget cards: total listings, average price, top 5 brands (bar chart), price by region (bar chart), fuel distribution (pie chart)

   Create src/components/precos/MarketWidget.tsx:
   - Reusable stat card: title, value, subtitle, optional trend arrow

   Create src/pages/AvaliarVeiculo.tsx:
   - Route: /avaliar-veiculo
   - Contains PriceEstimator component
   - Portuguese heading: "Quanto Vale o Meu Carro?"
   - Explanatory text about how the estimate is calculated

   Create src/pages/Mercado.tsx:
   - Route: /mercado
   - Contains MarketDashboard component
   - Portuguese heading: "Dashboard de Mercado"

7. INTEGRATION
   Modify src/App.tsx — Add routes: <Route path="/avaliar-veiculo" element={<AvaliarVeiculo />} /> and <Route path="/mercado" element={<Mercado />} />
   Modify src/components/layout/Header.tsx — Add navigation links for "Avaliar" and "Mercado"
   Modify src/components/layout/BottomNav.tsx — Add entry for market/estimate pages
   Modify src/components/home/CarCard.tsx — Add <PriceIndicatorBadge carro={carro} compact /> near the price display
   Modify src/pages/DetalhesCarro.tsx — Add <PriceIndicatorBadge carro={carro} showTooltip /> next to price section, and <PriceDistribution /> below

8. FIRESTORE RULES
   Update firestore.rules with rules for priceSnapshots (public read, admin write) and savedSearches (owner CRUD).

DESIGN GUIDELINES:
- Price colors: excelente=#16a34a (green-600), bom=#2563eb (blue-600), justo=#64748b (slate-500), acima=#ea580c (orange-600), elevado=#dc2626 (red-600)
- Charts should use the app's primary color scheme
- PriceEstimator result should feel impactful — large numbers, gauge visual
- Mobile-first: charts must be touch-friendly and readable on small screens
- Use skeleton loading states for all async components
```

---

*Documento gerado em 2026-05-27. O indicador de preco justo pode ser lancado primeiro como MVP independente dos graficos e dashboard.*
