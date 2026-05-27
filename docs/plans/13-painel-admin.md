# 13 — Evolucao do Painel de Administracao

**Prioridade:** ALTA | **Estimativa Total:** ~22-30 dias de desenvolvimento

---

## 1. Visao Geral

### O Que Resolve

O painel de administracao do ReparAuto ja oferece funcionalidades solidas para gestao basica: estatisticas, gestao de utilizadores com alteracao de roles, gestao de anuncios (carros e pecas) com fluxo de aprovacao/rejeicao, edicao completa de listings, eliminacao, notificacoes automaticas ao utilizador, e ordenacao inteligente (pendentes primeiro). No entanto, a medida que a plataforma cresce, o admin enfrenta lacunas criticas: nao ha registo de quem fez o que e quando (auditoria), todos os dados sao carregados de uma vez (sem paginacao), nao existe fila de denuncias nem verificacoes de vendedores, nao ha busca na tabela de utilizadores, e acoes em lote para aprovar/rejeitar multiplos anuncios nao estao disponiveis. Este plano implementa a evolucao do painel existente para suportar operacoes em escala.

### Benchmark Competitivo

| Plataforma | Logs Auditoria | Paginacao | Fila Denuncias | Acoes em Lote | Analytics Admin | Export Dados |
|---|---|---|---|---|---|---|
| **Standvirtual** | Sim (interno) | Sim | Sim | Sim | Sim (dashboard) | Sim (CSV) |
| **OLX Portugal** | Sim | Sim | Sim | Sim | Basico | Nao |
| **AutoScout24** | Sim (completo) | Sim | Sim | Sim | Sim (avancado) | Sim (CSV/Excel) |
| **Facebook Marketplace** | Parcial | Sim | Sim | Nao | Basico | Nao |
| **ReparAuto (atual)** | Nao | Nao | Nao | Nao | Nao | Nao |
| **ReparAuto (proposto)** | Sim | Sim | Sim | Sim | Sim | Sim (CSV) |

### Historias de Usuario

1. **Como admin**, quero ver um historico de todas as acoes realizadas (aprovacoes, rejeicoes, edicoes, eliminacoes) com data, autor e detalhes, para que exista rastreabilidade e responsabilidade sobre cada decisao.
2. **Como admin**, quero que as tabelas de utilizadores e anuncios carreguem dados paginados, para que o painel continue rapido mesmo com milhares de registos.
3. **Como admin**, quero pesquisar utilizadores por nome ou email, para encontrar rapidamente uma conta especifica sem percorrer toda a lista.
4. **Como admin**, quero selecionar multiplos anuncios pendentes e aprova-los ou rejeita-los de uma vez, para processar filas grandes de moderacao em minutos em vez de horas.
5. **Como admin**, quero ver uma fila de denuncias reportadas por utilizadores, com detalhes do motivo e atalho para o conteudo reportado, para moderar a plataforma de forma eficiente.
6. **Como admin**, quero ver uma fila de pedidos de verificacao de vendedores, com documentos anexados, para aprovar ou rejeitar cada pedido.
7. **Como admin**, quero exportar a lista de utilizadores ou anuncios em formato CSV, para analise externa em Excel ou Google Sheets.
8. **Como admin**, quero ver metricas agregadas (visualizacoes totais, anuncios por dia, taxa de aprovacao) num dashboard de analytics, para entender a saude da plataforma.

### Estado Atual

O painel admin (Fase 1) esta completo e funcional em `src/pages/Admin.tsx` (287 linhas) com 3 abas: Visao Geral (AdminStats com 5 cards clicaveis), Utilizadores (UserTable com alteracao de role via modal), e Anuncios (ListingsTable com sub-tabs carros/pecas, filtro por status, botoes aprovar/rejeitar/editar/eliminar, modais de edicao completos). Funcoes de backend em `src/lib/db.ts` incluem: `getAllUsers`, `setUserRole`, `getAllCarrosAdmin`, `getAllPecasAdmin`, `updateCarro`, `updatePeca`, `updateCarroStatus`, `updatePecaStatus`, `deleteCarro`, `deletePeca`, `criarNotificacao`. Regras Firestore com helper `isAdmin()` ja estao configuradas.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

| # | Funcionalidade | Descricao | Prioridade |
|---|---------------|-----------|------------|
| F1 | Logs de auditoria | Registar todas as acoes admin com autor, tipo, alvo e timestamp | Alta |
| F2 | Paginacao | Carregar dados em paginas de 20-50 itens com cursores Firestore | Alta |
| F3 | Busca de utilizadores | Campo de pesquisa por nome/email na tabela de utilizadores | Alta |
| F4 | Acoes em lote | Selecao multipla + aprovacao/rejeicao em batch | Alta |
| F5 | Fila de denuncias | Listagem de reports pendentes com acoes de resolucao | Media |
| F6 | Fila de verificacoes | Listagem de pedidos de verificacao de vendedores | Media |
| F7 | Dashboard de analytics | Metricas agregadas: views totais, anuncios/dia, taxa aprovacao | Media |
| F8 | Export de dados | Exportar utilizadores e anuncios para CSV | Media |
| F9 | Gestao de destaques premium | Visualizar e gerir anuncios com destaque pago | Baixa |
| F10 | Painel de moderacao de conteudo | Moderar posts/comentarios do forum (depende do Plano 10) | Baixa |
| F11 | Gestao da base de compatibilidade | CRUD da tabela de compatibilidade de pecas (depende do Plano 08) | Baixa |
| F12 | Configuracoes da plataforma | Painel de settings globais (max fotos, limites, textos) | Baixa |

### Fluxos de Usuario

**F1 — Logs de Auditoria:**
1. Admin realiza qualquer acao (aprovar, rejeitar, editar, eliminar, alterar role)
2. Sistema cria automaticamente um documento na colecao `audit_logs` com: tipo da acao, UID do admin, ID do alvo, dados anteriores/posteriores, timestamp
3. Admin acede a nova aba "Logs" no painel
4. Visualiza lista cronologica de acoes com filtros por tipo e por admin
5. Cada entrada mostra: icone da acao, descricao legivel, autor, data/hora, link para o item afetado

**F2 — Paginacao:**
1. Ao abrir a aba de Utilizadores ou Anuncios, sistema carrega apenas os primeiros 25 itens
2. Botoes "Anterior" e "Proximo" no rodape da tabela permitem navegar entre paginas
3. Indicador mostra "Pagina X" e total de itens (via contagem separada)
4. Filtros de status e busca reiniciam para a primeira pagina

**F4 — Acoes em Lote:**
1. Admin ativa modo de selecao na tabela de anuncios (checkbox visivel)
2. Seleciona multiplos itens via checkbox individual ou "Selecionar todos pendentes"
3. Barra flutuante aparece no topo com: "X selecionados" + botoes "Aprovar Selecionados" e "Rejeitar Selecionados"
4. Modal de confirmacao lista os itens selecionados
5. Sistema processa em paralelo (Promise.all) e mostra resultado: "X aprovados, Y falharam"
6. Log de auditoria regista cada acao individual do lote

**F5 — Fila de Denuncias:**
1. Admin acede a nova aba "Denuncias" no painel
2. Tabela mostra: tipo do alvo (carro/peca/utilizador), motivo, descricao, data, status
3. Clicar numa denuncia mostra detalhes completos + link direto para o conteudo reportado
4. Admin pode: marcar como resolvido (com nota), ignorar, ou eliminar o conteudo reportado
5. Resolucao cria log de auditoria e, opcionalmente, notifica o autor da denuncia

**F8 — Export de Dados:**
1. Botao "Exportar CSV" disponivel nas abas de Utilizadores e Anuncios
2. Gera ficheiro CSV no browser (sem backend) com todos os dados visiveis na tabela
3. Download automatico com nome "utilizadores_YYYY-MM-DD.csv" ou "anuncios_YYYY-MM-DD.csv"

### Requisitos de UI/UX

- Nova aba "Logs" com icone de relogio no painel admin (junto as existentes)
- Nova aba "Denuncias" com icone de bandeira e badge numerico com pendentes
- Nova aba "Verificacoes" com icone de escudo e badge numerico com pendentes
- Checkboxes de selecao lote devem ser discretos ate activados
- Barra de acoes em lote fixa no topo da tabela (sticky) com animacao de entrada
- Paginacao com estilo consistente com o resto do painel (botoes arredondados, cores do tema)
- Campo de busca com icone de lupa, debounce de 300ms para evitar queries excessivas
- Logs devem usar iconografia e cores por tipo de acao (verde=aprovar, vermelho=rejeitar, azul=editar, cinza=eliminar)
- Botao de export discreto (icone + texto, alinhado a direita do cabecalho da tabela)

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Caminho | Finalidade |
|---|---|
| `src/types/audit.ts` | Interface `AuditLog`, tipos `AuditAction`, `AuditTargetType` |
| `src/types/report.ts` | Interface `Report`, tipo `MotivoReport` (se nao criado pelo Plano 01) |
| `src/types/verification.ts` | Interface `VerificationRequest` (se nao criado pelo Plano 01) |
| `src/types/platform-config.ts` | Interface `PlatformConfig` para settings globais |
| `src/hooks/useAuditLogs.ts` | Hook com paginacao, filtros e onSnapshot para logs de auditoria |
| `src/hooks/usePaginatedQuery.ts` | Hook generico de paginacao Firestore com cursores |
| `src/hooks/useReports.ts` | Hook para fila de denuncias (admin) com acoes de resolucao |
| `src/hooks/useVerifications.ts` | Hook para fila de verificacoes (admin) |
| `src/components/admin/AuditLogTable.tsx` | Tabela de logs com filtros e paginacao |
| `src/components/admin/ReportsQueue.tsx` | Fila de denuncias com acoes resolve/ignore/remove |
| `src/components/admin/VerificationsQueue.tsx` | Fila de verificacoes com acoes approve/reject |
| `src/components/admin/BatchActionBar.tsx` | Barra flutuante de acoes em lote |
| `src/components/admin/UserSearchBar.tsx` | Campo de busca para tabela de utilizadores |
| `src/components/admin/AdminAnalytics.tsx` | Dashboard de metricas agregadas |
| `src/components/admin/PaginationControls.tsx` | Componente reutilizavel de navegacao entre paginas |
| `src/components/admin/ExportButton.tsx` | Botao de export CSV generico |
| `src/components/admin/PlatformSettings.tsx` | Painel de configuracoes da plataforma |
| `src/lib/audit.ts` | Funcoes para criar e consultar logs de auditoria |
| `src/lib/csv-export.ts` | Funcoes para gerar CSV a partir de arrays de dados |

### Modificacoes em Arquivos Existentes

| Caminho | Alteracoes |
|---|---|
| `src/pages/Admin.tsx` | Adicionar abas "Logs", "Denuncias", "Verificacoes", "Analytics", "Configuracoes". Integrar paginacao. Refatorar `carregarDados` para usar queries paginadas. Chamar `criarAuditLog` em todas as acoes existentes |
| `src/components/admin/AdminStats.tsx` | Adicionar cards para denuncias pendentes e verificacoes pendentes |
| `src/components/admin/UserTable.tsx` | Integrar `UserSearchBar`, adicionar checkbox de selecao, aceitar prop `paginacao` |
| `src/components/admin/ListingsTable.tsx` | Adicionar checkboxes de selecao em lote, integrar `BatchActionBar` e `PaginationControls`. Aceitar callbacks de batch |
| `src/lib/db.ts` | Adicionar funcoes: `getCarrosAdminPaginated`, `getPecasAdminPaginated`, `getUsersPaginated`, `getReportsPendentes`, `updateReportStatus`, `getVerificationRequests`, `updateVerificationStatus`, `batchUpdateCarroStatus`, `batchUpdatePecaStatus`, `getCollectionCount` |
| `src/types/usuario.ts` | Adicionar campo `verified?: boolean` (se nao adicionado pelo Plano 01) |
| `firestore.rules` | Adicionar regras para `audit_logs`, `reports`, `verifications`, `platform_config` |
| `src/lib/constants.ts` | Adicionar `MOTIVOS_DENUNCIA`, `ACOES_AUDITORIA`, `ADMIN_PAGE_SIZE`, `CSV_EXPORT_HEADERS` |

### Colecoes Firestore

#### Colecao `audit_logs`
```typescript
interface AuditLog {
  id: string;
  action: AuditAction;          // 'approve_car' | 'reject_car' | 'approve_part' | 'reject_part'
                                 // | 'edit_car' | 'edit_part' | 'delete_car' | 'delete_part'
                                 // | 'change_role' | 'resolve_report' | 'approve_verification'
                                 // | 'reject_verification' | 'batch_approve' | 'batch_reject'
  adminUid: string;              // UID do admin que executou a acao
  adminEmail: string;            // Email do admin (denormalizado para exibicao)
  targetType: 'car' | 'part' | 'user' | 'report' | 'verification';
  targetId: string;              // ID do documento afetado
  targetLabel: string;           // Descricao legivel ("BMW 320d", "Joao Silva", etc.)
  details?: Record<string, unknown>; // Dados adicionais (valores antes/depois, motivo rejeicao)
  dataCriacao: Timestamp;
}

type AuditAction =
  | 'approve_car' | 'reject_car' | 'edit_car' | 'delete_car'
  | 'approve_part' | 'reject_part' | 'edit_part' | 'delete_part'
  | 'change_role' | 'resolve_report' | 'ignore_report'
  | 'approve_verification' | 'reject_verification'
  | 'batch_approve' | 'batch_reject';
```

#### Colecao `reports` (se nao existir do Plano 01)
```typescript
interface Report {
  id: string;
  reporterUid: string;
  reporterEmail: string;
  targetType: 'car' | 'part' | 'user' | 'review';
  targetId: string;
  targetLabel: string;           // Descricao legivel do conteudo reportado
  motivo: MotivoReport;          // 'fraude' | 'info_falsa' | 'fotos_roubadas' | 'conteudo_inapropriado' | 'outro'
  descricao: string;
  status: 'pendente' | 'resolvido' | 'ignorado';
  resolvidoPor?: string;
  resolucao?: string;
  dataCriacao: Timestamp;
  dataResolucao?: Timestamp;
}
```

#### Colecao `verifications` (se nao existir do Plano 01)
```typescript
interface VerificationRequest {
  id: string;
  uid: string;
  email: string;
  nomeEmpresa: string;
  nif: string;
  documentos: string[];          // URLs no Firebase Storage
  status: 'pendente' | 'aprovado' | 'rejeitado';
  motivoRejeicao?: string;
  analisadoPor?: string;
  dataCriacao: Timestamp;
  dataAnalise?: Timestamp;
}
```

#### Colecao `platform_config` (documento unico)
```typescript
interface PlatformConfig {
  maxFotosCarro: number;         // default 7
  maxFotosPeca: number;          // default 3
  maxFotosServico: number;       // default 7
  maxAnunciosPorUtilizador: number; // default 20
  moderacaoAutomatica: boolean;  // default false (se true, aprova automaticamente)
  textoTermos: string;           // Texto dos termos de uso
  textoPolitica: string;         // Texto da politica de privacidade
}
```

### Regras de Seguranca Firestore

```
match /audit_logs/{logId} {
  // Apenas admins podem ler logs de auditoria
  allow read: if isAdmin();
  // Apenas admins podem criar logs (criados automaticamente nas acoes)
  allow create: if isAdmin();
  // Logs sao imutaveis — nunca podem ser editados ou eliminados
  allow update, delete: if false;
}

match /reports/{reportId} {
  // Admins podem ler todas as denuncias
  allow read: if isAdmin();
  // Qualquer utilizador autenticado pode criar uma denuncia
  allow create: if isAuthenticated()
    && request.resource.data.reporterUid == request.auth.uid;
  // Apenas admins podem atualizar status (resolver/ignorar)
  allow update: if isAdmin();
  // Apenas admins podem eliminar
  allow delete: if isAdmin();
}

match /verifications/{verificationId} {
  // O proprio utilizador pode ler o seu pedido; admins podem ler todos
  allow read: if isAuthenticated()
    && (resource.data.uid == request.auth.uid || isAdmin());
  // Utilizador autenticado pode criar o seu proprio pedido
  allow create: if isAuthenticated()
    && request.resource.data.uid == request.auth.uid;
  // Apenas admins podem aprovar/rejeitar
  allow update: if isAdmin();
  allow delete: if isAdmin();
}

match /platform_config/{configId} {
  // Leitura publica (para aplicar limites no cliente)
  allow read: if true;
  // Apenas admins podem alterar configuracoes
  allow write: if isAdmin();
}
```

### Componentes React Principais

```typescript
// src/hooks/usePaginatedQuery.ts
// Hook generico reutilizavel para paginacao Firestore
interface UsePaginatedQueryOptions<T> {
  collectionName: string;
  pageSize: number;
  orderByField: string;
  orderDirection: 'asc' | 'desc';
  whereConstraints?: QueryConstraint[];
}
interface UsePaginatedQueryReturn<T> {
  data: T[];
  loading: boolean;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goNextPage: () => void;
  goPrevPage: () => void;
  currentPage: number;
  totalEstimate: number;          // Estimativa via getCountFromServer
  refresh: () => void;
}

// src/components/admin/AuditLogTable.tsx
interface AuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
  filterAction?: AuditAction | null;
  onFilterChange: (action: AuditAction | null) => void;
}

// src/components/admin/BatchActionBar.tsx
interface BatchActionBarProps {
  selectedCount: number;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onClearSelection: () => void;
  loading: boolean;
}

// src/components/admin/UserSearchBar.tsx
interface UserSearchBarProps {
  value: string;
  onChange: (query: string) => void;
  resultCount: number;
}

// src/components/admin/ReportsQueue.tsx
interface ReportsQueueProps {
  reports: Report[];
  loading: boolean;
  onResolve: (id: string, resolucao: string) => Promise<void>;
  onIgnore: (id: string) => Promise<void>;
  onRemoveTarget: (report: Report) => Promise<void>;
}

// src/components/admin/VerificationsQueue.tsx
interface VerificationsQueueProps {
  requests: VerificationRequest[];
  loading: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, motivo: string) => Promise<void>;
}

// src/components/admin/ExportButton.tsx
interface ExportButtonProps {
  data: Record<string, unknown>[];
  headers: { key: string; label: string }[];
  filename: string;
}

// src/components/admin/PaginationControls.tsx
interface PaginationControlsProps {
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  totalEstimate?: number;
}

// src/components/admin/AdminAnalytics.tsx
interface AdminAnalyticsProps {
  totalUsers: number;
  totalCarros: number;
  totalPecas: number;
  carrosPorStatus: Record<StatusAnuncio, number>;
  pecasPorStatus: Record<StatusAnuncio, number>;
  recentLogs: AuditLog[];       // Ultimos 10 logs para "Atividade Recente"
}
```

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Funcionalidade | Frontend | Backend/Config | Total |
|---|---|---|---|
| F1: Logs de auditoria | 2 dias | 1.5 dias (colecao + regras + funcoes) | 3.5 dias |
| F2: Paginacao | 2.5 dias | 1 dia (queries paginadas) | 3.5 dias |
| F3: Busca de utilizadores | 1 dia | 0.5 dia (query composta) | 1.5 dias |
| F4: Acoes em lote | 2 dias | 1 dia (batch writes + logs) | 3 dias |
| F5: Fila de denuncias | 2 dias | 1 dia (colecao + regras + queries) | 3 dias |
| F6: Fila de verificacoes | 2 dias | 1 dia (colecao + regras + queries) | 3 dias |
| F7: Dashboard analytics | 2 dias | 0.5 dia (queries agregadas) | 2.5 dias |
| F8: Export CSV | 1 dia | 0 (client-side apenas) | 1 dia |
| F9: Gestao destaques | 1.5 dias | 0.5 dia (queries) | 2 dias |
| F10: Moderacao conteudo | 2 dias | 1 dia | 3 dias (depende Plano 10) |
| F11: Base compatibilidade | 2 dias | 1 dia | 3 dias (depende Plano 08) |
| F12: Configuracoes plataforma | 1.5 dias | 0.5 dia (colecao + regras) | 2 dias |
| **Total** | **22 dias** | **9.5 dias** | **~31 dias** |

**Nota:** F10 e F11 dependem de planos anteriores e podem ser removidos da estimativa principal, reduzindo para ~25 dias.

### Avaliacao de Valor

| Dimensao | Impacto | Justificacao |
|---|---|---|
| **Operacoes** | Muito Alto | Logs de auditoria, acoes em lote e paginacao sao essenciais para escalar a moderacao |
| **Seguranca** | Alto | Rastreabilidade de acoes admin e fundamental para compliance e prevencao de abuso |
| **Eficiencia** | Muito Alto | Acoes em lote podem reduzir tempo de moderacao em 80% para filas grandes |
| **Escalabilidade** | Alto | Paginacao evita problemas de performance com crescimento da base de dados |
| **Retencao** | Medio | Fila de denuncias e verificacoes melhoram confianca (complementa Plano 01) |

### Posicao na Matriz

**ESTRATEGICO** — Esforco medio-alto (~25 dias sem dependencias), valor muito alto. Ferramentas de administracao robustas sao pre-requisito para escalar a plataforma. Sem logs de auditoria, nao ha rastreabilidade. Sem paginacao, o painel trava com milhares de registos. Sem acoes em lote, moderar 50 anuncios pendentes por dia e insustentavel. A implementacao faseada permite entregar valor incremental: F1+F2+F3+F4 na primeira sprint (essenciais), F5+F6+F7+F8 na segunda (moderacao), F9+F12 na terceira (otimizacao).

---

## 5. Decisoes de Arquitetura

### Decisao 1: Armazenamento de Logs de Auditoria

**Contexto:** Precisamos registar todas as acoes admin para rastreabilidade. Tres abordagens foram avaliadas.

| Opcao | Pros | Contras |
|---|---|---|
| **Colecao dedicada `audit_logs`** | Queries independentes e flexiveis; nao afeta performance das colecoes principais; facil de paginar e filtrar; imutavel por design | Custo adicional de writes (1 write extra por acao); precisa manter referencia ao documento original |
| **Subcollections nos documentos** (ex: `cars/{id}/audit`) | Dados proximos do documento afetado; facil ver historico de um item | Queries cross-document impossiveis (nao da para listar "todos os logs"); fragmentacao; dificil paginar globalmente |
| **Cloud Functions log** (Firebase/GCP logging) | Zero custo Firestore; escalavel nativamente | Requer Cloud Functions (custo e complexidade); dados fora do Firestore (nao consultaveis pelo app); latencia |

**Recomendacao:** **Colecao dedicada `audit_logs`**. E a abordagem mais flexivel e alinhada com a arquitetura existente (100% Firestore, sem Cloud Functions). Cada acao admin gera 1 documento adicional — com a escala atual (<100 acoes/dia), o custo e desprezivel. Os logs sao imutaveis (regras Firestore proibem update/delete), garantindo integridade. A funcao `criarAuditLog()` e chamada dentro das handlers existentes em `Admin.tsx`, adicionando no maximo 3-5 linhas de codigo por acao.

### Decisao 2: Abordagem de Paginacao

**Contexto:** Atualmente `getAllUsers()`, `getAllCarrosAdmin()` e `getAllPecasAdmin()` carregam TODOS os documentos. Com crescimento, isso causa lentidao e consumo excessivo de leituras Firestore.

| Opcao | Pros | Contras |
|---|---|---|
| **Cursores Firestore (`startAfter`/`limit`)** | Paginacao server-side real; carrega apenas N documentos por pagina; eficiente em reads; suporta milhoes de registos | Nao suporta "ir para pagina X" diretamente (apenas proximo/anterior); requer manter cursor state; incompativel com filtros complexos client-side |
| **Virtual scroll client-side** (carregar tudo, renderizar parte) | Implementacao simples; filtros e busca instantaneos; sem latencia entre paginas | Carrega todos os dados na memoria (nao resolve custo de reads); trava com >5000 itens; nao reduz uso de bandwidth |
| **Hibrido** (carregar blocos de 100-200, paginar visualmente de 25 em 25) | Menos round-trips que cursores puros; filtros client-side dentro do bloco; boa UX | Complexidade de implementacao; ainda carrega mais dados que necessario; edge cases em fronteiras de blocos |

**Recomendacao:** **Cursores Firestore (`startAfter`/`limit`)**. E a unica abordagem que escala verdadeiramente. O hook generico `usePaginatedQuery` encapsula a logica de cursores e e reutilizavel em todas as tabelas do admin. A limitacao de nao saltar para paginas arbitrarias e aceitavel para um painel admin (o fluxo tipico e percorrer sequencialmente ou usar filtros/busca para encontrar itens especificos). Para a busca de utilizadores (F3), usamos query Firestore com `where` + `orderBy` em vez de filtrar client-side, garantindo que apenas resultados relevantes sao carregados.

---

## 6. Prompt de Implementacao

```
You are evolving the existing Admin Panel for ReparAuto, a Portuguese used-car and parts marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase. The admin panel already works — you are ADDING features to it, not rebuilding it.

IMPORTANT CONTEXT:
- All UI text must be in Portuguese (PT-PT). Code, comments, variable names, and commit messages in English.
- Import alias: @/ maps to src/. NEVER use relative imports.
- Styling: Tailwind utility classes only. Theme is in src/index.css.
- State: Context API + custom hooks. No Redux/Zustand.
- Firestore real-time: use onSnapshot() for live data where appropriate. Clean up subscriptions on unmount.
- Auth: Firebase Auth (email/password + Google). Roles: 'user' | 'admin'.
- TypeScript strict mode enabled. Types live in src/types/.

EXISTING ADMIN FILES (do NOT recreate — extend them):
- src/pages/Admin.tsx (287 lines) — Main admin page with 3 tabs: visao-geral, utilizadores, anuncios. Uses useState for tab, users[], carros[], pecas[]. Loads all data via carregarDados(). Has handlers: handleRoleChange, handleDeleteCarro, handleDeletePeca, handleUpdateCarro, handleUpdatePeca, handleApproveCarro, handleRejectCarro, handleApprovePeca, handleRejectPeca, notificarUtilizador.
- src/components/admin/AdminStats.tsx (39 lines) — 5 stat cards: Users, Carros, Pecas, Total, Pendentes. Props: totalUsers, totalCarros, totalPecas, carrosPendentes, pecasPendentes, onNavigate.
- src/components/admin/UserTable.tsx (111 lines) — User table with role dropdown + confirmation modal. Props: users, onRoleChange.
- src/components/admin/ListingsTable.tsx (290 lines) — Carros/Pecas sub-tabs, status filter, action buttons (edit, approve, reject, delete), edit modals, delete confirmation. Props: carros, pecas, defaultTab, statusFilter, on[Action] callbacks.
- src/components/admin/EditarCarroModal.tsx — Full car edit modal.
- src/components/admin/EditarPecaModal.tsx — Full part edit modal.
- src/lib/db.ts — Functions: getAllUsers, setUserRole, getAllCarrosAdmin, getAllPecasAdmin, updateCarro, updatePeca, updateCarroStatus, updatePecaStatus, deleteCarro, deletePeca, criarNotificacao.
- src/types/usuario.ts — Usuario interface (uid, nome, email, telefone, localidade, tipoConta, role, bio, foto, profileCompleted, dataCriacao).
- src/types/carro.ts — Carro with StatusAnuncio type ('pendente' | 'aprovado' | 'rejeitado').
- src/types/peca.ts — Peca with status field.
- firestore.rules — Has isAuthenticated(), isOwner(), isAdmin(), isCreatorByEmail(), isOwnerByEmail() helpers. Collections: users, cars, parts, services, notifications, messages.

TASKS — Implement in this order:

1. TYPE DEFINITIONS AND CONSTANTS
   Create src/types/audit.ts:
   - Export type AuditAction = 'approve_car' | 'reject_car' | 'edit_car' | 'delete_car' | 'approve_part' | 'reject_part' | 'edit_part' | 'delete_part' | 'change_role' | 'resolve_report' | 'ignore_report' | 'approve_verification' | 'reject_verification' | 'batch_approve' | 'batch_reject'
   - Export type AuditTargetType = 'car' | 'part' | 'user' | 'report' | 'verification'
   - Export interface AuditLog { id: string; action: AuditAction; adminUid: string; adminEmail: string; targetType: AuditTargetType; targetId: string; targetLabel: string; details?: Record<string, unknown>; dataCriacao: Timestamp; }
   
   Create src/types/report.ts (if not already created by Plan 01):
   - Export type MotivoReport = 'fraude' | 'info_falsa' | 'fotos_roubadas' | 'conteudo_inapropriado' | 'outro'
   - Export type ReportStatus = 'pendente' | 'resolvido' | 'ignorado'
   - Export interface Report { id: string; reporterUid: string; reporterEmail: string; targetType: 'car' | 'part' | 'user' | 'review'; targetId: string; targetLabel: string; motivo: MotivoReport; descricao: string; status: ReportStatus; resolvidoPor?: string; resolucao?: string; dataCriacao: Timestamp; dataResolucao?: Timestamp; }

   Create src/types/verification.ts (if not already created by Plan 01):
   - Export interface VerificationRequest { id: string; uid: string; email: string; nomeEmpresa: string; nif: string; documentos: string[]; status: 'pendente' | 'aprovado' | 'rejeitado'; motivoRejeicao?: string; analisadoPor?: string; dataCriacao: Timestamp; dataAnalise?: Timestamp; }

   In src/lib/constants.ts, add:
   - ADMIN_PAGE_SIZE = 25
   - MOTIVOS_DENUNCIA: Array<{ value: MotivoReport; label: string }> with Portuguese labels
   - ACOES_AUDITORIA: Record<AuditAction, { label: string; icon: string; cor: string }> mapping each action to a display label, FontAwesome icon class, and Tailwind color class
   - CSV_EXPORT_HEADERS_USERS and CSV_EXPORT_HEADERS_CARROS arrays with { key, label } pairs

2. AUDIT LOG SYSTEM
   Create src/lib/audit.ts:
   - Function criarAuditLog(log: Omit<AuditLog, 'id' | 'dataCriacao'>): Promise<void> — adds doc to 'audit_logs' collection with Timestamp.now()
   - Function getAuditLogs(pageSize: number, lastDoc?: QueryDocumentSnapshot, filterAction?: AuditAction): returns { logs: AuditLog[], lastDoc, hasMore }
   - Function getAuditLogsByTarget(targetType: AuditTargetType, targetId: string): returns AuditLog[]
   
   Create src/hooks/useAuditLogs.ts:
   - Hook that calls getAuditLogs with pagination support
   - Returns { logs, loading, hasNextPage, hasPrevPage, goNext, goPrev, currentPage, filterByAction, setFilterByAction, refresh }

   Modify src/pages/Admin.tsx:
   - Import criarAuditLog from @/lib/audit
   - In EVERY existing handler (handleApproveCarro, handleRejectCarro, handleApprovePeca, handleRejectPeca, handleUpdateCarro, handleUpdatePeca, handleDeleteCarro, handleDeletePeca, handleRoleChange), add a call to criarAuditLog() AFTER the successful operation. Use auth.user.uid and auth.user.email for the admin fields.
   - Example for handleApproveCarro: after updateCarroStatus succeeds, call criarAuditLog({ action: 'approve_car', adminUid: auth.user!.uid, adminEmail: auth.user!.email, targetType: 'car', targetId: id, targetLabel: `${c.marca} ${c.modelo}` })

   Create src/components/admin/AuditLogTable.tsx:
   - Render a table with columns: Acao (icon + label from ACOES_AUDITORIA), Alvo, Admin, Data/Hora
   - Filter dropdown at top to filter by action type
   - Use PaginationControls at the bottom
   - Each row uses color-coded icon matching the action type

3. PAGINATED QUERIES
   Create src/hooks/usePaginatedQuery.ts:
   - Generic hook accepting collection name, page size, orderBy field/direction, and optional where constraints
   - Uses Firestore query().orderBy().limit() with startAfter() for cursor-based pagination
   - Maintains a stack of cursor documents for backward navigation (push on goNext, pop on goPrev)
   - Calls getCountFromServer() once on mount for total estimate
   - Returns { data, loading, hasNextPage, hasPrevPage, goNextPage, goPrevPage, currentPage, totalEstimate, refresh }

   Add to src/lib/db.ts:
   - Function getCarrosAdminPaginated(pageSize: number, lastDoc?: QueryDocumentSnapshot, statusFilter?: StatusAnuncio): returns { carros: Carro[], lastDoc, hasMore }
   - Function getPecasAdminPaginated(pageSize: number, lastDoc?: QueryDocumentSnapshot, statusFilter?: StatusAnuncio): returns { pecas: Peca[], lastDoc, hasMore }
   - Function getUsersPaginated(pageSize: number, lastDoc?: QueryDocumentSnapshot, searchQuery?: string): returns { users: Usuario[], lastDoc, hasMore }
   
   Create src/components/admin/PaginationControls.tsx:
   - Previous/Next buttons, current page number, total estimate display
   - Props: currentPage, hasNext, hasPrev, onNext, onPrev, totalEstimate?

   Modify src/pages/Admin.tsx:
   - Replace carregarDados() bulk loading with paginated queries for each tab
   - Keep the existing sorting logic (sortPendentesTop) but apply it within the paginated result set

4. USER SEARCH
   Create src/components/admin/UserSearchBar.tsx:
   - Input field with magnifying glass icon, placeholder "Pesquisar por nome ou email..."
   - Debounced onChange (300ms) calling the parent callback
   - Shows result count badge: "X resultados"

   Modify src/components/admin/UserTable.tsx:
   - Add UserSearchBar above the table
   - Accept new prop: onSearch: (query: string) => void
   - When search is active, parent (Admin.tsx) filters users client-side by nome or email (case-insensitive includes)
   - For paginated mode: the search triggers a new Firestore query with where('email', '>=', query) for prefix matching

5. BATCH ACTIONS
   Create src/components/admin/BatchActionBar.tsx:
   - Sticky bar that appears when selectedCount > 0
   - Shows: "X anúncio(s) selecionado(s)" + "Aprovar Selecionados" (green) + "Rejeitar Selecionados" (red) + "Limpar Seleção" (gray)
   - Confirmation modal before executing batch action
   - Loading state during batch processing

   Modify src/components/admin/ListingsTable.tsx:
   - Add a checkbox column as first column in the table
   - Add "Selecionar todos" checkbox in header
   - Maintain selectedIds state (Set<string>)
   - Render BatchActionBar when selection is active
   - Add new props: onBatchApprove: (ids: string[]) => Promise<void>, onBatchReject: (ids: string[]) => Promise<void>

   Add to src/lib/db.ts:
   - Function batchUpdateCarroStatus(ids: string[], status: StatusAnuncio): Promise<void> — uses Firestore writeBatch() to update up to 500 docs atomically
   - Function batchUpdatePecaStatus(ids: string[], status: StatusAnuncio): Promise<void> — same pattern

   Modify src/pages/Admin.tsx:
   - Add handleBatchApproveCarro, handleBatchRejectCarro, handleBatchApprovePeca, handleBatchRejectPeca handlers
   - Each batch handler calls the batch db function, then creates one audit log with action 'batch_approve'/'batch_reject' and details containing the array of IDs
   - Notify each affected user via criarNotificacao (loop through affected items)

6. REPORTS QUEUE
   Create src/hooks/useReports.ts:
   - Fetches reports with status 'pendente' using onSnapshot for real-time updates
   - Returns { reports, loading, resolveReport, ignoreReport, removeTargetAndResolve }

   Add to src/lib/db.ts:
   - Function getReportsPendentes(): Query with where('status', '==', 'pendente'), orderBy('dataCriacao', 'desc')
   - Function updateReportStatus(id: string, status: ReportStatus, resolvidoPor: string, resolucao?: string): updates report doc
   - Function getReportsCount(): returns count of pending reports

   Create src/components/admin/ReportsQueue.tsx:
   - Table with columns: Tipo, Alvo, Motivo, Descricao, Reportado por, Data, Acoes
   - Action buttons: "Resolver" (opens modal for admin note), "Ignorar", "Remover conteudo"
   - "Remover conteudo" calls the appropriate delete function (deleteCarro/deletePeca) based on targetType, then resolves the report
   - Each resolution creates an audit log
   - Empty state: "Nenhuma denuncia pendente."

   Modify src/pages/Admin.tsx:
   - Add 'denuncias' to TabAdmin type
   - Add tab button with flag icon and pending count badge
   - Render ReportsQueue when tab === 'denuncias'

7. VERIFICATIONS QUEUE
   Create src/hooks/useVerifications.ts:
   - Fetches verification requests with status 'pendente'
   - Returns { requests, loading, approveVerification, rejectVerification }

   Add to src/lib/db.ts:
   - Function getVerificationRequests(): Query pending verifications
   - Function updateVerificationStatus(id: string, status, analisadoPor, motivoRejeicao?): updates verification and user document (sets verified: true if approved)

   Create src/components/admin/VerificationsQueue.tsx:
   - Table with: Vendedor (nome + email), Empresa, NIF, Documentos (links), Data, Acoes
   - "Aprovar" sets verified: true on user doc + notifies user
   - "Rejeitar" opens modal for rejection reason + notifies user
   - Document links open in new tab (Firebase Storage URLs)

   Modify src/pages/Admin.tsx:
   - Add 'verificacoes' to TabAdmin type
   - Add tab with shield icon and pending count badge
   - Render VerificationsQueue when tab === 'verificacoes'

8. CSV EXPORT
   Create src/lib/csv-export.ts:
   - Function generateCSV(data: Record<string, unknown>[], headers: { key: string; label: string }[]): string — generates CSV content with BOM for Excel UTF-8 compatibility
   - Function downloadCSV(csvContent: string, filename: string): void — creates Blob, creates temporary anchor element, triggers download

   Create src/components/admin/ExportButton.tsx:
   - Button with download icon: "Exportar CSV"
   - Props: data array, headers config, filename
   - onClick generates CSV and triggers download
   - Disabled state when data is empty

   Modify src/pages/Admin.tsx:
   - Add ExportButton in the header area of Utilizadores tab (exports current user list)
   - Add ExportButton in the header area of Anuncios tab (exports current car/part list)

9. ADMIN ANALYTICS DASHBOARD
   Create src/components/admin/AdminAnalytics.tsx:
   - Section 1: Summary cards (total users, active listings, pending approval rate, reports this week)
   - Section 2: "Aprovacoes vs Rejeicoes" — simple bar chart (inline SVG, no library) showing last 7 days of approvals/rejections from audit_logs
   - Section 3: "Atividade Recente" — last 10 audit log entries as a timeline
   - Section 4: "Anuncios por Status" — horizontal stacked bar showing pendente/aprovado/rejeitado distribution
   - All charts use inline SVG with Tailwind colors (no chart libraries)

   Modify src/pages/Admin.tsx:
   - Enhance the 'visao-geral' tab: below AdminStats cards, render AdminAnalytics
   - Pass the necessary data (can reuse existing loaded data + audit logs)

10. FIRESTORE RULES UPDATE
    Update firestore.rules:
    - Add match blocks for audit_logs, reports, verifications, platform_config as specified in the plan's security rules section
    - Audit logs must be create-only (no update, no delete)

IMPLEMENTATION NOTES:
- When adding criarAuditLog calls to existing handlers in Admin.tsx, do NOT change the existing handler logic. Add the audit log call AFTER the existing operation succeeds, inside the try block.
- For batch operations, Firestore writeBatch() supports max 500 operations. Add a check and split into multiple batches if needed.
- The search in UserSearchBar should work client-side initially (filter the loaded users array). Firestore does not support native full-text search, so for the paginated version use where('email', '>=', query).where('email', '<=', query + '') for email prefix matching.
- CSV export must include BOM (﻿) at the start for Excel to correctly interpret UTF-8 characters (Portuguese accents).
- For the audit log timeline in AdminAnalytics, query the last 10 logs ordered by dataCriacao desc — this is a small, bounded query.
- Tab count badges (pending reports, pending verifications) should use the same data loaded by the respective hooks to avoid extra queries.
- Reuse the existing modal pattern from ListingsTable.tsx (fixed overlay + centered card + stopPropagation) for all new confirmation modals.
- The existing Admin.tsx TabAdmin type needs to expand from 'visao-geral' | 'utilizadores' | 'anuncios' to also include 'logs' | 'denuncias' | 'verificacoes'.
- Keep the existing refresh button functional — it should trigger refresh on all paginated hooks.
- AdminStats.tsx should be updated to include 2 new cards: "Denuncias Pendentes" and "Verificacoes Pendentes", each clickable to navigate to the respective tab.
```

---

*Documento gerado em 2026-05-27. Fase 1 do admin esta completa. Este plano cobre a Fase 2: evolucao para suportar operacoes em escala. Implementacao recomendada em 3 sprints: Sprint 1 (F1-F4, ~12 dias), Sprint 2 (F5-F8, ~10 dias), Sprint 3 (F9-F12, ~8 dias).*
