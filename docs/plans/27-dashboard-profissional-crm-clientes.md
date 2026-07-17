# 27. Dashboard Profissional & CRM de Clientes

**Prioridade:** ALTA | **Esforço estimado:** ~18–26 dias | **Status:** Proposta para análise


> Dá às empresas (stands/revendedores) e oficinas um painel próprio com analytics
> reais dos seus anúncios (visualizações, cliques, contactos, favoritos ao longo do
> tempo) **e** uma agenda de clientes (CRM) com nome, telefone, email, morada e
> veículos.

> 🔒 **Atualização de privacidade (implementação):** a capacidade de **correspondência
> por email** (F8/F9 — sinalizar/ligar um cliente a uma conta RecarGarage existente)
> foi **retirada do âmbito por decisão de privacidade dos utilizadores**. As empresas
> **não** conseguem descobrir se os seus clientes têm conta no app. Não existe rota de
> match, badge "No RecarGarage", campo `matchedUserUid` nem toggle `discoverableByPros`.
> O CRM guarda apenas os dados que o próprio profissional introduz (manual/CSV) e nunca
> os cruza com a coleção `users`. As secções 6.3, 6.4, 8.3 e 9 abaixo ficam como
> registo histórico do desenho, mas **não** correspondem ao código entregue.

---

## 1. Visão geral — o que resolve

Hoje o RecarGarage trata particulares e profissionais quase da mesma forma. O campo
`tipoConta: 'particular' | 'profissional'` (em `src/types/usuario.ts`) **existe mas não
desbloqueia nenhuma funcionalidade diferenciada**. Um profissional que publique 30
carros ou registe uma oficina vê apenas:

- contadores soltos por anúncio (`visualizacoes`, `contagemMensagens`,
  `contagemFavoritos`) na página de perfil (`ProfileLoggedIn.tsx`);
- nenhuma agregação, tendência temporal ou comparação entre anúncios;
- nenhuma forma estruturada de gerir os contactos/leads que recebe;
- nenhuma ferramenta para organizar a sua própria carteira de clientes.

Profissionais são tipicamente 60–80% da oferta de um marketplace maduro e são a base do
modelo B2B já desenhado no plano 17 (planos premium, leads, impulsos — já em produção).
Sem um painel que prove o valor que recebem, têm pouca razão para subscrever planos ou
manter o inventário atualizado. Este plano fecha essa lacuna com **dois blocos**:

1. **Dashboard Profissional** — KPIs agregados + gráficos temporais + tabela de
   desempenho por anúncio + caixa de leads.
2. **CRM de Clientes** — caderno de clientes do profissional (manual + importação CSV),
   com histórico simples e **correspondência por email** a perfis RecarGarage existentes
   (a "indicação"/ligação pedida no briefing).

### O que já existe (não reinventar)

| Já no código | Onde | Aproveitamento |
|---|---|---|
| `tipoConta` particular/profissional | `src/types/usuario.ts` | Gate de acesso ao dashboard |
| `planoAtivo` + `CategoriaPlano` ('anuncios'\|'oficinas'\|'leads') | `usuario.ts`, `GrantPlanModal` | Gating premium do CRM/leads |
| Contadores `visualizacoes` / `contagemMensagens` / `contagemFavoritos` | `carro.ts`, `peca.ts`, `oficina.ts` | Totais de vida (lifetime) das KPIs |
| `criadorUid` em carros/peças/oficinas | tipos respetivos | Buscar inventário do profissional |
| `getCarrosByCreator` / `getPecasByCreator` | `src/lib/db.ts` | Listagem do inventário |
| Fluxo de contacto `intencoes_compra → contatos_intencao` + flag `marcadoComoRelevante` | `intencao.ts`, `db.ts` | Caixa de leads (já tem pipeline de status) |
| `AdminStats` (cards) + `PortugalMap` (Leaflet) | `src/components/admin/` | Padrão visual de KPIs e mapa a reutilizar |
| Admin SDK server-side com fallback REST | `src/lib/db.server.ts` | Correspondência de email server-side (sem expor a coleção `users`) |

### O que falta (alvo deste plano)

- Rota e ecrã `/painel` para profissionais (gated por `tipoConta`).
- **Camada de séries temporais** — os contadores atuais são só totais de vida; não há
  histórico diário para desenhar gráficos. É a peça técnica central.
- Agregação de KPIs e comparação entre anúncios.
- Caixa de leads unificada (reaproveitando `contatos_intencao` + chats).
- Coleção e UI de **CRM de clientes**.
- **Correspondência por email** cliente↔perfil RecarGarage, com salvaguardas de privacidade.
- Biblioteca de gráficos (nenhuma instalada hoje).

---

## 2. Benchmark competitivo

### Portugal
- **AutoScout24 — Dealer Dashboard (HändlerIQ, 2025):** visão de inquéritos, *time-on-stand*,
  visibilidade na busca e **gestão/resposta a avaliações**. O diferencial é serem
  *insights acionáveis* — recomendações de preço/qualidade do anúncio aplicáveis a um
  clique, não apenas números.
- **Standvirtual (Plano Pro):** dashboard de métricas, destaque pago por anúncio, gestão
  em lote. Caro (~49–199 €/mês) — abre espaço para o RecarGarage oferecer o básico a custo
  baixo como porta de entrada (alinhado com plano 17).
- **OLX:** classifica automaticamente como profissional acima de N anúncios; dashboard
  básico de impressões/visualizações e pacotes de visibilidade.

### Brasil (mercado de lançamento — plano 20)
- **Webmotors / iCarros / OLX Brasil:** o anunciante profissional vive à volta de
  **estatísticas por anúncio (visualizações, leads) e gestão de inventário**. Grande parte
  do mercado usa *integradores* (Loja Conectada, StockCarWeb) que publicam num portal e
  sincronizam estado/preço — sinal de que **gestão centralizada de inventário + métricas**
  é exatamente o que o profissional valoriza.
- **Webmotors** reforça o ângulo "anuncie bem": preço vs. FIPE/preço médio de mercado —
  reforça a ideia de **insights acionáveis** no painel (cruzar com plano 02 — inteligência
  de preços).

### Sentimento de utilizadores (o que evitar)
- **Qualidade de lead > volume de lead.** Estima-se que <20% dos leads de formulário são
  sequer trabalhados; revendedores queixam-se de *leads fracos/falsos*. Lição: o painel
  não deve glorificar "número de contactos" — deve ajudar a **distinguir e priorizar** os
  bons (daí reaproveitar `marcadoComoRelevante` e dar estados ao lead).
- **Dashboards "bonitos mas inúteis":** métricas de vaidade que não disparam ação. Cada
  cartão do nosso painel deve sugerir uma ação ("anúncio X com muitas visitas e zero
  contactos → rever preço/fotos").

**Fontes:** AutoScout24 dealer dashboard (AIM Group), Standvirtual/OLX (AppBrain, GetApp),
Webmotors/integradores (edialog, Loja Conectada, StockCarWeb), métricas de marketplace
(Sharetribe, Kissmetrics, Improvado), qualidade de leads (DealershipNews).

---

## 3. Boas práticas de UX adotadas

1. **Acionável, não vaidade.** Cada KPI tem um "porquê" e, quando possível, uma sugestão.
   Ex.: *taxa de contacto* = contactos ÷ visualizações por anúncio (sinaliza preço/fotos
   fracos melhor que "total de views").
2. **Layout em quadrantes / pirâmide invertida.** Topo: 4–6 KPIs-âncora (cartões). Meio:
   gráfico temporal (área/linha, 7/30/90 dias). Baixo: tabela ordenável por anúncio +
   caixa de leads. 5–8 métricas no máximo por vista — evitar sobrecarga.
3. **Período comparável.** Toda a KPI mostra variação vs. período anterior (↑/↓ %), como
   no `AdminStats`.
4. **Estados.** Loading (skeletons), vazio ("Ainda sem dados — publique o seu primeiro
   anúncio"), erro. Reutilizar primitivas `src/components/ui/`.
5. **Acessibilidade (WCAG).** Gráficos com `role="img"` + `aria-label` textual e uma
   tabela/legenda equivalente; cor nunca é o único canal (usar rótulos + padrões). Foco
   visível, navegação por teclado na tabela e no CRM.
6. **Responsivo / mobile-first.** Cartões empilham; gráfico vira sparkline compacto; tabela
   colapsa em cartões. Coerente com o resto do app (PWA, plano 09).
7. **Design system.** Tokens semânticos Tailwind e componentes `ui/` (sem hex/`slate-*`
   crus) — usar a skill `frontend-design` em toda a UI.

---

## 4. Histórias de utilizador

1. *Como profissional*, quero um painel com o resumo do meu negócio (anúncios ativos,
   visualizações, contactos, favoritos — totais e tendência) para decidir onde atuar.
2. *Como profissional*, quero ver a evolução de visualizações/contactos nos últimos
   7/30/90 dias num gráfico, para perceber o efeito de uma mudança de preço ou de um impulso.
3. *Como profissional*, quero ordenar os meus anúncios por desempenho (views, taxa de
   contacto) e detetar os "encalhados", para os corrigir ou despublicar.
4. *Como oficina*, quero ver quantas pessoas viram e marcaram a minha oficina como favorita
   e quantos contactos recebi, para medir retorno.
5. *Como profissional*, quero uma caixa de leads onde vejo quem me contactou (e via que
   anúncio), marcar como relevante e mudar o estado (novo → em conversa → ganho/perdido).
6. *Como empresa/oficina*, quero uma **lista de clientes** (nome, telefone, email, morada,
   veículo) que mantenho eu próprio — mesmo de clientes que não usam o RecarGarage.
7. *Como empresa/oficina*, quero importar a minha carteira por CSV em vez de a digitar.
8. *Como empresa/oficina*, quero saber quando um cliente meu **também tem perfil no
   RecarGarage** (mesmo email), para lhe falar pelo chat e ver a sua reputação pública.
9. *Como utilizador particular*, quero **controlar** se posso ser descoberto desta forma e
   ser avisado quando uma empresa me liga como cliente.

---

## 5. Âmbito & funcionalidades

| # | Funcionalidade | Descrição | Prioridade |
|---|---|---|---|
| F1 | Ecrã `/painel` + gating | Rota client-rendered, noindex; só `tipoConta === 'profissional'` | Alta |
| F2 | KPIs agregados | Cartões de resumo com variação vs. período anterior | Alta |
| F3 | Séries temporais | Camada de buckets diários + gráfico 7/30/90 dias | Alta |
| F4 | Desempenho por anúncio | Tabela ordenável (views, contactos, favoritos, taxa de contacto) | Alta |
| F5 | Caixa de leads | `contatos_intencao` + chats num pipeline com estados | Média |
| F6 | CRM de clientes | Coleção `clients`, lista/detalhe/criar/editar, histórico simples | Alta |
| F7 | Importação CSV de clientes | Upload + pré-visualização + validação por linha | Média |
| ~~F8~~ | ~~Correspondência por email~~ | **Removido por privacidade** — as empresas não veem se um cliente tem conta | — |
| ~~F9~~ | ~~Privacidade do match~~ | **Removido** junto com F8 (deixa de ser necessário) | — |

Notas de gating: **F1–F5 grátis** para qualquer conta profissional (provam valor e
incentivam a subir de plano). **F6–F7 (CRM)** ligados a um plano (reutilizar
`CategoriaPlano` — p.ex. `'leads'` ou um novo `'crm'`) — decisão em §8.4.

---

## 6. Modelo de dados

### 6.1 Séries temporais (a peça central)

Os contadores atuais (`visualizacoes`, etc.) são **totais de vida** — não servem para
gráficos. Introduzimos **buckets diários agregados ao nível do vendedor**, para que o
painel desenhe 30/90 dias com ~30–90 leituras, **independentemente do nº de anúncios**.

```typescript
// src/types/dashboard.ts
export type MetricKind = 'view' | 'contact' | 'favorite' | 'lead';

// Documento por (vendedor, dia) — chave: `${ownerUid}_${YYYY-MM-DD}` (dia em Europe/Lisbon)
export interface SellerDailyMetrics {
  id: string;
  ownerUid: string;
  date: string;            // 'YYYY-MM-DD'
  views: number;
  contacts: number;        // cliques em contacto (whatsapp/telefone/email/chat)
  favorites: number;
  leads: number;           // contatos_intencao recebidos nesse dia
  updatedAt: Timestamp;
}
```

- **Escrita:** no mesmo ponto onde hoje se faz `increment(1)` no contador de vida do
  anúncio, fazer também `increment(1)` no campo correspondente do doc diário do vendedor
  (um `writeBatch` com as duas operações). O `ownerUid` está no próprio anúncio.
- **Dedup de views anónimas:** manter a deduplicação por sessão (`sessionStorage`) já
  necessária para não inflacionar `visualizacoes`; as KPIs são sinais de engajamento, não
  faturação — precisão aproximada é aceitável.
- **Drill-down por anúncio:** para a tendência de **um** anúncio específico, ler a
  subcoleção opcional `cars/{id}/daily/{YYYY-MM-DD}` só on-demand (carregada ao expandir a
  linha na tabela), evitando custo no carregamento inicial.

> **Porque ao nível do vendedor e não da listagem?** Um stand com 200 anúncios geraria 200×N
> leituras para um gráfico. O rollup por vendedor mantém o painel em O(dias). Ver §8.1 para
> alternativas (coleção de eventos + Cloud Function) e quando migrar.

### 6.2 CRM — coleção `clients`

```typescript
// src/types/client.ts
export type ClientStage = 'lead' | 'ativo' | 'inativo';
export type ClientSource = 'manual' | 'csv' | 'recargarage_lead';

export interface ClientVehicle {
  marca: string;
  modelo: string;
  ano?: number;
  matricula?: string;      // matrícula / placa
  km?: number;
  notas?: string;
}

export interface ClientInteraction {
  id: string;
  data: Timestamp;
  tipo: 'servico' | 'contacto' | 'nota';
  descricao: string;
  valor?: number;          // € do serviço, opcional
}

export interface Client {
  id: string;
  ownerUid: string;        // profissional dono do registo (controlador dos dados)
  nome: string;
  email?: string;
  telefone?: string;
  morada?: string;
  distrito?: string;
  veiculos?: ClientVehicle[];
  estado: ClientStage;
  origem: ClientSource;
  tags?: string[];
  notas?: string;
  interacoes?: ClientInteraction[];
  // Correspondência RecarGarage (preenchida server-side — ver §6.4)
  matchedUserUid?: string | null;
  matchedAt?: Timestamp | null;
  consentimento?: boolean; // base legal p/ marketing, se aplicável (RGPD)
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export type ClientInput = Omit<Client,
  'id' | 'ownerUid' | 'matchedUserUid' | 'matchedAt' | 'criadoEm' | 'atualizadoEm'>;
```

### 6.3 `Usuario` — toggle de privacidade

```typescript
// src/types/usuario.ts (acrescentar)
export interface Usuario {
  // ... campos existentes ...
  discoverableByPros?: boolean; // default true; controla F8/F9. UI em "Privacidade".
}
```

### 6.4 Correspondência por email (sem expor a coleção `users`)

A coleção `users` **não** é (nem deve ser) consultável por email a partir do cliente — isso
permitiria *enumeração de emails*. A correspondência corre **server-side** via Admin SDK,
reutilizando o padrão de `src/lib/db.server.ts`:

- **Route Handler** `app/api/clients/match/route.ts` (Node runtime, Admin SDK). Autentica o
  chamador (ID token) e confirma que é o `ownerUid` do cliente.
- Procura `users where email == client.email` **apenas se** o utilizador alvo tiver
  `discoverableByPros !== false`.
- Devolve o **mínimo**: `{ matched: boolean, uid?: string }`. O profissional já possui o
  email — não se revela nenhum email novo, apenas a existência de conta para um email que
  ele já tem. Persiste `matchedUserUid`/`matchedAt` no doc do cliente.
- **Sem entrar na pasta `functions/`** — fica tudo na superfície Next.js/Admin SDK (mais
  simples e alinhado com `db.server.ts`). Cloud Function só se for preciso reagir a writes
  em massa (ver §8.3).

> Mantém-se um risco residual de enumeração se um profissional importar uma lista enorme de
> emails só para descobrir quem está na plataforma. Mitigações em §9.

### 6.5 Firestore rules (esboço)

```javascript
// clients — estritamente do dono
match /clients/{clientId} {
  allow read, update, delete: if isAuthenticated()
                              && request.auth.uid == resource.data.ownerUid;
  allow create: if isAuthenticated()
                && request.resource.data.ownerUid == request.auth.uid
                // matchedUserUid só é escrito server-side (Admin SDK ignora rules)
                && !('matchedUserUid' in request.resource.data);
}

// seller_daily — leitura só do dono; incremento público só dos campos de métrica
match /seller_daily/{docId} {
  allow read: if isAuthenticated() && request.auth.uid == resource.data.ownerUid;
  allow create, update: if request.resource.data.diff(resource.data)
        .affectedKeys().hasOnly(['views','contacts','favorites','leads','updatedAt','ownerUid','date']);
}
```

O incremento público dos campos de métrica segue o **mesmo padrão `affectedKeys`** já usado
para `contagemFavoritos` e `intencoes_compra.stats` (ver `firestore.rules`). A escrita de
`matchedUserUid` é exclusiva do Admin SDK (que ignora as rules), pelo que o cliente nunca a
pode forjar.

### 6.6 Índices

- `clients`: índice `ownerUid ASC, atualizadoEm DESC` (lista do CRM). Filtros por
  `estado`/`tags` aplicados **em memória** (carteiras são pequenas) para evitar índices
  compostos extra — coerente com a convenção do projeto.
- `seller_daily`: a query é por intervalo de `date` com `ownerUid` fixo → índice
  `ownerUid ASC, date ASC`.

---

## 7. UI / Ecrãs

```
app/painel/page.tsx            # thin → renderiza src/screens/PainelProfissional.tsx
  └─ redireciona p/ /perfil se !isLoggedIn || tipoConta !== 'profissional'
```

`PainelProfissional` com abas (estado local, padrão do Admin):

1. **Visão geral**
   - 4–6 cartões KPI (`DashboardKpiCards`): anúncios ativos/pendentes, visualizações (período),
     contactos, favoritos, taxa de contacto média. Cada um com Δ% vs. período anterior.
   - `MetricsTimeChart` — gráfico de área 7/30/90 dias (seletor de período + de métrica),
     com `aria-label` e tabela equivalente acessível.
   - Atalhos rápidos: "Novo anúncio", "Importar clientes", "Ver perfil público".
2. **Anúncios** (`InventoryPerformanceTable`)
   - Linhas: miniatura, marca/modelo, preço, estado, views, contactos, favoritos, taxa de
     contacto. Ordenável; expandir abre sparkline da subcoleção `daily` do anúncio.
   - Sinalização acionável: badge "Sem contactos" para anúncios com muitas views e 0 contactos.
3. **Leads** (`LeadsInbox`)
   - Reaproveita `getContatosPorIntencao`/contatos do vendedor + threads de chat. Pipeline:
     novo → em conversa → ganho → perdido (mapear sobre `status` existente +
     `marcadoComoRelevante`). Botão "Adicionar ao CRM" cria um `Client` a partir do lead
     (origem `recargarage_lead`, já matched).
4. **Clientes (CRM)** (`ClientsTab`)
   - Lista pesquisável + filtros (estado, tag, "no RecarGarage"). Cartão/linha por cliente
     com badge de match. `ClientDetailDrawer` para ver/editar, veículos e histórico.
   - `ClientFormModal` (criar/editar) e `ClientCsvImport` (drag-drop, template, validação
     por linha — reutilizar/!generalizar o parser de CSV referido no plano 07).
   - Badge **"Também no RecarGarage"** → link para o perfil público + botão "Falar no chat".

Componentes novos (todos client, `'use client'`):
`src/screens/PainelProfissional.tsx`, `src/components/painel/DashboardKpiCards.tsx`,
`MetricsTimeChart.tsx`, `InventoryPerformanceTable.tsx`, `LeadsInbox.tsx`,
`ClientsTab.tsx`, `ClientFormModal.tsx`, `ClientDetailDrawer.tsx`, `ClientCsvImport.tsx`,
`MatchedUserBadge.tsx`. Hooks: `src/hooks/usePainel.ts` (agrega inventário + métricas),
`useClients.ts` (CRUD + subscrição). Privacidade: toggle em `EditarPerfilModal.tsx`.

Navegação: link "Painel" no `Header`/`Sidebar` só para profissionais; botão "Painel
Profissional" em `ProfileLoggedIn.tsx`.

---

## 8. Decisões de arquitetura

### 8.1 Séries temporais: rollup diário vs. eventos

| Opção | Prós | Contras |
|---|---|---|
| **Rollup diário por vendedor** (recomendado) | Leituras O(dias) p/ qualquer nº de anúncios; 1 write extra por evento (em batch); rules `affectedKeys` simples | Sem granularidade infra-diária; views anónimas aproximadas |
| Coleção de eventos (1 doc/evento) | Máxima granularidade e auditoria | Custo de writes alto, risco de spam, precisa de agregação p/ ler |
| Cloud Function agregadora | Filtra duplicados, eficiente em escala | Infra extra na pasta `functions/`; latência de atualização |

**Recomendação:** rollup diário por vendedor (+ subcoleção diária por anúncio só para
drill-down). Migrar para pipeline de eventos + Cloud Function **só** quando o volume
justificar (gatilho: >X mil eventos/dia ou necessidade de granularidade horária).

### 8.2 Biblioteca de gráficos

| Opção | Bundle | Notas |
|---|---|---|
| **Recharts** (recomendado) | ~136 KB gzip, mas **lazy** | API declarativa, tipos sólidos, SSR-friendly; padrão de facto em dashboards Next.js |
| visx | ~30–50 KB (modular) | Mais flexível, curva D3 mais íngreme |
| SVG à mão | 0 KB | Coerente com `AdminStats`/`PortugalMap`; ótimo p/ sparklines, fraco p/ tooltips/multi-série |

**Recomendação:** **Recharts**, carregado via `next/dynamic(..., { ssr: false })` só na rota
`/painel` (auth-gated, noindex) — nunca entra no bundle das rotas SEO. Sparklines simples na
tabela podem ficar em SVG à mão (já é o idioma da casa) para não pagar Recharts ao expandir
cada linha.

### 8.3 Match de email: Route Handler (Admin SDK) vs. Cloud Function

**Recomendação:** **Route Handler Next.js + Admin SDK** (`app/api/clients/match`). Mantém
tudo na superfície web (sem `functions/`), reaproveita as credenciais ADC já usadas em
`db.server.ts`, e corre on-demand (ao criar/editar cliente, ou em lote no fim de um import).
Cloud Function fica como evolução se quisermos rematch automático quando *novos utilizadores*
se registam com um email já presente em `clients`.

### 8.4 Gating do CRM

**Recomendação:** Dashboard de analytics (F1–F5) **grátis** para `tipoConta === 'profissional'`
(prova de valor, alinhado com a estratégia "básico grátis" vs. Standvirtual). CRM + match
(F6–F9) atrás de plano — reutilizar `CategoriaPlano: 'leads'` ou introduzir `'crm'` e
respetivo flag em `PremiumConfig`. Decisão final de pricing → coordenar com plano 17.

---

## 9. Privacidade & RGPD

- **Papéis:** no CRM, o **profissional é o responsável/controlador** dos dados dos seus
  clientes; o RecarGarage é subcontratante. Refletir nos Termos/Política e expor no painel
  um aviso curto ("É responsável pelos dados que carrega; só os carregue com base legal").
- **Base legal do match:** o profissional já detém o email do cliente (relação
  contratual/interesse legítimo). O match apenas cruza com dados **públicos** (perfil público
  já existente) e nunca revela dados privados.
- **Enumeração de emails:** o match corre server-side e devolve só `matched: boolean (+uid)`;
  a coleção `users` nunca é consultável por email pelo cliente. Mitigações adicionais:
  (a) respeitar `discoverableByPros` (opt-out do utilizador); (b) *rate-limit* ao endpoint e
  ao import; (c) não expor o match como API genérica, só como conveniência no produto.
- **Direitos do utilizador ligado:** notificação "A empresa X adicionou-o como cliente" +
  definição para desativar a descoberta e para se desassociar. Quando um utilizador apaga a
  conta ou desativa `discoverableByPros`, limpar `matchedUserUid` nos `clients` que o
  referenciam (job/route de limpeza).
- **Direitos do cliente do CRM:** exportar/eliminar registos (botões no `ClientDetailDrawer`),
  coerentes com os controlos RGPD já presentes no perfil.
- **Retenção:** política de retenção configurável/documentada; não guardar histórico
  indefinidamente sem base.

---

## 10. Sequência de commits

1. `feat: tipos de painel/CRM e séries temporais` — `dashboard.ts`, `client.ts`, campo
   `discoverableByPros` em `usuario.ts`; constantes (períodos, headers CSV, plano CRM).
2. `feat: escrita de métricas diárias` — `db.ts`: ao incrementar contadores de vida, batch
   no `seller_daily`; helpers `recordMetric`, `getSellerDailyRange`, `getCarDailyRange`.
3. `feat: regras Firestore para clients e seller_daily` — rules + (se preciso) índices.
4. `feat: CRM client CRUD` — `db.ts` (`createClient`/`updateClient`/`deleteClient`/
   `subscribeClients`), `hooks/useClients.ts`.
5. `feat: match de email server-side` — `app/api/clients/match/route.ts` (Admin SDK) +
   chamada a partir do `useClients`.
6. `feat: ecrã /painel + gating + KPIs + gráfico` — rota, `PainelProfissional`,
   `DashboardKpiCards`, `MetricsTimeChart` (Recharts lazy), `usePainel`.
7. `feat: tabela de desempenho por anúncio + caixa de leads` — `InventoryPerformanceTable`,
   `LeadsInbox` (sobre `contatos_intencao`).
8. `feat: UI do CRM` — `ClientsTab`, `ClientFormModal`, `ClientDetailDrawer`,
   `MatchedUserBadge`, `ClientCsvImport`.
9. `feat: privacidade do match` — toggle em `EditarPerfilModal`, notificação e limpeza on
   delete/opt-out.
10. `feat: navegação` — link "Painel" no Header/Sidebar/Perfil para profissionais.
11. `docs: marcar plano 27 como shipped` — flip `implemented` em `index.html` (no fim).

---

## 11. Casos extremos

- Profissional volta a `particular` → esconder painel; dados ficam (não apagar).
- Anúncio apagado → manter histórico diário (métrica do passado é válida); tabela mostra só
  anúncios vivos.
- Cliente sem email → sem match (badge ausente); sem erro.
- Emails duplicados no CRM → detetar e sugerir fusão no import.
- Utilizador alvo apaga conta / desativa descoberta → limpar `matchedUserUid`.
- Fuso horário das *buckets* → fixar `Europe/Lisbon` (e considerar `America/Sao_Paulo` quando
  o plano 20/Brasil entrar — usar a `country` desse plano).
- Stand com centenas de anúncios → confirmar que o painel só lê o rollup do vendedor +
  inventário paginado (não N subcoleções diárias).
- Views anónimas infladas → dedup por sessão; tratar números como sinais, não como verdade exata.
- Import CSV grande → processar em lotes; *rate-limit* do match.

---

## 12. Verificação

- `npx tsc --noEmit` e `npm run build` limpos.
- **Provabilidade das rules:** `clients` lido só com `ownerUid == auth.uid`; `seller_daily`
  com incremento restrito a `affectedKeys` dos campos de métrica; `matchedUserUid` só via
  Admin SDK. Confirmar manualmente contra `firestore.rules`.
- Fluxos manuais: gating do `/painel`; KPIs e gráfico com dados de seed; ordenação da
  tabela; criação/edição/CSV de cliente; match com um `users` de teste; opt-out
  (`discoverableByPros=false`) esconde o match; notificação ao utilizador ligado.
- Acessibilidade: gráfico com `aria-label`/tabela equivalente; navegação por teclado no CRM;
  contraste via tokens.
- Responsivo: cartões/gráfico/tabela em mobile; rever com a skill `frontend-design`.

---

## 13. KPIs de sucesso

| KPI | Alvo | Como medir |
|---|---|---|
| Profissionais ativos no painel (MAU) | 50%+ dos profissionais | sessões em `/painel` |
| Adoção do CRM | 30%+ dos profissionais com ≥1 cliente | `COUNT(distinct ownerUid em clients)` |
| Taxa de leads "relevantes" trabalhados | ↑ vs. baseline | `marcadoComoRelevante` / leads recebidos |
| Conversão para plano (CRM/leads) | +X% | subscrições após uso do painel |
| Retenção de profissionais (lock-in) | ↑ | regresso semanal ao painel |

---

## 14. Esforço

| Bloco | Dias |
|---|---|
| Tipos + séries temporais (escrita/leitura) | 3 |
| Rules + índices | 1 |
| Ecrã painel + KPIs + gráfico (Recharts) | 4 |
| Tabela por anúncio + caixa de leads | 3 |
| CRM CRUD + UI (lista/detalhe/form) | 4 |
| Import CSV | 2 |
| Match de email (route + UI + privacidade) | 3 |
| Notificações + limpeza + RGPD | 1.5 |
| Navegação + polish + verificação | 2 |
| **Total** | **~23.5 dias** |

---

## 15. Dependências e relação com outros planos

- **Plano 17 (Monetização B2B — entregue):** o painel é a "vitrina de valor" que justifica
  os planos; o gating do CRM deve coordenar pricing com este plano.
- **Plano 07 (Ferramentas Profissionais — em fila, referência SPA antiga):** este plano
  **substitui/atualiza** a sua F1/F2/F6 para a arquitetura Next.js atual (não usar as
  referências a `HashRouter`/`src/pages` desse plano). Upload CSV de *anúncios* e destaques
  pagos de 07 ficam fora do âmbito aqui.
- **Plano 02 (Inteligência de Preços):** futura fonte de *insights acionáveis* no painel
  (preço vs. mercado), estilo HändlerIQ.
- **Plano 20 (Brasil):** as *buckets* diárias e os rótulos de mercado devem respeitar a chave
  `country` quando o Brasil entrar (fuso e moeda).

---

*Fim do plano 27 — pronto para análise.*
