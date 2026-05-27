# Plano: Busca Avancada e Descoberta

**Prioridade:** ALTA
**Estimativa Total:** 16-22 dias de desenvolvimento
**Impacto Principal:** Experiencia de utilizador, conversao, retencao

---

## 1. Visao Geral

### O Que Resolve

O sistema de busca atual do ReparAuto e limitado: oferece apenas pesquisa por texto livre (marca, modelo, local), filtros basicos de preco e localizacao, e ordenacao simples por preco. Nao existe busca por mapa, comparacao entre veiculos, buscas salvas com alertas, filtros avancados (cor, cambio, portas, estado de manutencao) nem sugestoes personalizadas. Para um marketplace de veiculos, a capacidade de encontrar rapidamente o carro certo e o fator critico entre uma visita e uma transacao.

Este plano implementa uma camada completa de busca e descoberta que inclui buscas salvas com alertas, busca por mapa geografico, comparacao lado a lado, filtros avancados, ordenacao multipla e sugestoes personalizadas.

### Benchmark Competitivo

| Plataforma | Buscas Salvas | Mapa | Comparacao | Filtros Avancados | Sugestoes |
|---|---|---|---|---|---|
| **Standvirtual** | Sim | Nao | Nao | Sim (extensos) | Basico |
| **AutoScout24** | Sim | Sim (Google Maps) | Sim (2 carros) | Sim (extensos) | Sim |
| **OLX Portugal** | Sim (alertas email) | Nao | Nao | Medio | Nao |
| **Carros.net** | Nao | Nao | Nao | Basico | Nao |
| **ReparAuto (atual)** | Nao | Nao | Nao | Basico | Nao |
| **ReparAuto (proposto)** | Sim | Sim (Leaflet) | Sim (ate 3) | Sim | Sim |

### Historias de Utilizador

1. **Como comprador**, quero salvar os meus filtros de busca (ex: "Golf diesel ate 3000 EUR no Porto") e receber uma notificacao quando um novo anuncio corresponder, para nao ter de verificar a plataforma manualmente todos os dias.
2. **Como comprador a procura de um carro perto de mim**, quero ver os anuncios num mapa para rapidamente identificar veiculos disponiveis na minha zona, clicando nos pins para ver detalhes resumidos.
3. **Como comprador indeciso entre dois ou tres veiculos**, quero poder compara-los lado a lado numa tabela que mostre todas as especificacoes (preco, km, ano, combustivel, estado, manutencao necessaria), para tomar uma decisao informada.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

#### 2.1 Buscas Salvas com Alertas
O utilizador pode guardar uma combinacao de filtros como "Busca Salva". Quando um novo anuncio e aprovado e corresponde aos criterios de pelo menos uma busca salva, o sistema cria uma notificacao para o utilizador. As buscas salvas sao geridas numa seccao do perfil.

#### 2.2 Busca por Mapa
Visualizacao dos anuncios aprovados sobre um mapa interativo. Cada anuncio e representado por um pin/marker na localizacao correspondente (baseado no campo `local` — concelho). Ao clicar no pin, aparece um popup com foto, titulo, preco e link para detalhes. O mapa usa Leaflet + OpenStreetMap (gratuito).

#### 2.3 Comparacao Lado a Lado
O utilizador pode selecionar ate 3 veiculos (via checkbox nos cartoes ou botao "Comparar") e abrir uma tabela comparativa que mostra todas as especificacoes relevantes em colunas. Funcionalidade tipo "carrinho de comparacao" com botao flutuante quando ha veiculos selecionados.

#### 2.4 Filtros Avancados
Expansao dos filtros existentes para incluir: cor, cambio, numero de portas, combustivel, intervalo de ano, intervalo de km, tipo de manutencao necessaria, com/sem orcamento, veiculo a rodar ou parado, com inspecao, numero minimo de fotos.

#### 2.5 Ordenacao Multipla
Alem da ordenacao por preco (ja existente), adicionar: por data (mais recente/mais antigo), por quilometragem (menor/maior), por ano (mais novo/mais antigo), por relevancia (score baseado na completude do anuncio e popularidade).

#### 2.6 Sugestoes "Voce Pode Gostar"
Seccao de recomendacoes personalizadas baseada nos favoritos do utilizador e no historico de navegacao. Algoritmo simples baseado em regras: se o utilizador favorita Golfs diesel, sugerir outros Volkswagen diesel ou Golfs similares.

### Fluxos de Utilizador

**Fluxo de Busca Salva:**
1. Utilizador aplica filtros na pagina principal (marca, preco, local, etc.)
2. Botao "Guardar Busca" aparece quando ha filtros ativos
3. Ao clicar, modal pede um nome para a busca (ex: "Golfs baratos Porto")
4. Busca e guardada na colecao `savedSearches` com filtros serializados
5. Quando novo anuncio e aprovado: comparar com buscas salvas de todos os utilizadores
6. Se match: criar notificacao via `criarNotificacao()` existente
7. Utilizador gere buscas salvas em Perfil → "Minhas Buscas"

**Fluxo de Busca por Mapa:**
1. Na pagina principal, toggle "Ver no Mapa" junto aos filtros
2. Vista muda de grelha para mapa fullscreen/split (mapa + lista lateral)
3. Pins agrupados por concelho (cluster markers quando muitos na mesma zona)
4. Clicar num pin → popup com miniatura do cartao do carro
5. Clicar "Ver detalhes" no popup → navega para `/detalhes/:id`
6. Filtros continuam a funcionar e atualizam os pins no mapa

**Fluxo de Comparacao:**
1. Em cada `CarCard`, checkbox "Comparar" aparece no canto
2. Ao selecionar o primeiro carro, barra flutuante aparece no fundo: "1 veiculo selecionado — Selecione mais para comparar"
3. Ao selecionar 2 ou 3, botao "Comparar Agora" fica ativo
4. Clicar abre modal fullscreen com tabela comparativa
5. Colunas: foto, marca/modelo, preco, ano, km, combustivel, cambio, cor, portas, local, estado, manutencoes, orcamento
6. Linhas com diferencas significativas sao destacadas (ex: preco mais baixo em verde)

### Requisitos de UI/UX

- Mapa deve ter fallback para vista em lista em caso de erro no carregamento do Leaflet
- Comparacao deve funcionar em mobile (scroll horizontal da tabela)
- Filtros avancados devem ser colapsaveis ("Mais Filtros" / "Menos Filtros") para nao sobrecarregar a UI
- Buscas salvas devem mostrar contador de novos resultados desde a ultima visita
- Sugestoes devem aparecer como seccao no final da pagina principal e na pagina de detalhes ("Veiculos similares")
- Pin do mapa deve usar icone customizado com cor que indica o preco (verde = low-cost, azul = medio, laranja = premium)

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Caminho | Finalidade |
|---|---|
| `src/types/busca.ts` | Interfaces para SavedSearch, CompareItem, SearchFilters, MapMarker |
| `src/hooks/useSavedSearches.ts` | Hook CRUD para buscas salvas com Firestore |
| `src/hooks/useCompare.ts` | Hook para gerir lista de veiculos a comparar (state local) |
| `src/hooks/useMapMarkers.ts` | Hook para preparar dados dos markers a partir dos carros filtrados |
| `src/hooks/useSugestoes.ts` | Hook para gerar sugestoes baseadas em favoritos e historico |
| `src/hooks/useAdvancedFilters.ts` | Hook que encapsula todos os filtros avancados |
| `src/components/busca/MapView.tsx` | Componente do mapa com Leaflet |
| `src/components/busca/MapPopup.tsx` | Popup customizado para os pins do mapa |
| `src/components/busca/CompareBar.tsx` | Barra flutuante de comparacao (fundo da tela) |
| `src/components/busca/CompareModal.tsx` | Modal fullscreen com tabela comparativa |
| `src/components/busca/SaveSearchButton.tsx` | Botao para guardar busca + modal de nome |
| `src/components/busca/SavedSearchesList.tsx` | Lista de buscas salvas (para o perfil) |
| `src/components/busca/AdvancedFilters.tsx` | Painel de filtros avancados expansivel |
| `src/components/busca/SortDropdown.tsx` | Dropdown de ordenacao com multiplas opcoes |
| `src/components/home/SugestoesSection.tsx` | Seccao de sugestoes "Voce Pode Gostar" |
| `src/components/detalhes/VeiculosSimilares.tsx` | Seccao de veiculos similares na pagina de detalhes |
| `src/lib/geocoding.ts` | Mapeamento de concelhos para coordenadas (lookup table estatica) |
| `src/lib/suggestions.ts` | Logica pura de calculo de sugestoes |

### Modificacoes em Arquivos Existentes

| Caminho | Alteracoes |
|---|---|
| `src/hooks/useCarros.ts` | Expandir com filtros avancados: cor, cambio, portas, combustivel, anoMin/Max, kmMin/Max, estadoVeiculo, tiposManutencao, rodando, inspecao, minFotos. Adicionar novas opcoes de ordenacao (data, km, ano, relevancia). |
| `src/components/home/CarCard.tsx` | Adicionar checkbox "Comparar" no canto superior direito. Indicar visualmente se o cartao esta selecionado para comparacao. |
| `src/components/home/CarGrid.tsx` | Integrar toggle mapa/grelha. Passar handlers de comparacao para CarCard. |
| `src/components/home/FilterChips.tsx` | Integrar botao "Mais Filtros" que abre/fecha AdvancedFilters. Adicionar botao "Guardar Busca". |
| `src/pages/Home.tsx` | Integrar MapView como alternativa a CarGrid. Adicionar CompareBar. Adicionar SugestoesSection no final. |
| `src/pages/DetalhesCarro.tsx` | Adicionar VeiculosSimilares no final da pagina. |
| `src/components/perfil/ProfileLoggedIn.tsx` | Adicionar seccao "Minhas Buscas Guardadas" com SavedSearchesList. |
| `src/types/carro.ts` | Adicionar novos tipos de ordenacao ao tipo SortOrdem |
| `src/lib/constants.ts` | Adicionar CORES_CARRO, CONCELHO_COORDS (mapeamento concelho → lat/lng) |
| `src/types/app.ts` | Atualizar CarrosContextValue com novos filtros |

### Colecoes Firestore

#### Colecao `savedSearches`
```typescript
interface SavedSearch {
  id: string;
  uid: string;
  nome: string;              // Nome dado pelo utilizador
  filtros: SearchFilters;    // Objeto serializado com todos os filtros
  alertaAtivo: boolean;
  dataCriacao: Timestamp;
  ultimoAlerta?: Timestamp;
  novosResultados: number;   // Contador incrementado quando novo match aparece
}

interface SearchFilters {
  marca?: string;
  modelo?: string;
  precoMin?: number;
  precoMax?: number;
  anoMin?: number;
  anoMax?: number;
  kmMin?: number;
  kmMax?: number;
  combustivel?: string;
  cambio?: string;
  cor?: string;
  portas?: number;
  local?: string;
  estadoVeiculo?: string;
  tiposManutencao?: string[];
  rodando?: boolean;
  inspecao?: boolean;
  minFotos?: number;
}
```

#### Nenhuma colecao adicional
Os dados de comparacao e sugestoes sao geridos em estado local (React state/sessionStorage). Os markers do mapa sao derivados dos dados de carros ja existentes.

### Regras de Seguranca Firestore

```
match /savedSearches/{searchId} {
  allow read: if isAuthenticated()
    && resource.data.uid == request.auth.uid;
  allow create: if isAuthenticated()
    && request.resource.data.uid == request.auth.uid;
  allow update: if isAuthenticated()
    && resource.data.uid == request.auth.uid;
  allow delete: if isAuthenticated()
    && resource.data.uid == request.auth.uid;
}
```

### APIs / Servicos Externos

#### Leaflet + OpenStreetMap
- **Leaflet:** Biblioteca JavaScript open-source para mapas interativos
- **OpenStreetMap:** Tiles de mapa gratuitos (sem API key necessaria)
- **Custo:** Gratuito (tiles OpenStreetMap sao CC-BY-SA, uso comercial permitido com atribuicao)
- **Pacotes npm:** `leaflet` + `react-leaflet` + `@types/leaflet`
- **Sem geocoding necessario:** Usaremos uma lookup table estatica de coordenadas dos concelhos (CONCELHOS ja definidos em constants.ts: Braga, Porto, Lisboa, Coimbra, Faro, Leiria)

### Componentes React Principais

```typescript
// src/components/busca/MapView.tsx
interface MapViewProps {
  carros: Carro[];
  onCarroClick: (id: string) => void;
  center?: [number, number];  // Default: centro de Portugal
  zoom?: number;               // Default: 7
}

// src/components/busca/MapPopup.tsx
interface MapPopupProps {
  carro: Carro;
}

// src/components/busca/CompareBar.tsx
interface CompareBarProps {
  selectedIds: string[];
  carros: Carro[];
  onRemove: (id: string) => void;
  onCompare: () => void;
  onClear: () => void;
}

// src/components/busca/CompareModal.tsx
interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  carros: Carro[];   // 2-3 carros para comparar
}

// src/components/busca/SaveSearchButton.tsx
interface SaveSearchButtonProps {
  filtrosAtivos: SearchFilters;
  onSave: (nome: string) => void;
  disabled?: boolean;  // Desativado se nenhum filtro ativo
}

// src/components/busca/SavedSearchesList.tsx
interface SavedSearchesListProps {
  uid: string;
}

// src/components/busca/AdvancedFilters.tsx
interface AdvancedFiltersProps {
  filtros: SearchFilters;
  onChange: (filtros: Partial<SearchFilters>) => void;
  onReset: () => void;
}

// src/components/busca/SortDropdown.tsx
interface SortDropdownProps {
  value: SortOrdem;
  onChange: (v: SortOrdem) => void;
}

// src/components/home/SugestoesSection.tsx
interface SugestoesSectionProps {
  favoritos: string[];
  carros: Carro[];
  maxSugestoes?: number;  // Default: 6
}

// src/components/detalhes/VeiculosSimilares.tsx
interface VeiculosSimilaresProps {
  carroAtual: Carro;
  todosCarros: Carro[];
  maxResultados?: number;  // Default: 4
}

// src/hooks/useCompare.ts
interface UseCompareReturn {
  selectedIds: string[];
  toggleCompare: (id: string) => void;
  isSelected: (id: string) => boolean;
  clearCompare: () => void;
  canCompare: boolean;   // true if 2-3 selected
  count: number;
}

// src/hooks/useAdvancedFilters.ts
interface UseAdvancedFiltersReturn {
  filtros: SearchFilters;
  setFiltro: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  resetFiltros: () => void;
  temFiltrosAtivos: boolean;
  aplicar: (carros: Carro[]) => Carro[];  // Applies all filters
}

// src/lib/geocoding.ts
interface ConcelhoCoordenadas {
  nome: string;
  lat: number;
  lng: number;
}
// Export CONCELHO_COORDS: Record<string, ConcelhoCoordenadas>
```

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Tarefa | Esforco (dias) | Competencias |
|---|---|---|
| Tipos TypeScript (busca.ts, atualizacoes em carro.ts e app.ts) | 0.5 | TypeScript |
| Lookup table de coordenadas dos concelhos (geocoding.ts) | 0.5 | Dados geograficos |
| Logica de sugestoes (suggestions.ts) | 1 | Logica de negocios |
| Expansao do `useCarros` com filtros avancados e ordenacao | 2 | React, logica de filtragem |
| Hook `useAdvancedFilters` | 1 | React |
| Hook `useCompare` | 0.5 | React |
| Hook `useSavedSearches` (CRUD Firestore) | 1 | React, Firestore |
| Hook `useMapMarkers` | 0.5 | React |
| Hook `useSugestoes` | 1 | React |
| Componente `MapView` com Leaflet + `MapPopup` | 3 | React, Leaflet, react-leaflet |
| Componentes de comparacao (`CompareBar`, `CompareModal`) | 2 | React, Tailwind |
| Componente `AdvancedFilters` | 1.5 | React, Tailwind |
| Componente `SortDropdown` | 0.5 | React, Tailwind |
| Componentes de busca salva (`SaveSearchButton`, `SavedSearchesList`) | 1.5 | React, Tailwind, Firestore |
| Componentes de sugestoes (`SugestoesSection`, `VeiculosSimilares`) | 1.5 | React, Tailwind |
| Integracao (Home, CarCard, CarGrid, FilterChips, DetalhesCarro, ProfileLoggedIn) | 2 | React |
| Regras Firestore | 0.5 | Firestore Rules |
| Testes manuais e ajustes | 2 | QA |
| **Total** | **~22 dias** | |

### Avaliacao de Valor

| Dimensao | Impacto | Justificacao |
|---|---|---|
| **Aquisicao** | Alto | Mapa e comparacao sao funcionalidades que geram partilha e atraem novos utilizadores |
| **Retencao** | Muito Alto | Buscas salvas + alertas sao o mecanismo #1 de retencao em marketplaces; trazem o utilizador de volta automaticamente |
| **Conversao** | Alto | Filtros avancados + comparacao reduzem tempo de decisao; sugestoes aumentam paginas vistas por sessao |
| **Experiencia** | Muito Alto | Corrige a principal limitacao funcional atual da plataforma |

### Posicao na Matriz

**ESTRATEGICO** — Esforco medio-alto (22 dias), valor muito alto. A busca e a funcionalidade mais critica de qualquer marketplace. As buscas salvas com alertas sao particularmente importantes para retencao: transformam visitantes unicos em utilizadores recorrentes. O mapa e a comparacao sao diferenciadores visuais e funcionais.

**Nota sobre priorizacao interna:** Se for necessario dividir em fases:
- **Fase 1 (Quick Win, ~8 dias):** Filtros avancados + Ordenacao multipla + Sugestoes
- **Fase 2 (Estrategico, ~8 dias):** Buscas salvas + Alertas + Comparacao
- **Fase 3 (Complementar, ~6 dias):** Mapa com Leaflet

---

## 5. Decisoes de Arquitetura

### Decisao 1: Biblioteca de Mapas

**Contexto:** Necessitamos de uma biblioteca para renderizar mapa interativo com pins de anuncios. Tres opcoes foram avaliadas.

| Opcao | Pros | Contras |
|---|---|---|
| **Leaflet + OpenStreetMap** | Totalmente gratuito (sem limite de requisicoes de tiles); open-source; leve (~40KB); comunidade ativa; react-leaflet bem mantido; sem API key | Design dos tiles menos polido que Google Maps; menos funcionalidades out-of-the-box (ex: Street View) |
| **Google Maps** | Design premium; funcionalidades extensas (Street View, geocoding, routing); muito usado | Custo significativo apos tier gratuito (28.000 carregamentos/mes gratis, depois ~7 USD/1000); requer API key; vendor lock-in |
| **Mapbox** | Design customizavel; bom desempenho; tier gratuito generoso (50.000 carregamentos/mes) | Custo apos tier gratuito; complexidade de integracao; SDK mais pesado que Leaflet |

**Recomendacao:** **Leaflet + OpenStreetMap**. Para um marketplace portugues em fase de crescimento, o custo zero e determinante. Os tiles do OpenStreetMap sao perfeitamente adequados para exibir localizacoes de anuncios por concelho (nao necessitamos de Street View nem geocoding avancado). A integracao com React e simples via `react-leaflet`. Se no futuro a plataforma necessitar de mapas mais sofisticados, a migracao para Mapbox e relativamente simples (ambos usam o padrao slippy maps).

### Decisao 2: Motor de Recomendacoes

**Contexto:** Necessitamos definir como gerar sugestoes personalizadas para cada utilizador.

| Opcao | Pros | Contras |
|---|---|---|
| **Regras simples (content-based)** | Simples de implementar; previsivel e explicavel; funciona com poucos dados; sem infraestrutura adicional | Limitado em diversidade; pode criar "bolha" de sugestoes; nao aprende comportamentos implicitos |
| **Collaborative filtering** | Descobre padroes nao obvios ("utilizadores como voce tambem gostaram de..."); potencialmente mais preciso | Requer volume significativo de utilizadores e interacoes; complexidade elevada; necessita de backend de ML; cold-start problem severo |

**Recomendacao:** **Regras simples (content-based)** como unica abordagem nesta fase. O algoritmo:
1. Recolher marcas e modelos dos favoritos do utilizador
2. Recolher marca/modelo dos ultimos 5 anuncios visitados (via sessionStorage)
3. Gerar score para cada carro nao visitado: +3 se mesma marca de um favorito, +2 se mesmo tipo de combustivel, +1 se faixa de preco similar (+/- 30%), +1 se mesmo concelho
4. Ordenar por score e devolver top N

Collaborative filtering pode ser adicionado quando a plataforma tiver >1000 utilizadores ativos e volume suficiente de interacoes para treinar um modelo.

---

## 6. Prompt de Implementacao

```
You are implementing the "Advanced Search & Discovery" feature set for ReparAuto, a Portuguese used-car and parts marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase.

IMPORTANT CONTEXT:
- All UI text must be in Portuguese (PT-PT). Code, comments, variable names in English.
- Import alias: @/ maps to src/. NEVER use relative imports.
- Styling: Tailwind utility classes only. Theme in src/index.css.
- State: Context API + custom hooks. No Redux/Zustand.
- Real-time: Firestore onSnapshot() with cleanup on unmount.
- Existing filter system in useCarros: filtroAtivo ('lowcost'|'500'|'1000'|'reparar'|'qualquer'|null), searchQuery, advPriceMin/Max, advLocation, sortOrdem ('crescente'|'decrescente'|null).

EXISTING FILES TO REFERENCE:
- src/types/carro.ts — Carro (marca, modelo, anoFabricacao, anoModelo, preco, km, combustivel: Combustivel, cambio: Cambio, cor, portas, local, estadoVeiculo: EstadoVeiculo, tiposManutencao: string[], temOrcamento, rodando, inspecao, fotos[], status, dataCriacao). Also: FiltroAtivo, SortOrdem, FiltroChip, CarroFormData.
- src/types/app.ts — CarrosContextValue with carros, carrosFiltrados, all filter getters/setters, publicarCarro, eliminarCarro, getCarroPorId
- src/hooks/useCarros.ts — Client-side filtering with filtroAtivo, searchQuery, advPriceMin/Max, advLocation, sortOrdem. Uses subscribeCarros() for real-time.
- src/hooks/useFavoritos.ts — favoritos: string[], toggleFavorito(), isFavorito(). Firestore for auth users, localStorage fallback.
- src/lib/db.ts — subscribeCarros(), addCarro(), criarNotificacao(uid, tipo, titulo, mensagem, link?). Collection: 'cars'. Notification collection: 'notifications'.
- src/lib/constants.ts — CONCELHOS: ['Braga', 'Porto', 'Lisboa', 'Coimbra', 'Faro', 'Leiria'], TIPOS_COMBUSTIVEL, TIPOS_CAMBIO, TIPOS_MANUTENCAO
- src/components/home/CarCard.tsx — Individual car card
- src/components/home/CarGrid.tsx — Grid of CarCards
- src/components/home/FilterChips.tsx — Current filter chip bar
- src/components/home/HeroBanner.tsx — Hero section on home page
- src/pages/Home.tsx — Main listing page
- src/pages/DetalhesCarro.tsx — Car detail page
- src/components/perfil/ProfileLoggedIn.tsx — User profile
- src/components/ui/Modal.tsx — Reusable modal component
- src/App.tsx — Routes: /, /detalhes/:id, /anunciar, /pecas, /perfil, /setup-perfil, /admin, /:tipo
- src/data/marcas-modelos.json — Car makes and models database
- firestore.rules — Existing security rules

INSTALL DEPENDENCIES:
- Run: npm install leaflet react-leaflet @types/leaflet

TASKS — Implement in this order:

1. TYPE DEFINITIONS
   Create src/types/busca.ts:
   - interface SearchFilters { marca?: string; modelo?: string; precoMin?: number; precoMax?: number; anoMin?: number; anoMax?: number; kmMin?: number; kmMax?: number; combustivel?: string; cambio?: string; cor?: string; portas?: number; local?: string; estadoVeiculo?: string; tiposManutencao?: string[]; rodando?: boolean; inspecao?: boolean; minFotos?: number; }
   - interface SavedSearch { id: string; uid: string; nome: string; filtros: SearchFilters; alertaAtivo: boolean; dataCriacao: Timestamp; ultimoAlerta?: Timestamp; novosResultados: number; }
   - interface MapMarker { id: string; lat: number; lng: number; carro: Carro; }

   Modify src/types/carro.ts:
   - Expand SortOrdem type to: 'preco_asc' | 'preco_desc' | 'data_desc' | 'data_asc' | 'km_asc' | 'km_desc' | 'ano_desc' | 'ano_asc' | null
   - NOTE: This changes the existing type. Update useCarros.ts sorting logic accordingly.

2. GEOCODING LOOKUP TABLE
   Create src/lib/geocoding.ts:
   - Export const CONCELHO_COORDS: Record<string, { lat: number; lng: number }> with coordinates for existing concelhos:
     - Braga: { lat: 41.5518, lng: -8.4229 }
     - Porto: { lat: 41.1579, lng: -8.6291 }
     - Lisboa: { lat: 38.7223, lng: -9.1393 }
     - Coimbra: { lat: 40.2033, lng: -8.4103 }
     - Faro: { lat: 37.0194, lng: -7.9322 }
     - Leiria: { lat: 39.7437, lng: -8.8071 }
   - Export function getCoordenadasPorLocal(local: string): { lat: number; lng: number } | null
   - Export const PORTUGAL_CENTER: [number, number] = [39.5, -8.0]
   - Export const PORTUGAL_ZOOM = 7

3. SUGGESTIONS LOGIC
   Create src/lib/suggestions.ts:
   - Export function calculateSuggestions(carros: Carro[], favoritos: string[], historicoIds: string[], maxResults: number = 6): Carro[]
   - Algorithm: score each car not in favoritos and not in historicoIds
     - +3 points if same marca as any favorited car
     - +2 points if same combustivel as any favorited car
     - +1 point if price within 30% of any favorited car's price
     - +1 point if same local as any favorited car
     - Sort by score descending, return top maxResults
   - If no favoritos, return most recent carros (by dataCriacao)

4. DATABASE LAYER
   In src/lib/db.ts, add:
   - addSavedSearch(data: Omit<SavedSearch, 'id'>): Promise<string>
   - getSavedSearches(uid: string): Promise<SavedSearch[]>
   - deleteSavedSearch(id: string): Promise<void>
   - updateSavedSearch(id: string, data: Partial<SavedSearch>): Promise<void>
   Collection name: 'savedSearches'

5. HOOKS
   Create src/hooks/useAdvancedFilters.ts:
   - Manages all SearchFilters state
   - Returns filtros, setFiltro, resetFiltros, temFiltrosAtivos
   - Returns aplicar(carros: Carro[]): Carro[] — applies all filters to an array
   
   Create src/hooks/useCompare.ts:
   - State: selectedIds: string[] (max 3)
   - Returns selectedIds, toggleCompare(id), isSelected(id), clearCompare(), canCompare (2-3 selected), count
   - Persist selection in sessionStorage so it survives page navigation

   Create src/hooks/useSavedSearches.ts:
   - Takes uid
   - Returns searches, addSearch(nome, filtros), removeSearch(id), toggleAlert(id), loading

   Create src/hooks/useMapMarkers.ts:
   - Takes carros: Carro[]
   - Returns markers: MapMarker[] by mapping car.local to CONCELHO_COORDS

   Create src/hooks/useSugestoes.ts:
   - Takes carros: Carro[], favoritos: string[]
   - Reads historicoIds from sessionStorage (key: 'reparauto_historico')
   - Returns sugestoes: Carro[]

   Modify src/hooks/useCarros.ts:
   - Replace existing SortOrdem handling with expanded options
   - The advanced filter application can be done externally (by useAdvancedFilters.aplicar), so useCarros doesn't need to know about all advanced filters internally. But update the basic sortOrdem logic.

6. MAP COMPONENTS
   Create src/components/busca/MapView.tsx:
   - Import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
   - Import L from 'leaflet'
   - Fix default Leaflet marker icon issue (import marker-icon and marker-shadow from leaflet/dist/images)
   - Render map with OpenStreetMap tiles (attribution required)
   - Center on PORTUGAL_CENTER with PORTUGAL_ZOOM
   - Render markers from carros prop, using CONCELHO_COORDS
   - Each marker has a Popup with car summary (photo, title, price, link)
   - Must import leaflet CSS: add to index.html or import in component

   Create src/components/busca/MapPopup.tsx:
   - Mini car card: thumbnail photo (first of fotos[]), marca + modelo, price, local, link to /detalhes/:id

7. COMPARE COMPONENTS
   Create src/components/busca/CompareBar.tsx:
   - Fixed bottom bar (above BottomNav on mobile)
   - Shows count of selected cars + mini thumbnails
   - "Comparar" button (enabled when 2-3) + "Limpar" button
   - Slides up with animation when first car is selected

   Create src/components/busca/CompareModal.tsx:
   - Fullscreen modal (use existing Modal component as base)
   - Table with columns = selected cars, rows = attributes
   - Attributes: Foto (thumbnail), Marca/Modelo, Preco, Ano, KM, Combustivel, Cambio, Cor, Portas, Local, Estado, Manutencoes, Orcamento, Rodando, Inspecao
   - Highlight best value in each row (lowest price in green, lowest km in green, newest year in green)
   - Mobile: horizontal scroll for columns, sticky first column with attribute names

8. FILTER & SORT COMPONENTS
   Create src/components/busca/AdvancedFilters.tsx:
   - Collapsible panel with "Mais Filtros" toggle
   - Fields: Combustivel (select from TIPOS_COMBUSTIVEL), Cambio (select from TIPOS_CAMBIO), Cor (text input), Portas (number select: 2,3,4,5), Ano Min/Max (number inputs), KM Min/Max (number inputs), Estado (select: pronto/manutencao), Rodando (checkbox), Inspecao (checkbox), Min Fotos (number), Tipos Manutencao (multi-checkbox from TIPOS_MANUTENCAO)
   - "Limpar Filtros" button

   Create src/components/busca/SortDropdown.tsx:
   - Dropdown replacing current sort controls
   - Options: "Mais Recente", "Mais Antigo", "Preco: Menor", "Preco: Maior", "KM: Menor", "KM: Maior", "Ano: Mais Novo", "Ano: Mais Velho"

9. SAVED SEARCH COMPONENTS
   Create src/components/busca/SaveSearchButton.tsx:
   - Button that appears when filters are active
   - On click: small modal/popover asking for search name
   - Saves via useSavedSearches hook
   - Portuguese: "Guardar Busca"

   Create src/components/busca/SavedSearchesList.tsx:
   - List of saved searches with name, filter summary, toggle alert, delete
   - Badge with novosResultados count
   - Click on search → applies those filters on Home page

10. SUGGESTION COMPONENTS
    Create src/components/home/SugestoesSection.tsx:
    - Section at bottom of Home page: "Pode Gostar Destes"
    - Horizontal scrollable row of CarCards (or mini cards)
    - Uses useSugestoes hook

    Create src/components/detalhes/VeiculosSimilares.tsx:
    - Section at bottom of car detail page: "Veiculos Similares"
    - Grid of 4 similar cars (same marca, similar price/year)
    - Simple filtering: same marca, exclude current car, sort by price proximity

11. INTEGRATION
    Modify src/pages/Home.tsx:
    - Add view toggle (grid/map) below filters
    - Conditionally render CarGrid or MapView
    - Add CompareBar (floating)
    - Add SugestoesSection at bottom
    - Wire up AdvancedFilters and SortDropdown

    Modify src/components/home/CarCard.tsx:
    - Add compare checkbox (top-right corner, appears on hover on desktop, always visible on mobile)
    - Accept onCompareToggle and isCompared props

    Modify src/components/home/CarGrid.tsx:
    - Pass compare handlers through to CarCard

    Modify src/pages/DetalhesCarro.tsx:
    - Add VeiculosSimilares section at bottom
    - Track visit in sessionStorage for suggestion algorithm (append car ID to 'reparauto_historico')

    Modify src/components/perfil/ProfileLoggedIn.tsx:
    - Add "Buscas Guardadas" section with SavedSearchesList

    Update firestore.rules with savedSearches rules (owner-only CRUD).

DESIGN GUIDELINES:
- Map: Use a clean tile layer. Pin colors: green for preco <= 1000, blue for 1000-5000, orange for > 5000.
- Compare bar: dark background (slate-800), white text, fixed at bottom with z-50, smooth slide-up transition.
- Advanced filters: collapsible with smooth animation, contained in a card with subtle border.
- Suggestions: horizontal scroll with snap-scroll behavior, card shadows for depth.
- Mobile-first: all components must be fully functional on 375px width screens.
- Leaflet CSS must be imported (add <link> in index.html or import in MapView component).
```

---

*Documento gerado em 2026-05-27. Recomenda-se implementar em fases: Fase 1 (filtros avancados + ordenacao), Fase 2 (buscas salvas + comparacao), Fase 3 (mapa + sugestoes).*
