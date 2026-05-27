# Plano: Ecossistema de Pecas

**Prioridade:** MEDIA | **Estimativa Total:** ~14-20 dias de desenvolvimento

---

## 1. Visao Geral

### O Que Resolve

O mercado de pecas do ReparAuto e atualmente rudimentar: pecas sao listadas com uma marca de carro compativel (campo texto livre `marcaCarro` em `src/types/peca.ts`), sem vinculacao estruturada a veiculos, sem hierarquia de categorias, e sem mecanismo de matching automatico entre quem procura e quem vende. Um comprador a ver um carro com avaria nao tem forma de saber se existem pecas compativeis disponiveis na plataforma. Um desmanchador que quer listar 50 pecas de um mesmo carro tem de preencher o formulario 50 vezes. E quando alguem cria um anuncio do tipo "procura", ninguem e notificado.

Este plano transforma a seccao de pecas num ecossistema conectado: pecas vinculadas a veiculos, cross-referencia bidirecional, catalogo estruturado, upload simplificado para desmanchadores, e matching automatico de procuras com vendas.

### Benchmark Competitivo

- **Standvirtual Pecas**: Listagem basica sem compatibilidade estruturada. Filtragem por marca/modelo limitada.
- **Pecas24.pt**: Catalogo com compatibilidade por marca/modelo/ano, mas interface antiquada e sem marketplace integrado.
- **eBay Motors Parts**: Motor de compatibilidade sofisticado ("This fits your..."), cross-referencia extensiva, catalogo hierarquico.
- **TecDoc / PartCat**: Base de dados profissional de compatibilidade de pecas automotivas. Usado por oficinas e grossistas.
- **RockAuto (EUA)**: Catalogo por veiculo com diagrama de pecas, filtros avancados, precos de referencia.
- **Oportunidade**: Em Portugal, nao existe um marketplace que combine pecas usadas + compatibilidade estruturada + matching automatico. Mesmo importar uma fracao da logica do eBay Motors seria diferenciador.

### Historias de Usuario

1. **Como comprador de carro**, quero ver na pagina do meu carro quais pecas compativeis estao disponiveis na plataforma, para saber se posso reparar o carro com pecas acessiveis.
2. **Como vendedor de pecas**, quero que a minha peca apareca automaticamente nas paginas de carros compativeis, para aumentar a visibilidade.
3. **Como desmanchador**, quero listar rapidamente muitas pecas de um mesmo carro que estou a desmanchar, sem repetir informacoes do veiculo em cada peca.
4. **Como comprador de pecas**, quero filtrar pecas por compatibilidade exata (marca + modelo + ano + motor), nao apenas por marca.
5. **Como utilizador que procura uma peca**, quero ser notificado quando alguem publicar uma peca compativel com o meu pedido, para nao ter de verificar manualmente todos os dias.
6. **Como comprador**, quero ver o preco de referencia de uma peca nova para comparar com o preco da peca usada, para saber se o desconto e justo.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

| # | Funcionalidade | Descricao | Prioridade |
|---|---------------|-----------|------------|
| F1 | Motor de compatibilidade | Vincular pecas a veiculos por marca/modelo/ano com tabela estruturada | Alta |
| F2 | Cross-referencia carro-peca | Na pagina do carro, seccao "Pecas disponiveis"; na peca, "Veiculos compativeis" | Alta |
| F3 | Catalogo expandido | Hierarquia de subcategorias, mais opcoes de filtragem | Media |
| F4 | Upload em lote para desmanchadores | Formulario simplificado: selecionar carro base, listar pecas rapidamente | Media |
| F5 | Matching automatico de procuras | Notificar vendedores quando uma peca compativel com uma "procura" e publicada | Media |
| F6 | Referencia de precos | Indicar faixa de preco de peca nova para comparacao | Baixa |

### Fluxos de Usuario

**F1 -- Motor de Compatibilidade:**
1. Ao criar uma peca (CriarPecaModal), vendedor seleciona marca(s) e modelo(s) compativeis de uma lista estruturada (usando dados de `src/data/marcas-modelos.json`)
2. Opcionalmente, especifica faixa de anos (anoMin-anoMax) e tipo de motor/motorizacao
3. Dados de compatibilidade guardados como array de objetos: `compatibilidade: [{marca, modelo, anoMin?, anoMax?, motor?}]`
4. A busca de pecas pode filtrar por compatibilidade exata

**F2 -- Cross-Referencia:**
1. Na pagina `DetalhesCarro.tsx`, nova seccao: "Pecas disponiveis para este veiculo"
2. Query: pecas onde algum item em `compatibilidade[]` faz match com marca + modelo + ano do carro
3. Mostra ate 6 pecas compativeis com link para detalhes
4. Na pagina/modal de detalhes da peca (`DetalhesPecaModal.tsx`), seccao: "Veiculos compativeis"
5. Lista carros anunciados que fazem match com a compatibilidade da peca

**F3 -- Catalogo Expandido:**
1. Reestruturar `CATEGORIAS_PECAS` em hierarquia com subcategorias:
   - Motor e Transmissao -> Turbo, Injecao, Embraiagem, Caixa de Velocidades, etc.
   - Carrocaria -> Para-choques, Capot, Portas, Guarda-lamas, etc.
2. Filtro na pagina de Pecas com arvore colapsavel ou dropdowns encadeados
3. Manter retrocompatibilidade: pecas existentes sem subcategoria ficam na categoria pai

**F4 -- Upload em Lote:**
1. Botao "Desmanchar Carro" na pagina de Pecas (visivel para utilizadores logados)
2. Passo 1: Selecionar veiculo base (marca, modelo, ano, motorizacao) -- preenchido uma vez
3. Passo 2: Formulario repetivel para cada peca: titulo, categoria/subcategoria, estado, preco, descricao curta, foto (opcional)
4. Botao "Adicionar outra peca" repete o formulario mantendo o veiculo base
5. Todas as pecas herdam a compatibilidade do veiculo selecionado
6. Submit cria todas as pecas em batch com status 'pendente'

**F5 -- Matching Automatico:**
1. Quando uma peca do tipo 'procura' e criada, guardar os criterios de busca (marca, modelo, categoria)
2. Quando uma nova peca do tipo 'venda' ou 'desmonte' e aprovada, verificar se existe alguma 'procura' com criterios compativeis
3. Se match encontrado: enviar notificacao ao criador da procura: "Nova peca disponivel: [titulo] pode ser compativel com o seu pedido [titulo_procura]"
4. Matching baseado em: marca do carro compativel + categoria (match parcial e suficiente)
5. Frequencia: verificar no momento da aprovacao da peca (trigger no `updatePecaStatus`)

**F6 -- Referencia de Precos:**
1. Tabela interna de precos medios de pecas novas por categoria e marca
2. Na pagina de detalhes da peca, mostrar badge: "Peca nova: ~X euros | Esta peca: Y euros (Z% de desconto)"
3. Dados iniciais baseados em medias de mercado, atualizaveis pelo admin

### Requisitos de UI/UX

- Selecao de compatibilidade deve ser rapida e intuitiva (autocomplete, nao formulario longo)
- Cross-referencia deve ser visualmente clara e nao sobrecarregar a pagina de detalhes
- Upload em lote deve manter o contexto do veiculo base visivel enquanto se adicionam pecas
- Notificacoes de matching devem ser acionaveis (link direto para a peca encontrada)
- Catalogo hierarquico deve manter a simplicidade na filtragem (max 2 niveis)
- Referencia de precos deve ser informativa, nao prescritiva (disclaimer de "valor aproximado")

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/detalhes/CompatibleParts.tsx` | Seccao de pecas compativeis na pagina do carro |
| `src/components/pecas/CompatibleVehicles.tsx` | Seccao de veiculos compativeis na pagina da peca |
| `src/components/pecas/CompatibilitySelector.tsx` | Widget de selecao de compatibilidade (marca/modelo/ano) |
| `src/components/pecas/BulkPartUpload.tsx` | Modal/pagina de upload em lote para desmanchadores |
| `src/components/pecas/CategoryTree.tsx` | Componente de selecao hierarquica de categorias |
| `src/components/pecas/PriceReference.tsx` | Badge de referencia de preco novo vs usado |
| `src/hooks/useCompatibility.ts` | Hook para busca de pecas/carros compativeis |
| `src/hooks/usePartMatching.ts` | Hook para logica de matching de procuras |
| `src/lib/compatibility.ts` | Funcoes de matching: matchPecaToCarro, matchCarroToPecas |
| `src/lib/categories.ts` | Estrutura hierarquica de categorias e subcategorias |
| `src/lib/price-reference.ts` | Tabela de precos de referencia e calculo de desconto |
| `src/types/compatibility.ts` | Tipos: CompatibilityEntry, PartCategory, SubCategory |
| `src/data/categorias-pecas.json` | Estrutura hierarquica de categorias com subcategorias |
| `src/data/precos-referencia.json` | Tabela de precos medios de pecas novas |

### Modificacoes em Arquivos Existentes

| Arquivo | Alteracao |
|---------|-----------|
| `src/types/peca.ts` | Adicionar: `compatibilidade?: CompatibilityEntry[]`, `subcategoria?: string`, `fotos?: string[]` (array em vez de `foto?: string`) |
| `src/pages/DetalhesCarro.tsx` | Adicionar seccao CompatibleParts abaixo da descricao |
| `src/components/pecas/DetalhesPecaModal.tsx` | Adicionar seccao CompatibleVehicles e PriceReference |
| `src/components/pecas/CriarPecaModal.tsx` | Substituir input texto `marcaCarro` por CompatibilitySelector; adicionar subcategoria |
| `src/components/pecas/PecasFilter.tsx` | Adicionar filtro de compatibilidade (marca/modelo/ano) e subcategoria |
| `src/hooks/usePecas.ts` | Adicionar filtro de compatibilidade na funcao `pecasFiltradas()` |
| `src/pages/Pecas.tsx` | Adicionar botao "Desmanchar Carro" que abre BulkPartUpload |
| `src/lib/db.ts` | Adicionar funcoes: `getPecasCompativeis(marca, modelo, ano)`, `getCarrosCompativeis(compatibilidade[])`, `matchProcuras(novaPeca)` |
| `src/lib/constants.ts` | Substituir `CATEGORIAS_PECAS` por referencia ao novo `categorias-pecas.json`; manter array flat para retrocompatibilidade |
| `src/components/admin/EditarPecaModal.tsx` | Adicionar CompatibilitySelector na edicao de pecas |
| `firestore.rules` | Adicionar regra para nova colecao `price_references`; atualizar validacao de `parts` para novo schema |

### Colecoes Firestore (schema)

```
// Collection: parts (campos adicionais ao documento existente)
{
  ...campos_existentes,
  compatibilidade: [             // NOVO: array de veiculos compativeis
    {
      marca: string,             // Ex: "Volkswagen"
      modelo: string,            // Ex: "Golf IV"
      anoMin?: number,           // Ex: 2000
      anoMax?: number,           // Ex: 2005
      motor?: string,            // Ex: "1.9 TDI 110cv"
    }
  ],
  subcategoria?: string,         // Ex: "Turbo" (dentro de "Motor e Transmissão")
  fotos: string[],               // Expandido de foto?: string para array (max 3)
  // Campo existente marcaCarro mantido para retrocompatibilidade
}

// Nova Collection: price_references (tabela de precos de referencia)
{
  id: string,
  categoria: string,             // Ex: "Motor e Transmissão"
  subcategoria?: string,         // Ex: "Turbo"
  marcaCarro?: string,           // Ex: "Volkswagen" (opcional, para pecas especificas)
  precoNovoMin: number,          // Preco minimo de peca nova
  precoNovoMax: number,          // Preco maximo de peca nova
  precoUsadoMin: number,         // Preco minimo de peca usada (referencia)
  precoUsadoMax: number,         // Preco maximo de peca usada (referencia)
  fonte: string,                 // Ex: "Estimativa de mercado 2025"
  dataAtualizacao: Timestamp,
}

// Nova Collection: part_searches (procuras ativas para matching)
{
  id: string,
  pecaId: string,                // ID da peca tipo 'procura' original
  criadorUid: string,            // UID do criador da procura
  categoria: string,             // Categoria procurada
  subcategoria?: string,
  marcaCarro: string,            // Marca do carro compativel
  modeloCarro?: string,          // Modelo do carro compativel
  ativo: boolean,                // Se a procura ainda esta ativa
  dataCriacao: Timestamp,
  ultimoMatch?: Timestamp,       // Data do ultimo match enviado
}
```

### Regras de Seguranca Firestore

```
// firestore.rules -- novas regras

match /price_references/{refId} {
  allow read: if true; // Publico (tabela de referencia)
  allow write: if isAdmin(); // Apenas admin pode atualizar precos
}

match /part_searches/{searchId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && request.resource.data.criadorUid == request.auth.uid;
  allow update: if isAuthenticated() && request.auth.uid == resource.data.criadorUid;
  allow delete: if isAuthenticated() && request.auth.uid == resource.data.criadorUid || isAdmin();
}
```

### APIs/Servicos Externos

| Servico | Uso | Custo |
|---------|-----|-------|
| TecDoc API (opcional, fase futura) | Base de dados profissional de compatibilidade | ~200-500 euros/mes (caro, adiado) |
| `marcas-modelos.json` (existente) | Base de dados interna de marcas e modelos | Gratuito (ja existe em `src/data/`) |
| Nenhum servico externo para F1-F6 | Tudo baseado em dados internos e Firestore | Custo Firestore (reads/writes) |

### Componentes React Principais

**CompatibilitySelector:**
- Props: `value: CompatibilityEntry[]`, `onChange: (entries: CompatibilityEntry[]) => void`, `maxEntries?: number`
- UI: Lista de entradas de compatibilidade, cada uma com selects para marca (filtrado de marcas-modelos.json) e modelo (filtrado pela marca selecionada), inputs numericos opcionais para anoMin/anoMax, input texto para motor
- Botao "Adicionar compatibilidade" para multiplas entradas
- Reutiliza dados de `src/data/marcas-modelos.json` (carregados via `useMarcasModelos` hook existente em `src/hooks/useMarcasModelos.ts`)

**CompatibleParts:**
- Props: `carro: Carro`
- Usa `useCompatibility(carro.marca, carro.modelo, carro.anoFabricacao)` para buscar pecas
- Mostra grid de ate 6 PecasCard com link "Ver todas as N pecas compativeis"

**CompatibleVehicles:**
- Props: `peca: Peca`
- Mostra lista de veiculos compativeis baseado no array `peca.compatibilidade[]`
- Para cada entrada, busca carros anunciados que fazem match

**BulkPartUpload:**
- Modal/pagina com dois passos:
  1. Selecionar veiculo base (CompatibilitySelector com maxEntries=1)
  2. Lista de formularios de pecas (titulo, categoria, subcategoria, estado, preco, descricao, foto)
- Cada formulario e compacto (1-2 linhas) para permitir entrada rapida
- Botao "Adicionar peca" repete o formulario
- Botao "Publicar N pecas" cria em batch

**CategoryTree:**
- Props: `value: string`, `onChange: (categoria: string, subcategoria?: string) => void`
- Dropdown principal com categorias, dropdown secundario com subcategorias (filtradas pela categoria selecionada)
- Carrega dados de `src/data/categorias-pecas.json`

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Funcionalidade | Frontend | Backend/Config | Total |
|---------------|----------|---------------|-------|
| F1: Motor de compatibilidade | 3 dias | 1 dia (schema + queries) | 4 dias |
| F2: Cross-referencia carro-peca | 2.5 dias | 1 dia (queries + indices) | 3.5 dias |
| F3: Catalogo expandido | 2 dias | 0.5 dia (dados) | 2.5 dias |
| F4: Upload em lote | 3 dias | 0.5 dia (batch writes) | 3.5 dias |
| F5: Matching automatico | 1.5 dias | 2 dias (logica + notificacoes) | 3.5 dias |
| F6: Referencia de precos | 1 dia | 1 dia (colecao + seed) | 2 dias |
| **Total** | **13 dias** | **6 dias** | **~19 dias** |

### Avaliacao de Valor

- **Diferenciacao competitiva:** MUITO ALTO. A cross-referencia carro-peca e o matching automatico nao existem em nenhum marketplace generalista em Portugal.
- **Ecossistema integrado:** ALTO. Conectar carros e pecas cria um efeito de rede: mais carros atraem vendedores de pecas, que atraem compradores de carros que precisam de reparacao.
- **Alinhamento com a missao:** ALTO. O ReparAuto e focado em carros que precisam de reparacao. Pecas compativeis sao o complemento natural.
- **Retencao de desmanchadores:** ALTO. O upload em lote e o unico fator que fara desmanchadores profissionais adotarem a plataforma.
- **Complexidade tecnica:** MEDIO. O motor de compatibilidade requer queries compostas no Firestore (arrays de objetos), que podem exigir indices compostos.

### Posicao na Matriz

**Quadrante: Alto Valor / Esforco Medio-Alto**

A implementacao faseada recomendada: F1 (compatibilidade) e F2 (cross-referencia) primeiro como base essencial, depois F3 (catalogo) e F4 (upload lote) para atrair profissionais, e finalmente F5 (matching) e F6 (precos) como funcionalidades de retencao.

---

## 5. Decisoes de Arquitetura

### Decisao 1: Base de Compatibilidade

**Contexto:** Necessidade de vincular pecas a veiculos de forma estruturada. A questao principal e construir uma tabela propria ou integrar uma base de dados profissional como TecDoc.

| Opcao | Pros | Contras |
|-------|------|---------|
| **Tabela propria** (baseada em `marcas-modelos.json` existente) | Ja existe a base de dados de marcas/modelos no projeto, sem custo, controlo total, pode comecar imediatamente | Sem dados de motorizacao/cilindrada, sem cross-referencia de numero de peca OEM, vendedores definem compatibilidade manualmente |
| **TecDoc API** | Base de dados profissional com >500.000 pecas referenciadas, compatibilidade exata por numero OEM, diagramas de pecas | Custo elevado (200-500 euros/mes), API complexa (SOAP/REST legacy), overkill para marketplace de pecas usadas, registro empresarial necessario |
| **PartCat / aftermarket DB** | Alternativa mais leve ao TecDoc, API REST moderna, foco em aftermarket | Ainda tem custo mensal, cobertura de mercado portugues pode ser limitada |

**Recomendacao:** **Tabela propria** baseada no `marcas-modelos.json` existente em `src/data/marcas-modelos.json`, expandida com faixas de anos e motorizacoes opcionais. O vendedor define manualmente para quais veiculos a peca e compativel, usando selects pre-preenchidos (nao texto livre). Isto e suficiente para um marketplace de pecas usadas onde a compatibilidade e tipicamente "marca + modelo + geracao". O TecDoc pode ser integrado numa fase futura se o volume de pecas justificar o investimento, mas para o MVP e desnecessario e excessivamente caro.

### Decisao 2: Matching Automatico

**Contexto:** Quando alguem publica uma peca tipo "procura", e quando uma peca tipo "venda" e aprovada, queremos notificar os utilizadores relevantes automaticamente.

| Opcao | Pros | Contras |
|-------|------|---------|
| **Cloud Functions com trigger** (onUpdate na colecao parts, quando status muda para 'aprovado') | Execucao garantida, nao depende do cliente estar online, pode processar matching complexo | Requer Firebase Blaze plan (pay-as-you-go), complexidade de deploy, cold starts |
| **Verificacao client-side periodica** (o cliente verifica matches ao carregar a pagina de pecas) | Sem custo adicional, implementacao simples, funciona no plano gratuito | So executa quando o utilizador esta online, atraso na notificacao, carga desnecessaria no cliente, nao escala |
| **Matching no momento da aprovacao (admin client-side)** | Sem Cloud Functions, executa quando admin aprova a peca, admin esta sempre online | Depende do admin estar a usar a plataforma, adiciona complexidade ao fluxo de aprovacao, single point of failure |

**Recomendacao:** **Matching no momento da aprovacao (admin client-side)** como solucao inicial, com migracao para Cloud Functions quando viavel. Quando o admin aprova uma peca do tipo 'venda' ou 'desmonte' via `updatePecaStatus()` em `src/lib/db.ts`, a funcao tambem verifica a colecao `part_searches` por matches compativeis e cria notificacoes. Isto evita o custo de Cloud Functions enquanto garante que o matching acontece num momento previsivel. A logica de matching e encapsulada em `src/lib/compatibility.ts` para facilitar a futura migracao para Cloud Functions.

---

## 6. Prompt de Implementacao

```
You are implementing the "Parts Ecosystem" feature set for ReparAuto, a Portuguese used-car marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase. All UI text in Portuguese (PT-PT). Code in English. Use @/ import alias.

## Context

The project uses:
- React 19 with Context API (AppProvider at src/providers/AppProvider.tsx)
- Firestore collections: 'cars' and 'parts' (defined in src/lib/db.ts as CARROS_COLLECTION and PECAS_COLLECTION)
- Car type at src/types/carro.ts: Carro with marca, modelo, anoFabricacao, anoModelo, combustivel, estadoVeiculo, tiposManutencao[]
- Part type at src/types/peca.ts: Peca with tipo ('venda'|'desmonte'|'procura'), titulo, categoria, marcaCarro (free text), modeloCarro (free text, optional), preco, estado, descricao, foto (single string, optional)
- Part categories at src/lib/constants.ts: CATEGORIAS_PECAS = ['Motor e Transmissão', 'Carroçaria e Chaparia', 'Iluminação e Óticas', 'Interior e Bancos', 'Suspensão e Travões', 'Eletrónica e Sensores', 'Carro Completo p/ Desmonte', 'Outros']
- Part states at src/lib/constants.ts: ESTADOS_PECA
- Car makes/models data at src/data/marcas-modelos.json: array of { marca: string, modelos: string[] }
- Existing useMarcasModelos hook at src/hooks/useMarcasModelos.ts for loading makes/models data
- Part creation modal at src/components/pecas/CriarPecaModal.tsx: currently uses free text input for marcaCarro
- Part details modal at src/components/pecas/DetalhesPecaModal.tsx
- Part filter component at src/components/pecas/PecasFilter.tsx
- Parts hook at src/hooks/usePecas.ts: manages filtering by tipo, searchTerm, categoria, estado
- Car details page at src/pages/DetalhesCarro.tsx: currently shows TechnicalSheet, StatusPanel, ContactSection, GalleryModal
- Parts page at src/pages/Pecas.tsx: shows PecasFilter + PecasGrid + CriarPecaModal
- DB functions at src/lib/db.ts: addPeca(), getPecas(), subscribePecas(), updatePecaStatus(), criarNotificacao()
- Notification types at src/types/notificacao.ts: TipoNotificacao = 'aprovado' | 'rejeitado' | 'info' | 'mensagem'
- Admin part editing at src/components/admin/EditarPecaModal.tsx

## Task 1: Compatibility Data Model

Create src/types/compatibility.ts:
```typescript
export interface CompatibilityEntry {
  marca: string;
  modelo: string;
  anoMin?: number;
  anoMax?: number;
  motor?: string;
}

export interface PartCategory {
  nome: string;
  subcategorias: string[];
}
```

Modify src/types/peca.ts:
1. Add import for CompatibilityEntry from '@/types/compatibility'.
2. Add to Peca interface: compatibilidade?: CompatibilityEntry[], subcategoria?: string, fotos?: string[] (note: keep existing foto?: string for backward compatibility).
3. Add to PecaFormData: compatibilidade: CompatibilityEntry[], subcategoria: string.

Create src/data/categorias-pecas.json:
```json
[
  {
    "nome": "Motor e Transmissão",
    "subcategorias": ["Turbo", "Injeção", "Embraiagem", "Caixa de Velocidades", "Correia/Corrente de Distribuição", "Radiador", "Motor Completo", "Arranque", "Alternador", "Outros Motor"]
  },
  {
    "nome": "Carroçaria e Chaparia",
    "subcategorias": ["Para-choques", "Capot", "Portas", "Guarda-lamas", "Espelhos", "Tejadilho", "Mala/Porta-bagagens", "Outros Carroçaria"]
  },
  {
    "nome": "Iluminação e Óticas",
    "subcategorias": ["Faróis Frontais", "Farolins Traseiros", "Piscas/Indicadores", "Faróis de Nevoeiro", "LEDs/Xenon", "Outros Iluminação"]
  },
  {
    "nome": "Interior e Bancos",
    "subcategorias": ["Bancos Dianteiros", "Banco Traseiro", "Tablier/Painel", "Volante", "Consola Central", "Forras de Porta", "Outros Interior"]
  },
  {
    "nome": "Suspensão e Travões",
    "subcategorias": ["Amortecedores", "Molas", "Discos de Travão", "Pastilhas", "Pinças", "Braços de Suspensão", "Outros Suspensão"]
  },
  {
    "nome": "Eletrónica e Sensores",
    "subcategorias": ["Centralina/ECU", "Sensores", "Quadrante/Instrumentos", "Rádio/Multimédia", "Cablagens", "Outros Eletrónica"]
  },
  {
    "nome": "Carro Completo p/ Desmonte",
    "subcategorias": []
  },
  {
    "nome": "Outros",
    "subcategorias": ["Pneus e Jantes", "Escape", "Acessórios", "Documentação", "Outros"]
  }
]
```

## Task 2: Compatibility Selector Component

Create src/components/pecas/CompatibilitySelector.tsx:

1. Props: value: CompatibilityEntry[], onChange: (entries: CompatibilityEntry[]) => void, maxEntries?: number (default 5).
2. Use the useMarcasModelos hook (src/hooks/useMarcasModelos.ts) to get the list of makes and models from src/data/marcas-modelos.json.
3. Render a list of compatibility entries. Each entry has:
   - Select for marca (populated from marcas-modelos.json, alphabetical order)
   - Select for modelo (filtered by selected marca, populated from marcas-modelos.json)
   - Two number inputs: anoMin and anoMax (optional, 4-digit years, range 1980-2026)
   - Text input: motor (optional, placeholder "Ex: 1.9 TDI 110cv")
   - Remove button (X) to delete this entry
4. "Adicionar compatibilidade" button to add a new empty entry (up to maxEntries).
5. Styling: compact layout, 1 entry per row on desktop, stacked on mobile.

Create src/components/pecas/CategoryTree.tsx:

1. Props: categoria: string, subcategoria: string, onCategoriaChange: (cat: string) => void, onSubcategoriaChange: (sub: string) => void.
2. Load categories from src/data/categorias-pecas.json.
3. First dropdown: categories (same as CATEGORIAS_PECAS but loaded from JSON).
4. Second dropdown: subcategories filtered by selected category. Hidden if category has no subcategories.
5. Maintain backward compatibility: if user selects a category without a subcategory, that's fine.

## Task 3: Update Part Creation Flow

Modify src/components/pecas/CriarPecaModal.tsx:

1. Replace the free-text "Marca do Carro Compatível" input with CompatibilitySelector component.
2. Replace the single "Categoria" select with CategoryTree component (categoria + subcategoria).
3. Update form state to include: compatibilidade: CompatibilityEntry[] and subcategoria: string.
4. When submitting, include compatibilidade array and subcategoria in the document data.
5. Keep marcaCarro field populated from the first compatibility entry's marca (backward compatibility for existing queries).
6. Keep modeloCarro populated from first entry's modelo.

Modify src/components/admin/EditarPecaModal.tsx:
1. Add CompatibilitySelector to allow admin to edit compatibility on existing parts.
2. Add CategoryTree for subcategory editing.

## Task 4: Cross-Reference — Compatible Parts on Car Details

Create src/components/detalhes/CompatibleParts.tsx:

1. Props: carro: Carro
2. Query parts collection: find parts where any item in compatibilidade[] array has marca matching carro.marca AND (modelo matching carro.modelo OR modelo is empty).
3. Since Firestore doesn't support array-of-objects queries natively, implement a client-side approach:
   - Load all approved parts from the pecas context (useApp().pecas.pecas)
   - Filter client-side: peca.compatibilidade?.some(c => c.marca === carro.marca && (!c.modelo || c.modelo === carro.modelo || carro.modelo.includes(c.modelo)) && (!c.anoMin || carro.anoFabricacao >= c.anoMin) && (!c.anoMax || carro.anoFabricacao <= c.anoMax))
   - Also include legacy matching: peca.marcaCarro === carro.marca (for parts without compatibilidade array)
4. Display up to 6 matching parts in a compact grid using PecasCard from src/components/pecas/PecasCard.tsx.
5. If more than 6 matches, show "Ver todas as N peças compatíveis" link that navigates to /pecas with pre-set filters.
6. If no matches: show "Nenhuma peça compatível encontrada. Crie um pedido de peça." with link to CriarPecaModal.

Create src/lib/compatibility.ts:
1. Function matchPecaToCarro(peca: Peca, carro: Carro): boolean — returns true if any compatibility entry matches the car.
2. Function matchCarroToPeca(carro: Carro, pecas: Peca[]): Peca[] — filters and returns compatible parts.
3. Function findMatchingSearches(novaPeca: Peca, searches: PartSearch[]): PartSearch[] — finds active searches that match a newly approved part.

Modify src/pages/DetalhesCarro.tsx:
1. Import and render CompatibleParts below the description section (before ContactSection).
2. Only show if the car has estadoVeiculo === 'manutencao' (cars that need repair are more likely to need parts) OR always show it with a conditional message.

## Task 5: Cross-Reference — Compatible Vehicles on Part Details

Create src/components/pecas/CompatibleVehicles.tsx:

1. Props: peca: Peca
2. If peca.compatibilidade exists and has entries, list them as formatted text: "Volkswagen Golf IV (2000-2005) — 1.9 TDI 110cv"
3. Also search the cars collection (from context) for matching listed vehicles: useApp().carros.carros.filter(c => matchPecaToCarro(peca, c))
4. Show matched cars as clickable links: "Volkswagen Golf IV 1.9 TDI — 900 € — Ver anúncio"
5. If no compatibilidade array (legacy part), show marcaCarro and modeloCarro as plain text.

Modify src/components/pecas/DetalhesPecaModal.tsx:
1. Add CompatibleVehicles section after the description.
2. Add PriceReference section if applicable.

## Task 6: Bulk Part Upload for Dismantlers

Create src/components/pecas/BulkPartUpload.tsx:

1. Two-step modal:
   Step 1 — "Selecionar Veículo Base":
   - CompatibilitySelector with maxEntries=1 (single vehicle)
   - "Continuar" button

   Step 2 — "Adicionar Peças":
   - Vehicle summary at the top (locked, showing selected make/model/year)
   - Repeatable compact form for each part:
     - Row: titulo (text), categoria (CategoryTree compact), estado (select from ESTADOS_PECA), preco (number), descricao (textarea, 2 rows)
   - "Adicionar outra peça" button adds a new empty row
   - Each row has a remove (X) button
   - All parts inherit the compatibility from Step 1

2. "Publicar N peças" button at the bottom:
   - Validates all parts (titulo required)
   - Calls addPeca() for each part with:
     - compatibilidade: [vehicle from step 1]
     - marcaCarro: vehicle.marca (backward compatibility)
     - modeloCarro: vehicle.modelo
     - tipo: 'desmonte'
     - status: 'pendente'
     - criador: user.email
     - vendedorNome, vendedorTelefone, vendedorWhatsApp, vendedorEmail from user profile
   - Shows progress (X of Y created)
   - On completion: success message with count

3. Access: button "Desmanchar Carro" on the Pecas page (src/pages/Pecas.tsx), visible only to logged-in users.

## Task 7: Automatic Search Matching

Modify src/lib/db.ts:

1. Add function createPartSearch(pecaId: string, criadorUid: string, categoria: string, subcategoria: string | undefined, marcaCarro: string, modeloCarro?: string): Promise<void> — creates a document in 'part_searches' collection.
2. Add function getActiveSearches(): Promise<PartSearch[]> — fetches all documents from 'part_searches' where ativo === true.
3. Add function matchAndNotify(novaPeca: Peca): Promise<number> — called after admin approves a 'venda' or 'desmonte' part:
   - Fetch active searches from part_searches
   - For each search, check if novaPeca matches: same categoria (or subcategoria) AND compatible marca (marcaCarro contains or equals search.marcaCarro)
   - For each match, call criarNotificacao(search.criadorUid, 'info', 'Peça compatível encontrada!', 'A peça "[titulo]" pode ser compatível com o seu pedido.', '/pecas')
   - Return count of matches found

Modify the admin approval flow:
1. In the admin panel, when updatePecaStatus(id, 'aprovado') is called for a part, also call matchAndNotify() with the approved part data.
2. This requires fetching the part data after approval. Modify the call site (likely in src/components/admin/ListingsTable.tsx or similar admin component).

When a user creates a 'procura' type part via CriarPecaModal:
1. After successful creation, also call createPartSearch() with the relevant criteria.

## Task 8: Price Reference

Create src/data/precos-referencia.json with sample data:
```json
[
  { "categoria": "Motor e Transmissão", "subcategoria": "Turbo", "precoNovoMin": 300, "precoNovoMax": 1500 },
  { "categoria": "Motor e Transmissão", "subcategoria": "Motor Completo", "precoNovoMin": 2000, "precoNovoMax": 8000 },
  { "categoria": "Iluminação e Óticas", "subcategoria": "Faróis Frontais", "precoNovoMin": 80, "precoNovoMax": 500 },
  { "categoria": "Suspensão e Travões", "subcategoria": "Amortecedores", "precoNovoMin": 40, "precoNovoMax": 200 },
  { "categoria": "Suspensão e Travões", "subcategoria": "Discos de Travão", "precoNovoMin": 30, "precoNovoMax": 150 }
]
```

Create src/components/pecas/PriceReference.tsx:
1. Props: peca: Peca (needs categoria, subcategoria, preco)
2. Load price references from src/data/precos-referencia.json.
3. Find matching reference by categoria + subcategoria.
4. If found and peca.preco exists: show "Peça nova: X € — Y € | Esta peça: Z € (desconto de W%)"
5. Calculate discount: ((precoNovoMedio - peca.preco) / precoNovoMedio * 100).toFixed(0)
6. If no matching reference: show nothing (don't show component).
7. Style: small informative badge, green if discount > 40%, yellow if 20-40%, gray if < 20%.

## Important Implementation Notes

- All compatibility matching is CLIENT-SIDE using data already in context (useApp().pecas.pecas and useApp().carros.carros). Do NOT create complex Firestore queries for array-of-objects fields — Firestore doesn't support this well.
- Backward compatibility is critical: existing parts have marcaCarro as free text and foto as a single string. New code must handle both old (no compatibilidade array) and new (with compatibilidade array) documents.
- The marcaCarro field should STILL be populated (from the first compatibility entry) so that existing filters and admin views continue to work.
- When expanding from foto?: string to fotos?: string[], handle the transition: if peca.fotos exists use it, else if peca.foto exists use [peca.foto], else use [].
- The BulkPartUpload should prefill vendor contact info from the logged-in user's profile (user.telefone, user.email, etc.) — same pattern as CriarPecaModal.
- Part search matching should use case-insensitive comparison (lowercase both sides).
- The part_searches collection is a denormalized index for matching — it duplicates data from the 'procura' type parts for efficient querying.
- Do NOT add external API dependencies (TecDoc, etc.). All data is internal for this phase.
- Reuse existing components wherever possible: Modal (src/components/ui/Modal.tsx), Badge (src/components/ui/Badge.tsx), PecasCard (src/components/pecas/PecasCard.tsx).
- The categorias-pecas.json file provides the hierarchy. The flat CATEGORIAS_PECAS array in constants.ts should be kept and auto-generated from the JSON for backward compatibility.
```
