# Plano 10 — Comunidade e Conteudo

> **Prioridade:** BAIXA
> **Estimativa total:** 10-14 dias de desenvolvimento
> **Dependencias:** Sistema de autenticacao existente (useAuth), sistema de notificacoes (useNotificacoes)

---

## 1. Visao Geral

### O Que Resolve

O ReparAuto e atualmente um marketplace transacional — os usuarios entram para comprar ou vender e saem logo depois. Nao ha razao para retornar ao site diariamente. Isso limita o engajamento, o SEO organico e a construcao de confianca na comunidade. Um marketplace automotivo de sucesso precisa de conteudo que atraia usuarios no topo do funil (pesquisas no Google sobre "como comprar carro usado em Portugal", "problemas comuns do Renault Clio") e de interacao entre usuarios que gere fidelidade.

Este plano transforma o ReparAuto de um simples classificado numa plataforma de referencia para o ecossistema automobilistico portugues, adicionando blog, forum, reviews colaborativos e recursos educativos.

### Benchmark Competitivo

| Plataforma | Blog | Forum | Reviews | Glossario | Video | Newsletter |
|---|---|---|---|---|---|---|
| **Standvirtual** | Sim (externo) | Nao | Nao | Nao | Nao | Sim |
| **OLX** | Sim (blog) | Nao | Nao | Nao | Nao | Sim |
| **Razao Automovel** | Sim (core) | Sim | Sim | Nao | Sim (YT) | Sim |
| **AutoScout24** | Sim | Nao | Sim | Nao | Nao | Sim |
| **ReparAuto (atual)** | Nao | Nao | Nao | Nao | Nao | Nao |
| **ReparAuto (proposto)** | Sim | Sim | Sim | Sim | Sim | Sim |

### Historias de Usuario

1. **Como comprador inexperiente**, quero ler guias sobre "como inspecionar um carro usado" antes de comprar, para nao cometer erros.
2. **Como dono de um carro com problemas**, quero perguntar no forum se alguem ja passou pelo mesmo problema e como resolveu.
3. **Como potencial comprador de um Peugeot 206**, quero ver reviews de outros donos sobre fiabilidade, custos de manutencao e problemas comuns.
4. **Como leigo em mecanica**, quero consultar o glossario para entender termos como "junta da cabeca", "EGR" ou "cambio CVT".
5. **Como usuario interessado**, quero assinar uma newsletter semanal com os melhores anuncios e novos artigos do blog.
6. **Como criador de conteudo**, quero ver videos de YouTube sobre reviews de carros embutidos diretamente no ReparAuto sem sair do site.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

| # | Funcionalidade | Descricao | Complexidade |
|---|---|---|---|
| F1 | Blog/Guias | Sistema de artigos com categorias, busca, rich text | Alta |
| F2 | Forum de discussoes | Topicos, respostas, votos, categorias, moderacao | Alta |
| F3 | Reviews de modelos | Avaliacoes por modelo com rating, pros/contras, custos | Media |
| F4 | Glossario automotivo | Dicionario de termos tecnicos com busca e links cruzados | Baixa |
| F5 | Integracao YouTube | Embed de videos relacionados em artigos e reviews | Baixa |
| F6 | Newsletter | Coleta de emails, templates, envio semanal via SendGrid | Media |

### Fluxos de Usuario

**Fluxo 1 — Leitura de Blog:**
1. Usuario acessa a pagina "Guias" no menu principal
2. Ve lista de artigos em cards com imagem, titulo, resumo e categoria
3. Pode filtrar por categoria (Compra, Manutencao, Legislacao, Dicas)
4. Clica num artigo → pagina de leitura com rich text, imagens, videos
5. No final, ve artigos relacionados e link para forum de discussao
6. Pode compartilhar o artigo via botoes sociais

**Fluxo 2 — Forum de Discussao:**
1. Usuario acessa "Comunidade" no menu
2. Ve lista de topicos recentes com titulo, autor, data, respostas, categoria
3. Pode filtrar por categoria (Mecanica, Eletrica, Compra/Venda, Geral)
4. Para criar topico: precisa estar logado → formulario com titulo, categoria, corpo (rich text)
5. Outros usuarios podem responder e votar (upvote) nas respostas
6. Autor e admins podem marcar uma resposta como "solucao"
7. Topicos inativos ha 90 dias sao automaticamente fechados

**Fluxo 3 — Review de Modelo:**
1. Na pagina de detalhes de um carro (DetalhesCarro), ve seccao "Reviews do [marca] [modelo]"
2. Pode clicar em "Ver todos os reviews" → pagina dedicada ao modelo
3. Para escrever review: formulario com rating (1-5 estrelas), pros, contras, custos medios anuais de manutencao, anos de posse
4. Reviews sao moderados (status 'pendente' → admin aprova)
5. Pagina do modelo mostra media de rating, custos, problemas comuns (agregados)

**Fluxo 4 — Newsletter:**
1. No footer do site, campo "Receba as melhores ofertas no seu email"
2. Usuario insere email → salvo no Firestore
3. Semanalmente, Cloud Function compila top anuncios + novos artigos
4. Envia email via SendGrid com template HTML responsivo
5. Link de unsubscribe no footer do email

### Requisitos de UI/UX

- **Blog:** layout limpo estilo Medium. Imagem hero no topo do artigo. Tipografia legivel (fonte Inter, tamanho 18px no corpo). Tempo estimado de leitura. Sidebar com artigos relacionados no desktop.
- **Forum:** inspirado no Stack Overflow simplificado. Lista de topicos com preview. Badge de "Resolvido" para topicos com resposta marcada. Avatar do autor. Contagem de respostas e votos.
- **Reviews:** cards com estrelas, barra de progresso por categoria (fiabilidade, conforto, custo). Design inspirado no TrustPilot.
- **Glossario:** lista alfabetica com search bar. Cada termo pode ter link para artigo detalhado. Cards minimalistas.
- **Newsletter CTA:** banner no footer e popup discreto apos 3 paginas visitadas (com check de localStorage para nao irritar).

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Arquivo | Descricao |
|---|---|
| `src/pages/Blog.tsx` | Listagem de artigos com filtros e busca |
| `src/pages/BlogArtigo.tsx` | Pagina individual de artigo |
| `src/pages/Comunidade.tsx` | Forum — listagem de topicos |
| `src/pages/Topico.tsx` | Pagina individual de topico com respostas |
| `src/pages/CriarTopico.tsx` | Formulario de criacao de topico |
| `src/pages/Reviews.tsx` | Reviews por modelo de carro |
| `src/pages/Glossario.tsx` | Dicionario de termos automotivos |
| `src/components/blog/ArtigoCard.tsx` | Card de preview de artigo |
| `src/components/blog/ArtigoContent.tsx` | Renderizacao de conteudo rich text |
| `src/components/blog/CategoriaFilter.tsx` | Filtro por categoria de artigo |
| `src/components/comunidade/TopicoCard.tsx` | Card de preview de topico |
| `src/components/comunidade/RespostaItem.tsx` | Resposta individual com votos |
| `src/components/comunidade/VoteButton.tsx` | Botao de upvote/downvote |
| `src/components/comunidade/EditorTexto.tsx` | Editor de texto simples (textarea + markdown preview) |
| `src/components/reviews/ReviewCard.tsx` | Card individual de review |
| `src/components/reviews/ReviewForm.tsx` | Formulario de submissao de review |
| `src/components/reviews/RatingStars.tsx` | Componente de estrelas (input e display) |
| `src/components/reviews/ModeloStats.tsx` | Estatisticas agregadas de um modelo |
| `src/components/glossario/TermoCard.tsx` | Card de termo do glossario |
| `src/components/newsletter/NewsletterBanner.tsx` | CTA de inscricao na newsletter |
| `src/components/newsletter/NewsletterPopup.tsx` | Popup de inscricao (apos 3 paginas) |
| `src/hooks/useBlog.ts` | Hook para fetch de artigos do Firestore |
| `src/hooks/useForum.ts` | Hook para topicos e respostas |
| `src/hooks/useReviews.ts` | Hook para reviews de modelos |
| `src/types/blog.ts` | Interfaces: Artigo, CategoriaArtigo |
| `src/types/forum.ts` | Interfaces: Topico, Resposta, VotoTopico |
| `src/types/review.ts` | Interfaces: Review, ModeloReviewStats |

### Modificacoes em Arquivos Existentes

| Arquivo | Modificacao |
|---|---|
| `src/App.tsx` | Adicionar rotas: /blog, /blog/:slug, /comunidade, /comunidade/:id, /comunidade/criar, /reviews/:marca/:modelo, /glossario |
| `src/components/layout/Header.tsx` | Adicionar links "Guias" e "Comunidade" no menu de navegacao |
| `src/components/layout/BottomNav.tsx` | Adicionar tab "Mais" com submenu para Blog, Comunidade, Glossario |
| `src/components/layout/Footer.tsx` | Adicionar NewsletterBanner acima dos links do footer |
| `src/providers/AppProvider.tsx` | Adicionar blog e forum contexts ao provider (ou criar providers separados) |
| `src/pages/DetalhesCarro.tsx` | Adicionar seccao "Reviews do [modelo]" com preview e link |
| `src/lib/db.ts` | Adicionar funcoes CRUD para artigos, topicos, respostas, reviews, newsletter_subscribers |
| `src/lib/constants.ts` | Adicionar CATEGORIAS_BLOG, CATEGORIAS_FORUM, glossario base |
| `firestore.rules` | Regras para colecoes blog_articles, forum_topics, forum_replies, reviews, newsletter_subscribers |

### Colecoes Firestore

**Colecao `blog_articles`:**
```typescript
interface Artigo {
  id: string;
  slug: string;            // URL-friendly: "como-comprar-carro-usado"
  titulo: string;
  resumo: string;          // 160 chars para preview e meta description
  conteudo: string;        // HTML ou Markdown
  imagemCapa: string;      // URL da imagem
  categoria: CategoriaArtigo; // 'compra' | 'manutencao' | 'legislacao' | 'dicas'
  tags: string[];
  autor: string;           // uid do admin
  autorNome: string;
  tempoLeitura: number;    // minutos estimados
  publicado: boolean;
  dataCriacao: Timestamp;
  dataAtualizacao: Timestamp;
  visualizacoes: number;
  youtubeVideoIds?: string[]; // IDs de videos do YouTube embutidos
}
```

**Colecao `forum_topics`:**
```typescript
interface Topico {
  id: string;
  titulo: string;
  corpo: string;           // Markdown
  categoria: CategoriaForum; // 'mecanica' | 'eletrica' | 'compra_venda' | 'geral'
  autorUid: string;
  autorNome: string;
  autorFoto: string | null;
  respostas: number;       // contagem denormalizada
  votos: number;           // contagem denormalizada
  resolvido: boolean;
  respostaAceiteId?: string;
  fechado: boolean;
  dataCriacao: Timestamp;
  ultimaAtividade: Timestamp;
}
```

**Subcolecao `forum_topics/{topicId}/replies`:**
```typescript
interface Resposta {
  id: string;
  corpo: string;
  autorUid: string;
  autorNome: string;
  autorFoto: string | null;
  votos: number;
  aceite: boolean;         // marcada como solucao
  dataCriacao: Timestamp;
  dataEdicao?: Timestamp;
}
```

**Colecao `forum_votes`:**
```typescript
interface VotoForum {
  id: string;              // format: "{uid}_{targetType}_{targetId}"
  uid: string;
  targetType: 'topic' | 'reply';
  targetId: string;
  valor: 1 | -1;
  dataCriacao: Timestamp;
}
```

**Colecao `reviews`:**
```typescript
interface Review {
  id: string;
  marca: string;
  modelo: string;
  autorUid: string;
  autorNome: string;
  rating: number;          // 1-5
  anosPosse: number;
  kmPercorridos: number;
  pros: string[];
  contras: string[];
  custoManutencaoAnual: number; // euros
  comentario: string;
  status: StatusAnuncio;   // reutiliza 'pendente' | 'aprovado' | 'rejeitado'
  dataCriacao: Timestamp;
}
```

**Colecao `newsletter_subscribers`:**
```typescript
interface NewsletterSubscriber {
  id: string;
  email: string;
  uid?: string;           // se logado
  ativo: boolean;
  dataCriacao: Timestamp;
  dataUnsubscribe?: Timestamp;
}
```

**Colecao `glossary_terms`:**
```typescript
interface TermoGlossario {
  id: string;
  termo: string;          // ex: "Junta da Cabeca"
  definicao: string;      // explicacao em linguagem acessivel
  categoria: string;      // 'motor' | 'transmissao' | 'eletrica' | 'carrocaria' | 'geral'
  termosRelacionados: string[]; // IDs de outros termos
  artigoRelacionado?: string;   // slug de artigo do blog
}
```

### Regras de Seguranca Firestore

```
// Blog — somente admins podem criar/editar, todos podem ler
match /blog_articles/{articleId} {
  allow read: if true;
  allow create, update, delete: if isAdmin();
}

// Forum — usuarios autenticados podem criar topicos e respostas
match /forum_topics/{topicId} {
  allow read: if true;
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && (
    request.auth.uid == resource.data.autorUid || isAdmin()
  );
  allow delete: if isAdmin();

  match /replies/{replyId} {
    allow read: if true;
    allow create: if isAuthenticated();
    allow update: if isAuthenticated() && (
      request.auth.uid == resource.data.autorUid || isAdmin()
    );
    allow delete: if isAdmin();
  }
}

// Votos — cada usuario so pode votar uma vez por item
match /forum_votes/{voteId} {
  allow read: if true;
  allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
  allow update: if isAuthenticated() && request.auth.uid == resource.data.uid;
  allow delete: if isAuthenticated() && request.auth.uid == resource.data.uid;
}

// Reviews — usuarios autenticados podem criar, admin aprova
match /reviews/{reviewId} {
  allow read: if true;
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && (
    request.auth.uid == resource.data.autorUid || isAdmin()
  );
  allow delete: if isAdmin();
}

// Newsletter — qualquer um pode se inscrever
match /newsletter_subscribers/{subId} {
  allow read: if isAdmin();
  allow create: if true;
  allow update: if isAdmin() || (isAuthenticated() && request.auth.uid == resource.data.uid);
  allow delete: if isAdmin();
}

// Glossario — admin gerencia, todos leem
match /glossary_terms/{termId} {
  allow read: if true;
  allow write: if isAdmin();
}
```

### APIs/Servicos Externos

| Servico | Uso | Custo |
|---|---|---|
| **SendGrid** | Envio de newsletter semanal | Gratuito ate 100 emails/dia |
| **YouTube oEmbed API** | Embed de videos em artigos | Gratuito |
| **Firebase Cloud Functions** | Disparar newsletter, fechar topicos inativos | Gratuito (Spark plan: 125k invocations/month) |

### Componentes React Principais

**ArtigoCard.tsx:**
- Props: `artigo: Artigo`
- Layout: imagem de capa (16:9), badge de categoria, titulo, resumo (truncado em 2 linhas), tempo de leitura, data
- Link para `/blog/${artigo.slug}`

**TopicoCard.tsx:**
- Props: `topico: Topico`
- Layout: badge de categoria, titulo, autor (avatar + nome), data, contagem de respostas, contagem de votos, badge "Resolvido" se aplicavel

**ReviewCard.tsx:**
- Props: `review: Review`
- Layout: estrelas (RatingStars), nome do autor, anos de posse, lista de pros (verde) e contras (vermelho), custo anual

**RatingStars.tsx:**
- Props: `valor: number`, `onChange?: (v: number) => void`, `readOnly?: boolean`, `tamanho?: 'sm' | 'md' | 'lg'`
- Renderiza 5 estrelas (Star do lucide-react). Em modo input, hover muda as estrelas. Em modo readOnly, exibe apenas.

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Funcionalidade | Esforco (dias) | Complexidade | Risco |
|---|---|---|---|
| Blog/Guias | 3 | Alta | Baixo |
| Forum de discussoes | 4 | Alta | Medio |
| Reviews de modelos | 2 | Media | Baixo |
| Glossario automotivo | 1 | Baixa | Baixo |
| Integracao YouTube | 0.5 | Baixa | Baixo |
| Newsletter (SendGrid) | 2 | Media | Medio |
| **Total** | **12.5** | | |

### Avaliacao de Valor

- **Impacto no usuario:** Medio. Conteudo atrai novos usuarios via SEO organico e cria razoes para retornar, mas nao e o core do produto (compra/venda).
- **Diferencial competitivo:** Medio-Alto. Nenhum concorrente portugues direto combina marketplace + conteudo + comunidade. A Razao Automovel tem conteudo mas nao e marketplace.
- **Retorno de investimento:** Medio. O retorno e de longo prazo (SEO leva meses para gerar trafego organico). O forum requer moderacao contínua.
- **Risco tecnico:** Medio. O forum e a parte mais complexa (votos, moderacao, spam). A newsletter requer Cloud Functions e servico externo.

### Posicao na Matriz

```
         ALTO VALOR
              |
   Quick Win  |  Projeto Grande
              |
  BAIXO ------+------ ALTO ESFORCO
              |
  Descartavel |  ★ Comunidade/Conteudo
              |
         BAIXO VALOR
```

**Posicao: Projeto Grande de Baixa Prioridade** — esforco alto com valor que se materializa a longo prazo. Recomenda-se implementar em fases: Fase 1 (glossario + blog estatico), Fase 2 (reviews), Fase 3 (forum + newsletter).

---

## 5. Decisoes de Arquitetura

### Decisao 1: Forum Interno (Firestore) vs Discourse Externo

**Contexto:** O ReparAuto precisa de um forum de discussoes. Existem duas abordagens: construir o forum dentro do app usando Firestore como backend, ou integrar uma plataforma de forum externa como o Discourse via iframe ou API.

| Opcao | Pros | Contras |
|---|---|---|
| **Forum interno (Firestore)** | UX integrada e consistente; sem custos extras de hosting; dados no mesmo Firestore; autenticacao unificada com Firebase Auth; controle total sobre design | Muito mais codigo para desenvolver; precisa implementar moderacao, votos, busca, paginacao; escalabilidade limitada (Firestore queries) |
| **Discourse externo** | Feature-complete (busca, moderacao, badges, email); comunidade ativa; escalavel; SEO excelente | Requer servidor separado (hosting ~$20/mes); UX desconectada do app; tema diferente; SSO complexo com Firebase Auth; dependencia de plataforma externa |

**Recomendacao:** **Forum interno (Firestore).** Para o tamanho atual do ReparAuto, um forum simples com topicos, respostas e votos e suficiente. A integracao visual e de autenticacao e muito mais suave. O custo de hosting do Discourse nao se justifica para uma comunidade em estagio inicial. Se a comunidade crescer significativamente (1000+ topicos/mes), pode-se migrar para Discourse.

### Decisao 2: Blog Interno vs CMS Headless vs Markdown Files

**Contexto:** O blog precisa de um sistema de gestao de conteudo. As opcoes vao desde armazenar artigos no Firestore com um editor no painel admin, ate usar um CMS headless externo, ou simplesmente arquivos markdown no repositorio.

| Opcao | Pros | Contras |
|---|---|---|
| **Firestore + editor no admin** | Tudo no mesmo ecossistema; admin ja existe; publicacao instantanea; sem dependencias extras | Precisa criar editor rich text; sem preview antes de publicar; versionamento de conteudo complexo |
| **CMS headless (Strapi/Contentful)** | Editor visual poderoso; preview; versionamento; media management; API pronta | Custo (Contentful: plano gratuito limitado); mais uma dependencia; latencia de API extra; complexidade de deploy |
| **Markdown no repositorio** | Simples; versionado pelo Git; sem custo; build-time rendering; performance maxima | Requer deploy para cada artigo; nao acessivel para nao-desenvolvedores; sem editor visual |

**Recomendacao:** **Firestore + editor no admin.** O projeto ja tem um painel de administracao (src/pages/Admin.tsx) e o Firestore e o backend natural. Para a fase inicial, um editor simples com textarea + markdown preview e suficiente. Se a demanda por conteudo crescer, pode-se adicionar um editor WYSIWYG (Tiptap ou similar) depois. Evitar markdown no repo porque o admin do ReparAuto pode nao ser desenvolvedor.

---

## 6. Prompt de Implementacao

```
You are implementing community and content features for ReparAuto, a Portuguese used-car
and parts marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase.

PROJECT CONTEXT:
- Vite 8 bundler with config at vite.config.ts (uses @tailwindcss/vite plugin, @/ alias)
- React Router 7 with HashRouter in src/App.tsx — routes defined inside <Routes> component
- Firebase SDK configured in src/lib/firebase.ts (exports: auth, db, storage)
- All Firestore CRUD operations live in src/lib/db.ts — collections: 'cars', 'parts',
  'users', 'messages', 'notifications', 'services'
- Global state via Context API in src/providers/AppProvider.tsx (composes useAuth, useCarros,
  usePecas, useFavoritos, useChat)
- Types in src/types/ — existing: carro.ts (Carro, StatusAnuncio), peca.ts (Peca),
  usuario.ts (Usuario, Role), notificacao.ts (Notificacao, TipoNotificacao), app.ts (AppContextValue)
- Existing hooks in src/hooks/: useAuth.ts, useCarros.ts, usePecas.ts, useFavoritos.ts,
  useChat.ts, useNotificacoes.ts, useMarcasModelos.ts, useCodigoPostal.ts
- UI components in src/components/ui/: Button.tsx, Modal.tsx, Toast.tsx, Badge.tsx, UserAvatar.tsx
- Layout components: Header.tsx, Footer.tsx, BottomNav.tsx (all in src/components/layout/)
- Admin page at src/pages/Admin.tsx — existing admin panel with listing approval
- Constants at src/lib/constants.ts — CONCELHOS, TIPOS_COMBUSTIVEL, CATEGORIAS_PECAS, etc.
- Car makes/models database at src/data/marcas-modelos.json
- All UI text must be in Portuguese (PT-PT). Code/comments/variables in English.
- Import alias: always use @/ (maps to src/). No relative imports.
- Styling: Tailwind utility classes only. Brand colors: brand-50 to brand-900. Accent: #e55b2b.

IMPLEMENTATION PHASES — Implement in this order:

PHASE 1 — Types and Data Layer:
1. Create src/types/blog.ts:
   - type CategoriaArtigo = 'compra' | 'manutencao' | 'legislacao' | 'dicas'
   - interface Artigo { id, slug, titulo, resumo, conteudo (markdown string), imagemCapa,
     categoria: CategoriaArtigo, tags: string[], autor (uid), autorNome, tempoLeitura (number),
     publicado (boolean), dataCriacao: Timestamp, dataAtualizacao: Timestamp,
     visualizacoes: number, youtubeVideoIds?: string[] }
2. Create src/types/forum.ts:
   - type CategoriaForum = 'mecanica' | 'eletrica' | 'compra_venda' | 'geral'
   - interface Topico { id, titulo, corpo (markdown), categoria: CategoriaForum, autorUid,
     autorNome, autorFoto: string|null, respostas: number, votos: number, resolvido: boolean,
     respostaAceiteId?: string, fechado: boolean, dataCriacao: Timestamp,
     ultimaAtividade: Timestamp }
   - interface Resposta { id, corpo, autorUid, autorNome, autorFoto: string|null,
     votos: number, aceite: boolean, dataCriacao: Timestamp, dataEdicao?: Timestamp }
   - interface VotoForum { id, uid, targetType: 'topic'|'reply', targetId, valor: 1|-1,
     dataCriacao: Timestamp }
3. Create src/types/review.ts:
   - interface Review { id, marca, modelo, autorUid, autorNome, rating (1-5), anosPosse,
     kmPercorridos, pros: string[], contras: string[], custoManutencaoAnual: number,
     comentario, status: StatusAnuncio (import from carro.ts), dataCriacao: Timestamp }
4. Update src/lib/db.ts: add CRUD functions:
   - Blog: getArtigos(), getArtigoBySlug(slug), criarArtigo(data), atualizarArtigo(id, data),
     incrementarVisualizacoes(id)
   - Forum: getTopicos(categoria?), getTopicoPorId(id), criarTopico(data),
     getRespostas(topicoId), criarResposta(topicoId, data), votarItem(voto: VotoForum),
     marcarRespostaAceite(topicoId, respostaId), fecharTopico(topicoId)
   - Reviews: getReviewsPorModelo(marca, modelo), criarReview(data), aprovarReview(id)
   - Newsletter: inscreverNewsletter(email, uid?), desinscreverNewsletter(email)
   - Glossary: getTermos(), getTermoPorId(id)
   Use onSnapshot for real-time where appropriate (forum topics list, replies).
   Use getDocs for blog articles and glossary (less dynamic).

PHASE 2 — Hooks:
1. Create src/hooks/useBlog.ts:
   - Fetch artigos from Firestore, filter by categoria, search by titulo
   - Return: { artigos, loading, filtroCategoria, setFiltroCategoria, searchQuery, setSearchQuery }
2. Create src/hooks/useForum.ts:
   - Real-time listener (onSnapshot) on forum_topics ordered by ultimaAtividade desc
   - Functions: criarTopico, criarResposta, votar, marcarSolucao
   - Return: { topicos, loading, criarTopico, getRespostas, votar, marcarSolucao }
3. Create src/hooks/useReviews.ts:
   - Fetch reviews by marca+modelo, calculate aggregate stats
   - Return: { reviews, stats (avgRating, avgCusto, totalReviews), loading, criarReview }

PHASE 3 — UI Components:
1. Create src/components/blog/ArtigoCard.tsx:
   - Card with imagemCapa (16:9 aspect), categoria badge (use Badge from src/components/ui/Badge.tsx),
     titulo, resumo (truncated 2 lines), tempoLeitura + " min de leitura", dataCriacao formatted
   - Link to /blog/{slug}
2. Create src/components/blog/ArtigoContent.tsx:
   - Renders markdown conteudo as HTML (use simple regex-based markdown or install marked)
   - Handles YouTube embeds: detect youtubeVideoIds and render responsive iframes
   - Prose styling: max-w-prose, readable line-height, proper heading sizes
3. Create src/components/comunidade/TopicoCard.tsx:
   - Show categoria badge, titulo, autorNome + autorFoto (use UserAvatar), dataCriacao,
     respostas count, votos count, "Resolvido" badge if resolvido=true
4. Create src/components/comunidade/RespostaItem.tsx:
   - Author info, corpo (markdown rendered), vote buttons, "Aceite" badge if aceite=true
   - "Marcar como solucao" button visible only to topic author
5. Create src/components/comunidade/VoteButton.tsx:
   - Upvote/downvote arrows (ChevronUp/ChevronDown from lucide-react)
   - Current vote count between arrows. Highlight active vote.
   - Call votar() function from useForum hook
6. Create src/components/reviews/RatingStars.tsx:
   - Props: valor (number), onChange? (for input mode), readOnly?, tamanho ('sm'|'md'|'lg')
   - Use Star icon from lucide-react. Fill for active stars, stroke for inactive.
   - Hover effect in input mode
7. Create src/components/reviews/ReviewCard.tsx, ReviewForm.tsx, ModeloStats.tsx
8. Create src/components/glossario/TermoCard.tsx:
   - Simple card: termo (bold), definicao (paragraph), link to related article if exists
9. Create src/components/newsletter/NewsletterBanner.tsx:
   - Email input + "Inscrever" button. Horizontal layout on desktop, stacked on mobile.
   - Success state: "Inscricao confirmada!" with check icon
   - Validate email format before submitting

PHASE 4 — Pages:
1. Create src/pages/Blog.tsx: grid of ArtigoCard, CategoriaFilter (tabs), search bar
2. Create src/pages/BlogArtigo.tsx: fetch by slug param, render ArtigoContent, related articles
3. Create src/pages/Comunidade.tsx: list of TopicoCard, filter by categoria, "Criar Topico" button
4. Create src/pages/Topico.tsx: topic detail, list of RespostaItem, reply form at bottom
5. Create src/pages/CriarTopico.tsx: form with titulo, categoria select, corpo textarea
6. Create src/pages/Reviews.tsx: route param :marca/:modelo, ModeloStats + list of ReviewCard + ReviewForm
7. Create src/pages/Glossario.tsx: alphabetical list, search bar, TermoCard grid

PHASE 5 — Integration:
1. Update src/App.tsx: add routes:
   <Route path="/blog" element={<Blog />} />
   <Route path="/blog/:slug" element={<BlogArtigo />} />
   <Route path="/comunidade" element={<Comunidade />} />
   <Route path="/comunidade/criar" element={<CriarTopico />} />
   <Route path="/comunidade/:id" element={<Topico />} />
   <Route path="/reviews/:marca/:modelo" element={<Reviews />} />
   <Route path="/glossario" element={<Glossario />} />
   Import all new pages with lazy loading: const Blog = lazy(() => import('@/pages/Blog'))
2. Update src/components/layout/Header.tsx: add "Guias" and "Comunidade" nav links
3. Update src/components/layout/Footer.tsx: add NewsletterBanner component above footer links
4. Update src/pages/DetalhesCarro.tsx: add "Reviews do {marca} {modelo}" section with link to
   /reviews/{marca}/{modelo} showing preview of first 2-3 reviews
5. Update firestore.rules: add all security rules for new collections

IMPORTANT CONSTRAINTS:
- Keep markdown rendering simple. If installing a library, use 'marked' (lightweight).
  Do NOT install heavy editors like TipTap, Slate, or Draft.js.
- Forum votes must be idempotent: check if user already voted before allowing new vote.
  Use composite document ID format "{uid}_{targetType}_{targetId}" in forum_votes collection.
- Reviews reuse StatusAnuncio from src/types/carro.ts for moderation status.
- Blog articles are admin-only content. Forum topics/replies are user-generated.
- Use Suspense + lazy() for new page components to keep initial bundle small.
- All Firestore queries must have appropriate indexes. Document any composite indexes needed.
```
