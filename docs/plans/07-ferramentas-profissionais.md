# Plano: Ferramentas Profissionais / Revendedores

**Prioridade:** MEDIA | **Estimativa Total:** ~15-22 dias de desenvolvimento

---

## 1. Visao Geral

### O Que Resolve

O ReparAuto trata todos os vendedores de forma igual: particulares e profissionais (stands/revendedores) usam o mesmo fluxo de publicacao e o mesmo perfil basico. No entanto, vendedores profissionais representam tipicamente 60-80% dos anuncios num marketplace maduro e tem necessidades distintas: gestao de inventario em massa, analytics de performance, ferramentas de destaque, e gestao de leads. Sem estas ferramentas, profissionais preferem plataformas como Standvirtual que oferecem planos profissionais.

Atualmente, a interface `Usuario` em `src/types/usuario.ts` ja distingue `tipoConta: 'particular' | 'profissional'`, mas esta distincao nao se reflete em funcionalidades diferenciadas. Esta e a oportunidade: construir sobre o campo existente para criar um ecossistema profissional.

### Benchmark Competitivo

- **Standvirtual**: Plano Pro com dashboard de metricas, destaque pago (1.99-9.99 euros/anuncio), integracao DMS, gestao em lote. Preco: ~49-199 euros/mes.
- **OLX Pro**: Dashboard basico, bump pago para subir anuncio, pacotes de visibilidade.
- **AutoScout24 Dealer**: Dashboard completo, upload CSV, lead management, website proprio integrado.
- **Facebook Marketplace**: Nenhuma ferramenta profissional dedicada (todos iguais).
- **Oportunidade**: O ReparAuto pode oferecer ferramentas profissionais a custo zero ou muito baixo como diferenciador para atrair stands pequenos que nao podem pagar Standvirtual Pro.

### Historias de Usuario

1. **Como revendedor**, quero ver um dashboard com o resumo do meu inventario (total de carros, pendentes, aprovados, visualizacoes totais), para gerir o meu negocio eficientemente.
2. **Como revendedor**, quero fazer upload de multiplos carros de uma vez via CSV/Excel, para nao ter de preencher o formulario carro a carro.
3. **Como revendedor**, quero ver quantas visualizacoes, favoritos e contactos cada anuncio recebeu, para saber quais carros geram mais interesse.
4. **Como revendedor**, quero pagar para destacar um anuncio no topo da listagem, para aumentar a sua visibilidade.
5. **Como comprador**, quero ver a pagina publica de um vendedor com todos os seus anuncios e a sua avaliacao, para avaliar a sua reputacao.
6. **Como revendedor**, quero ver uma lista dos contactos recebidos (leads) com historico, para fazer follow-up organizado.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

| # | Funcionalidade | Descricao | Prioridade |
|---|---------------|-----------|------------|
| F1 | Dashboard do revendedor | Pagina com visao geral: inventario, metricas resumo, acoes rapidas | Alta |
| F2 | Analytics de anuncios | Contagem de visualizacoes, favoritos e contactos por anuncio | Alta |
| F3 | Perfil publico do vendedor | Pagina publica com anuncios, bio, avaliacao e informacao de contacto | Alta |
| F4 | Gestao de inventario em massa | Upload CSV/Excel para criar multiplos anuncios, edicao em lote | Media |
| F5 | Destaque de anuncios premium | Pagar para colocar anuncio no topo, badge "Destaque" | Media |
| F6 | Leads e CRM basico | Lista de contactos interessados com historico de interacoes | Baixa |

### Fluxos de Usuario

**F1 -- Dashboard do Revendedor:**
1. Utilizador com `tipoConta === 'profissional'` ve link "Dashboard" no menu de perfil
2. Dashboard mostra: cards de resumo (total carros ativos, pendentes, vendidos este mes), grafico de visualizacoes dos ultimos 30 dias, lista de anuncios com metricas
3. Acoes rapidas: "Novo anuncio", "Upload em massa", "Ver perfil publico"
4. Filtros: por status (ativo/pendente/rejeitado), por periodo

**F2 -- Analytics de Anuncios:**
1. Cada vez que um utilizador abre `DetalhesCarro.tsx`, incrementa um contador de visualizacoes no documento do carro
2. Contagem de favoritos calculada a partir dos documentos de utilizadores (ou campo `favoritoCount` denormalizado)
3. Contagem de contactos: incrementar quando clicam em WhatsApp/Telefone/Email
4. No dashboard e na lista de carros do perfil, mostrar icones com numeros: olho (visualizacoes), coracao (favoritos), telefone (contactos)

**F3 -- Perfil Publico do Vendedor:**
1. Nova rota: `/#/vendedor/:uid`
2. Mostra: foto, nome, bio, tipo de conta (badge "Profissional" se aplicavel), localidade, membro desde
3. Lista de todos os anuncios ativos deste vendedor (carros + pecas)
4. Sistema de avaliacao futuro (placeholder com "Ainda sem avaliacoes")
5. Botao de contacto direto (chat ou WhatsApp)

**F4 -- Upload em Massa:**
1. Na dashboard, botao "Upload em massa"
2. Mostra modal com: area de drag-and-drop para ficheiro CSV/Excel
3. Template CSV disponivel para download com colunas: marca, modelo, ano, preco, km, combustivel, etc.
4. Apos upload, mostra preview tabular dos dados com validacao inline (erros a vermelho)
5. Botao "Publicar todos" cria anuncios em batch (status 'pendente')
6. Fotos sao adicionadas posteriormente (um por um) ou via URLs

**F5 -- Destaque Premium:**
1. No card do carro na listagem (CarCard), anuncios destacados aparecem primeiro e tem badge "Destaque" e borda dourada
2. Vendedor clica "Destacar anuncio" no dashboard -> modal com opcoes:
   - 7 dias: 2.99 euros
   - 14 dias: 4.99 euros
   - 30 dias: 7.99 euros
3. Pagamento via Stripe Checkout (sessao unica)
4. Documento do carro recebe campos: `destaque: true`, `destaqueExpira: Timestamp`
5. Carros destacados aparecem antes dos nao-destacados na ordenacao

**F6 -- Leads e CRM:**
1. Nova sub-pagina no dashboard: "Contactos Recebidos"
2. Cada clique em WhatsApp/Telefone/Email gera um registo de lead na colecao `leads`
3. Lista de leads com: nome do interessado (se logado), carro de interesse, data, tipo de contacto
4. Status do lead: "Novo", "Em conversa", "Vendido", "Desistiu"
5. Notas textuais por lead (campo de texto simples)

### Requisitos de UI/UX

- Dashboard deve ser responsivo: cards em grid 2x2 no desktop, empilhados no mobile
- Graficos de analytics simples (barras ou linhas) -- usar SVG puro ou biblioteca minimalista
- Perfil publico deve ser acessivel sem login (rota publica)
- Upload CSV deve ter feedback visual claro (progresso, erros por linha)
- Badge "Destaque" deve ser visualmente distinto mas nao agressivo (dourado subtil)
- CRM deve ser simples e rapido (nao e Salesforce, e uma lista com filtros)

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/Dashboard.tsx` | Pagina principal do dashboard profissional |
| `src/pages/VendedorPublico.tsx` | Pagina publica do perfil do vendedor |
| `src/components/dashboard/DashboardStats.tsx` | Cards de resumo (inventario, metricas) |
| `src/components/dashboard/InventoryList.tsx` | Lista de anuncios com metricas inline |
| `src/components/dashboard/AnalyticsChart.tsx` | Grafico de visualizacoes (SVG) |
| `src/components/dashboard/BulkUpload.tsx` | Modal de upload CSV/Excel com preview |
| `src/components/dashboard/LeadsList.tsx` | Lista de leads com filtros e status |
| `src/components/dashboard/HighlightModal.tsx` | Modal de compra de destaque |
| `src/components/home/FeaturedBadge.tsx` | Badge "Destaque" para CarCard |
| `src/components/vendedor/VendedorHeader.tsx` | Cabecalho do perfil publico |
| `src/components/vendedor/VendedorListings.tsx` | Grid de anuncios do vendedor |
| `src/hooks/useDashboard.ts` | Hook para dados do dashboard (carros, pecas, metricas) |
| `src/hooks/useAnalytics.ts` | Hook para tracking de visualizacoes e contactos |
| `src/hooks/useLeads.ts` | Hook para gestao de leads |
| `src/lib/csv-parser.ts` | Parser de CSV para upload em massa |
| `src/lib/analytics.ts` | Funcoes de tracking: incrementView, incrementContact, getStats |
| `src/types/dashboard.ts` | Tipos: DashboardStats, Lead, HighlightPlan, AnalyticsEvent |

### Modificacoes em Arquivos Existentes

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Adicionar rotas: `/dashboard` (protegida, profissional), `/vendedor/:uid` (publica) |
| `src/types/carro.ts` | Adicionar campos: `visualizacoes?: number`, `contactos?: number`, `destaque?: boolean`, `destaqueExpira?: Timestamp` |
| `src/types/usuario.ts` | Adicionar campos: `nomeStand?: string`, `website?: string`, `horarioFuncionamento?: string` |
| `src/pages/DetalhesCarro.tsx` | Chamar `incrementView()` no useEffect. Adicionar link para perfil publico do vendedor |
| `src/components/detalhes/StatusPanel.tsx` | Mostrar badge "Destaque" se `carro.destaque === true`. Adicionar link "Ver perfil do vendedor" |
| `src/components/detalhes/ContactSection.tsx` | Chamar `incrementContact()` ao clicar em botoes de contacto |
| `src/components/home/CarCard.tsx` | Mostrar FeaturedBadge e borda dourada se carro.destaque. Mostrar badge "Profissional" se vendedor profissional |
| `src/components/home/CarGrid.tsx` | Ordenar carros destacados primeiro (antes da ordenacao por preco/data) |
| `src/hooks/useCarros.ts` | Atualizar `carrosFiltrados` para colocar carros com `destaque === true` no topo |
| `src/components/perfil/ProfileLoggedIn.tsx` | Adicionar botao "Dashboard" se `user.tipoConta === 'profissional'`. Adicionar link "Ver meu perfil publico" |
| `src/components/layout/Header.tsx` | Adicionar link "Dashboard" no menu se utilizador profissional |
| `src/lib/db.ts` | Adicionar funcoes: `incrementCarroView()`, `incrementCarroContact()`, `getCarroStats()`, `getLeads()`, `addLead()`, `updateLead()` |
| `src/lib/constants.ts` | Adicionar: `HIGHLIGHT_PLANS`, `CSV_TEMPLATE_HEADERS` |
| `firestore.rules` | Adicionar regras para colecoes `analytics`, `leads`, `highlights` |

### Colecoes Firestore (schema)

```
// Collection: analytics (eventos de visualizacao/contacto)
{
  id: string,
  carroId: string,               // ID do anuncio
  tipo: 'view' | 'contact_whatsapp' | 'contact_phone' | 'contact_email' | 'favorite',
  uid?: string,                  // UID do utilizador (se logado, null se anonimo)
  dataCriacao: Timestamp,
}

// Collection: leads (contactos recebidos pelo vendedor)
{
  id: string,
  vendedorUid: string,           // UID do vendedor
  compradorUid?: string,         // UID do comprador (se logado)
  compradorNome?: string,        // Nome do comprador
  compradorEmail?: string,
  carroId: string,               // Carro de interesse
  carroTitulo: string,           // "Marca Modelo" (denormalizado para listagem rapida)
  tipoContacto: 'whatsapp' | 'phone' | 'email' | 'chat',
  status: 'novo' | 'em_conversa' | 'vendido' | 'desistiu',
  notas: string,
  dataCriacao: Timestamp,
  dataAtualizacao: Timestamp,
}

// Collection: highlights (compras de destaque)
{
  id: string,
  carroId: string,
  vendedorUid: string,
  plano: '7d' | '14d' | '30d',
  valor: number,                 // Valor pago em euros
  stripeSessionId?: string,
  dataInicio: Timestamp,
  dataExpiracao: Timestamp,
  ativo: boolean,
}

// Campos adicionais em cars (documento existente)
{
  ...campos_existentes,
  visualizacoes: number,         // Contador denormalizado (incremento atomico)
  contactos: number,             // Contador denormalizado
  destaque: boolean,
  destaqueExpira: Timestamp | null,
}

// Campos adicionais em users (documento existente)
{
  ...campos_existentes,
  nomeStand?: string,            // Nome do stand/empresa
  website?: string,              // URL do website do stand
  horarioFuncionamento?: string, // Ex: "Seg-Sex 9h-18h, Sab 9h-13h"
}
```

### Regras de Seguranca Firestore

```
// firestore.rules -- novas regras

match /analytics/{eventId} {
  allow read: if isAuthenticated(); // Qualquer utilizador logado pode ler (filtrado no cliente)
  allow create: if true; // Permitir tracking anonimo (views)
  allow update, delete: if false; // Eventos sao imutaveis
}

match /leads/{leadId} {
  allow read: if isAuthenticated() && request.auth.uid == resource.data.vendedorUid;
  allow create: if true; // Criado quando alguem contacta (pode ser anonimo)
  allow update: if isAuthenticated() && request.auth.uid == resource.data.vendedorUid;
  allow delete: if isAuthenticated() && request.auth.uid == resource.data.vendedorUid;
}

match /highlights/{highlightId} {
  allow read: if true; // Publico (para verificar se carro e destaque)
  allow create: if isAuthenticated() && request.resource.data.vendedorUid == request.auth.uid;
  allow update: if isAdmin(); // Apenas admin pode alterar status
  allow delete: if isAdmin();
}
```

### APIs/Servicos Externos

| Servico | Uso | Custo |
|---------|-----|-------|
| Stripe Checkout | Pagamento de destaques premium | 1.4% + 0.25 euros por transacao |
| SheetJS (xlsx) | Parse de ficheiros Excel para upload em massa | Gratuito (open source) |
| Nenhum | Analytics e leads sao 100% Firestore | Custo Firestore (reads/writes) |

### Componentes React Principais

**Dashboard (pagina):**
- Verifica `user.tipoConta === 'profissional'` -> redireciona se nao for
- Tabs: "Visao Geral", "Os Meus Anuncios", "Contactos/Leads"
- Usa `useDashboard()` hook para agregar dados

**DashboardStats:**
- Props: `carros: Carro[]`, `pecas: Peca[]`, `periodo: '7d' | '30d' | '90d'`
- Cards: "Anuncios Ativos" (count), "Pendentes" (count), "Visualizacoes" (soma), "Contactos" (soma)
- Cada card com icone, valor grande, e variacao percentual vs periodo anterior

**BulkUpload:**
- Drag-and-drop zone + file input
- Parse CSV com `csv-parser.ts` (split por virgula/ponto-e-virgula, headers na primeira linha)
- Validacao: campos obrigatorios (marca, modelo, ano, preco), tipos corretos
- Preview tabular com erros inline (celula vermelha + tooltip)
- Botao "Publicar N anuncios" -> cria documentos em batch

**VendedorPublico (pagina):**
- Rota: `/#/vendedor/:uid`
- Busca perfil do vendedor + anuncios (filtro `criador === vendedor.email` e `status === 'aprovado'`)
- Layout: header com foto/nome/bio + grid de anuncios (reutilizar CarCard/PecasCard)

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Funcionalidade | Frontend | Backend/Config | Total |
|---------------|----------|---------------|-------|
| F1: Dashboard do revendedor | 3 dias | 0.5 dia (queries) | 3.5 dias |
| F2: Analytics de anuncios | 2 dias | 1 dia (colecao + regras) | 3 dias |
| F3: Perfil publico vendedor | 2 dias | 0.5 dia (rota + queries) | 2.5 dias |
| F4: Upload em massa (CSV) | 4 dias | 0.5 dia (batch writes) | 4.5 dias |
| F5: Destaque premium | 2 dias | 2 dias (Stripe + regras) | 4 dias |
| F6: Leads e CRM | 3 dias | 1 dia (colecao + regras) | 4 dias |
| **Total** | **16 dias** | **5.5 dias** | **~21.5 dias** |

### Avaliacao de Valor

- **Atracao de profissionais:** MUITO ALTO. Stands e revendedores geram a maioria dos anuncios e sao essenciais para a massa critica da plataforma.
- **Monetizacao:** ALTO. Destaques premium sao a primeira fonte de receita direta da plataforma. Mesmo a 2.99-7.99 euros/destaque, 100 destaques/mes = 300-800 euros/mes.
- **Retencao:** ALTO. Dashboard e analytics criam "lock-in" -- vendedores que investem tempo na plataforma dificilmente mudam.
- **Diferenciacao:** MEDIO. Standvirtual ja oferece ferramentas similares, mas a custo elevado. ReparAuto pode oferecer o basico gratuitamente.
- **Custo tecnico:** MEDIO-ALTO. Muitas funcionalidades, mas nenhuma individualmente complexa.

### Posicao na Matriz

**Quadrante: Alto Valor / Esforco Alto**

A implementacao faseada e critica: F3 (perfil publico) e F2 (analytics) primeiro (base necessaria), seguidos de F1 (dashboard) e F5 (destaques) para monetizacao, e finalmente F4 (upload massa) e F6 (CRM) como diferenciadores.

---

## 5. Decisoes de Arquitetura

### Decisao 1: Monetizacao de Destaques

**Contexto:** Primeiro mecanismo de receita direta da plataforma. Necessidade de processar pagamentos para destacar anuncios.

| Opcao | Pros | Contras |
|-------|------|---------|
| **Stripe Checkout** | Sessao de pagamento hosted (nao precisa de PCI compliance), cartoes + MBWay via Stripe, webhooks para confirmar pagamento | Requer Cloud Functions para webhooks (nao e 100% client-side), custos fixos por transacao (0.25 euros) relevantes para valores baixos |
| **In-app credits** (comprar creditos primeiro, gastar depois) | UX mais fluida, menos fricao por destaque, incentiva compras maiores | Complexidade de gestao de saldo, reembolsos complicados, regulamentacao de moeda virtual |
| **Assinatura mensal** (plano Pro) | Receita recorrente previsivel, vendedores comprometem-se a longo prazo | Barreira de entrada alta para stands pequenos, precisa de muitas funcionalidades para justificar assinatura |

**Recomendacao:** **Stripe Checkout** por transacao individual. E o mais simples de implementar e nao cria barreira de entrada. Cada destaque e uma compra unica via Stripe Checkout Session (pagina de pagamento hosted). O webhook confirma o pagamento e atualiza o documento do carro com `destaque: true` e `destaqueExpira`. Futuramente, pode-se migrar para assinatura mensal quando houver funcionalidades suficientes para justificar um plano Pro. Nota: os webhooks requerem um endpoint server-side; usar Firebase Cloud Functions (HTTP trigger) para receber o webhook e atualizar o Firestore.

### Decisao 2: Estrategia de Analytics

**Contexto:** Necessidade de rastrear visualizacoes, favoritos e contactos por anuncio para fornecer metricas aos vendedores.

| Opcao | Pros | Contras |
|-------|------|---------|
| **Tracking client-side com Firestore** (cada evento = documento na colecao analytics) | Simples, dados ficam no Firestore, queries flexiveis | Custo de writes elevado (cada page view = 1 write), possivel abuso/spam de views |
| **Cloud Functions com batch processing** | Eficiente (agregar antes de escrever), pode filtrar duplicados, menor custo de writes | Complexidade de setup (Cloud Functions + scheduler), latencia na atualizacao de metricas |
| **Contador atomico denormalizado** (increment no documento do carro) | Ultra simples, 1 write por view (nao cria documento novo), leitura instantanea | Sem granularidade temporal (nao sabe views por dia), sem deduplificacao, perde historico |

**Recomendacao:** **Abordagem hibrida**: usar `increment()` do Firestore no documento do carro para contadores em tempo real (visualizacoes, contactos) e, opcionalmente, gravar eventos detalhados na colecao `analytics` apenas para utilizadores logados. Isto minimiza custos (views anonimas = apenas 1 write de increment no doc existente) enquanto mantém dados granulares para utilizadores identificados. A agregacao temporal (views por dia/semana) pode ser implementada no futuro com Cloud Functions scheduled.

---

## 6. Prompt de Implementacao

```
You are implementing the "Professional Tools / Dealer Features" for ReparAuto, a Portuguese used-car marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase. All UI text in Portuguese (PT-PT). Code in English. Use @/ import alias.

## Context

The project uses:
- React 19 with Context API + custom hooks (AppProvider at src/providers/AppProvider.tsx)
- HashRouter with routes in src/App.tsx
- User type at src/types/usuario.ts: Usuario with tipoConta ('particular' | 'profissional'), role ('user' | 'admin'), uid, nome, email, telefone, localidade, bio, foto
- Car type at src/types/carro.ts: Carro with id, marca, modelo, anoFabricacao, preco, km, fotos[], criador (email), vendedorNome, status ('pendente'|'aprovado'|'rejeitado')
- Part type at src/types/peca.ts: Peca with id, titulo, tipo, categoria, marcaCarro, criador, status
- DB operations at src/lib/db.ts: getCarrosByCreator(email), getPecasByCreator(email), addCarro(dados), updateCarro(id, dados), getAllCarrosAdmin(), criarNotificacao()
- Existing profile page at src/pages/Perfil.tsx uses ProfileLoggedIn (src/components/perfil/ProfileLoggedIn.tsx) which already shows "meusCarros" and "minhasPecas" lists
- Auth hook at src/hooks/useAuth.ts provides user, isLoggedIn, isAdmin
- Existing CarCard at src/components/home/CarCard.tsx and CarGrid at src/components/home/CarGrid.tsx for listing display
- Existing constants at src/lib/constants.ts
- Firestore security rules at firestore.rules with helper functions isAuthenticated(), isAdmin(), isOwnerByEmail()
- The Firestore increment() function is available from firebase/firestore for atomic counter updates

## Task 1: Public Vendor Profile Page

Create src/pages/VendedorPublico.tsx:

1. Route: add to src/App.tsx as <Route path="/vendedor/:uid" element={<VendedorPublico />} />
2. Fetch vendor profile using getUserProfile(uid) from src/lib/db.ts.
3. Fetch vendor's approved listings: query cars collection where criador == vendor.email AND status == 'aprovado'. Similarly for parts.
4. Layout:
   - Header: vendor photo (use UserAvatar from src/components/ui/UserAvatar.tsx), name, bio, tipoConta badge ("Profissional" or "Particular"), localidade, "Membro desde" date.
   - Add optional fields display: nomeStand, website (as clickable link), horarioFuncionamento.
   - Grid of car listings using CarCard component (src/components/home/CarCard.tsx).
   - Grid of part listings using PecasCard component (src/components/pecas/PecasCard.tsx).
   - Placeholder section: "Avaliações" with text "Ainda sem avaliações. Esta funcionalidade estará disponível em breve."
5. Add link from StatusPanel.tsx (src/components/detalhes/StatusPanel.tsx): make vendedorNome clickable, navigating to /vendedor/{uid}. This requires storing vendedorUid in the Carro document (currently only stores criador email).

Modify src/types/carro.ts: add vendedorUid?: string field to Carro interface.
Modify src/types/usuario.ts: add nomeStand?: string, website?: string, horarioFuncionamento?: string fields.

## Task 2: Analytics Tracking

Create src/lib/analytics.ts:

1. Function incrementView(carroId: string): Promise<void> — uses Firestore updateDoc with increment(1) on the 'visualizacoes' field of the car document. Import increment from firebase/firestore.
2. Function incrementContact(carroId: string, tipo: 'whatsapp' | 'phone' | 'email'): Promise<void> — increments 'contactos' field on the car document.
3. Function getCarroStats(carroId: string): Promise<{visualizacoes: number, contactos: number}> — reads current values from car document.

Create src/hooks/useAnalytics.ts:
1. Hook that calls incrementView() once per car per session (use sessionStorage key like 'viewed_${carroId}' to avoid duplicate counts).
2. Export trackContact(carroId, tipo) function for contact button clicks.

Modify src/types/carro.ts: add visualizacoes?: number and contactos?: number to Carro interface.

Modify src/pages/DetalhesCarro.tsx:
1. Import and call useAnalytics(carro.id) in useEffect after carro is loaded. This increments the view counter.
2. Pass trackContact function to ContactSection and StatusPanel.

Modify src/components/detalhes/StatusPanel.tsx:
1. Accept new prop: onContact?: (tipo: string) => void
2. Call onContact('whatsapp') when WhatsApp button clicked, onContact('phone') for phone, onContact('email') for email.

Modify src/components/detalhes/ContactSection.tsx: same pattern as StatusPanel for contact tracking.

## Task 3: Dealer Dashboard

Create src/pages/Dashboard.tsx:

1. Protected route: redirect to /perfil if user.tipoConta !== 'profissional'.
2. Add route in src/App.tsx: <Route path="/dashboard" element={<Dashboard />} />
3. Tabs (use state): "Visão Geral", "Anúncios", "Contactos"

Create src/components/dashboard/DashboardStats.tsx:
1. Props: carros: Carro[], pecas: Peca[]
2. Display 4 stat cards in a 2x2 grid:
   - "Anúncios Ativos" (count of status === 'aprovado')
   - "Pendentes de Aprovação" (count of status === 'pendente')
   - "Visualizações Totais" (sum of all carro.visualizacoes)
   - "Contactos Recebidos" (sum of all carro.contactos)
3. Style: each card with icon, large number, subtle background (similar to AdminStats pattern at src/components/admin/AdminStats.tsx).

Create src/components/dashboard/InventoryList.tsx:
1. Props: carros: Carro[], onEdit: (id: string) => void, onHighlight: (id: string) => void
2. Table/list showing each car: thumbnail, marca+modelo, preco, status badge, visualizacoes, contactos, actions (edit, highlight, delete).
3. Sort by: data de criacao (default), visualizacoes, preco.
4. Filter by status.

Create src/hooks/useDashboard.ts:
1. Fetches all cars and parts for current user using getCarrosByCreator and getPecasByCreator from src/lib/db.ts.
2. Returns: { carros, pecas, loading, recarregar }

Modify src/components/perfil/ProfileLoggedIn.tsx:
1. Add a "Dashboard Profissional" button for users with tipoConta === 'profissional'. Use navigate('/dashboard').
2. Add "Ver Perfil Público" link that navigates to /vendedor/{user.uid}.

Modify src/components/layout/Header.tsx:
1. If user is logged in and tipoConta === 'profissional', show "Dashboard" link in the navigation.

## Task 4: Bulk Upload (CSV)

Create src/lib/csv-parser.ts:
1. Function parseCSV(text: string): { headers: string[], rows: Record<string, string>[], errors: {row: number, column: string, message: string}[] }
2. Support both comma and semicolon delimiters (auto-detect based on first line).
3. Required columns: marca, modelo, anoFabricacao, preco, km, combustivel, cambio, cor, portas, local, descricao.
4. Validate: anoFabricacao is 4-digit number, preco is positive number, combustivel matches TIPOS_COMBUSTIVEL, cambio matches TIPOS_CAMBIO, portas is 2-5.

Create src/components/dashboard/BulkUpload.tsx:
1. Modal with drag-and-drop zone and file input (accept .csv, .txt).
2. "Download template CSV" button that generates and downloads a sample CSV file with headers and 2 example rows.
3. After file upload, show preview table with all rows. Highlight error cells in red with tooltip showing the error message.
4. "Publicar X anúncios" button that calls addCarro() for each valid row. All cars get status: 'pendente' and criador: user.email.
5. Progress bar during batch creation.
6. After completion: "X anúncios criados com sucesso. Y anúncios com erros ignorados."
7. Add CSV_TEMPLATE_HEADERS to src/lib/constants.ts.

## Task 5: Featured Listings

Create src/components/home/FeaturedBadge.tsx:
1. Small badge component: golden background, "Destaque" text with star icon.
2. Used inside CarCard to identify featured cars.

Modify src/components/home/CarCard.tsx:
1. If carro.destaque === true AND destaqueExpira is in the future: show FeaturedBadge, add golden border (border-amber-400).
2. Visual distinction should be subtle but noticeable.

Modify src/hooks/useCarros.ts:
1. In carrosFiltrados(), sort featured cars (destaque === true and not expired) before non-featured, then apply normal sort.

Create src/components/dashboard/HighlightModal.tsx:
1. Props: carroId: string, carroTitulo: string, onClose: () => void
2. Display 3 plan options: 7 days (2.99€), 14 days (4.99€), 30 days (7.99€).
3. For now, clicking a plan shows a "Em breve — Pagamento via Stripe" message (placeholder until Stripe is integrated).
4. Store plan options in HIGHLIGHT_PLANS constant in src/lib/constants.ts: Array of { duracao: string, dias: number, preco: number }.

Modify src/types/carro.ts: add destaque?: boolean, destaqueExpira?: Timestamp fields.

## Important Implementation Notes

- All new routes must use HashRouter (the app uses createHashRouter in src/App.tsx).
- The vendor public profile page (/vendedor/:uid) must work for non-logged-in users.
- Analytics tracking must be lightweight: use Firestore increment() for atomic updates, not read-then-write.
- Session-based deduplication for views: use sessionStorage (not localStorage) so views reset per browser session.
- The dashboard is only for 'profissional' accounts but the public profile works for all account types.
- When adding vendedorUid to car documents, it should be set at creation time (in the Anunciar flow). Existing documents won't have it — handle gracefully with optional chaining.
- CSV parsing must handle Portuguese characters (accents in city names, combustivel values).
- Featured listings sorting: check destaqueExpira > Timestamp.now() to verify the highlight hasn't expired.
- Reuse existing UI components: Badge (src/components/ui/Badge.tsx), Modal (src/components/ui/Modal.tsx), UserAvatar (src/components/ui/UserAvatar.tsx).
- Do NOT install chart libraries. Use inline SVG for the simple bar chart in AnalyticsChart (map data points to rect elements with calculated heights).
```
