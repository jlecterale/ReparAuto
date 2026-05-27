# Plano 12 — Internacionalizacao e SEO

> **Prioridade:** MEDIA
> **Estimativa total:** 8-11 dias de desenvolvimento
> **Dependencias:** Nenhuma dependencia estrita, mas beneficia-se do plano de Comunidade/Conteudo (10) para ter mais paginas indexaveis

---

## 1. Visao Geral

### O Que Resolve

O ReparAuto tem atualmente dois problemas criticos de visibilidade:

**Problema 1 — SEO inexistente:** A aplicacao usa HashRouter (`/#/detalhes/abc123`), o que significa que motores de busca como o Google veem apenas uma unica pagina (a raiz). Nao ha meta tags dinamicas, structured data, ou sitemap. Quando um anuncio e compartilhado no WhatsApp ou Facebook, aparece apenas "ReparAuto - Loja de Carros Usados" sem a imagem ou descricao do carro especifico. Isso reduz drasticamente o trafego organico e a taxa de cliques em links compartilhados.

**Problema 2 — Idioma unico:** O site esta apenas em portugues europeu (PT-PT). Nao ha suporte para outros idiomas, o que limita o alcance a imigrantes em Portugal (brasileiros, ucranianos, etc.) e inviabiliza uma futura expansao para outros mercados.

Este plano resolve ambos os problemas, alem de adicionar analytics com conformidade RGPD e botoes de compartilhamento social.

### Benchmark Competitivo

| Plataforma | Meta Tags Dinamicas | Structured Data | Sitemap | i18n | Multi-moeda | URLs Amigas | Analytics |
|---|---|---|---|---|---|---|---|
| **Standvirtual** | Sim | Sim | Sim | PT/EN | EUR only | Sim | Sim (RGPD) |
| **OLX** | Sim | Sim | Sim | Multi | Multi | Sim | Sim (RGPD) |
| **AutoScout24** | Sim | Sim | Sim | 18 idiomas | Multi | Sim | Sim (RGPD) |
| **ReparAuto (atual)** | Nao (estaticas) | Nao | Nao | PT-PT only | EUR only | Nao (hash) | Nao |
| **ReparAuto (proposto)** | Sim | Sim | Sim | PT-PT/PT-BR/EN | EUR/BRL | Sim | Sim (RGPD) |

### Historias de Usuario

1. **Como vendedor**, quero que quando eu compartilho o meu anuncio no WhatsApp, apareca a foto do carro, o preco e a descricao — nao apenas o nome generico do site.
2. **Como potencial comprador**, quero encontrar carros no Google pesquisando "carro usado barato Porto" e ver resultados do ReparAuto com rich snippets (preco, foto, localizacao).
3. **Como brasileiro a viver em Portugal**, quero usar o ReparAuto em portugues do Brasil para me sentir mais confortavel.
4. **Como visitante estrangeiro**, quero ver os precos tambem em reais (BRL) para ter referencia do valor.
5. **Como dono do site**, quero ter analytics para entender o trafego, as paginas mais visitadas e o comportamento dos usuarios, em conformidade com o RGPD.
6. **Como usuario do Facebook/Twitter**, quero que os links do ReparAuto aparecam com preview visual rico (Open Graph / Twitter Cards).

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

| # | Funcionalidade | Descricao | Complexidade |
|---|---|---|---|
| F1 | Meta tags e Open Graph dinamicos | Titulo, descricao e imagem por pagina/anuncio | Media |
| F2 | Structured data (JSON-LD) | Schema.org Vehicle para carros, Product para pecas | Media |
| F3 | Sitemap.xml dinamico | Geracao a partir de anuncios aprovados | Media |
| F4 | Framework i18n | Suporte multi-idioma (PT-PT, PT-BR, EN) | Alta |
| F5 | Multi-moeda | Conversao EUR/BRL com taxa atualizada | Baixa |
| F6 | URLs amigas | Migracao de HashRouter para BrowserRouter | Media |
| F7 | Compartilhamento social | Botoes WhatsApp, Facebook, Twitter/X, copiar link | Baixa |
| F8 | Google Analytics + RGPD | Analytics com banner de consentimento de cookies | Media |

### Fluxos de Usuario

**Fluxo 1 — Compartilhamento Social com Preview:**
1. Vendedor publica anuncio de "Renault Clio 2007 - 600EUR - Braga"
2. Compartilha link no WhatsApp/Facebook
3. Plataforma recebe requisicao do crawler (WhatsApp/Facebook)
4. Prerender service retorna HTML com meta tags:
   - og:title: "Renault Clio 1.5 dCi 2007 — 600€ | ReparAuto"
   - og:description: "Viatura comercial com alguns problemas de motor..."
   - og:image: URL da primeira foto do anuncio
5. WhatsApp/Facebook mostra preview rico com imagem, titulo e descricao
6. Destinatario clica → abre pagina de detalhes do anuncio

**Fluxo 2 — Descoberta via Google:**
1. Potencial comprador pesquisa "peugeot 206 usado Porto"
2. Google encontra o anuncio no sitemap.xml e via structured data
3. Resultado mostra rich snippet: titulo, preco (€450), localizacao (Porto), foto thumbnail
4. Usuario clica → abre pagina de detalhes com URL amigavel (/detalhes/peugeot-206-1.1-2004)
5. Google ve JSON-LD com schema Vehicle: brand, model, mileage, price, location

**Fluxo 3 — Troca de Idioma:**
1. Usuario brasileiro acessa o ReparAuto
2. Detecta automaticamente idioma do navegador (pt-BR) ou ve seletor de idioma no header
3. Clica em "Portugues (Brasil)" no seletor
4. Toda a interface muda: "Pecas" → "Pecas", "Telemóvel" → "Celular", "Viatura" → "Veiculo"
5. Preferencia salva em localStorage e mantida nas proximas visitas
6. Conteudo gerado por usuarios (anuncios) permanece no idioma original

**Fluxo 4 — Consentimento RGPD:**
1. Primeiro acesso ao site: banner de cookies aparece na parte inferior
2. Opcoes: "Aceitar todos", "Rejeitar nao essenciais", "Personalizar"
3. Se aceitar: Google Analytics ativado, preferencia salva
4. Se rejeitar: apenas cookies essenciais (auth, localStorage), sem analytics
5. Link para Politica de Privacidade (ja existe em src/pages/PoliticaPage.tsx)
6. Pode alterar preferencias a qualquer momento (link no footer)

### Requisitos de UI/UX

- **Seletor de idioma:** dropdown discreto no Header (flag do pais + abreviacao). No mobile, acessivel via menu hamburger. Icone Globe (lucide-react).
- **Seletor de moeda:** ao lado do idioma. Toggle simples EUR/BRL. Precos convertidos em tempo real com indicacao "(~R$ XXX)".
- **Banner de cookies:** fixo na parte inferior. Fundo brand-800 com texto branco. Botoes em accent (aceitar) e outline (rejeitar/personalizar). Nao bloqueia scroll. Z-index acima de tudo.
- **Botoes de compartilhamento:** na pagina de detalhes, grupo horizontal de icones: WhatsApp (verde), Facebook (azul), Twitter/X (preto), copiar link (cinza). Tooltip com nome da rede.
- **Rich preview:** quando compartilhado, o link deve mostrar imagem 1200x630 do primeiro foto do anuncio, titulo com marca/modelo/preco, descricao truncada em 160 chars.

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Arquivo | Descricao |
|---|---|
| `src/lib/i18n.ts` | Configuracao do i18next com deteccao de idioma |
| `src/locales/pt-PT.json` | Traducoes portugues europeu (base) |
| `src/locales/pt-BR.json` | Traducoes portugues brasileiro |
| `src/locales/en.json` | Traducoes ingles |
| `src/components/layout/LanguageSelector.tsx` | Dropdown de selecao de idioma |
| `src/components/layout/CurrencyToggle.tsx` | Toggle de moeda EUR/BRL |
| `src/components/seo/MetaTags.tsx` | Componente para injetar meta tags dinamicas |
| `src/components/seo/JsonLd.tsx` | Componente para injetar structured data JSON-LD |
| `src/components/seo/ShareButtons.tsx` | Botoes de compartilhamento social |
| `src/components/rgpd/CookieBanner.tsx` | Banner de consentimento de cookies |
| `src/hooks/useCurrency.ts` | Hook para conversao de moeda e preferencia |
| `src/hooks/useCookieConsent.ts` | Hook para gestao de consentimento RGPD |
| `src/lib/analytics.ts` | Inicializacao condicional do Google Analytics |
| `src/lib/currency.ts` | Logica de conversao de moeda e formatacao |
| `src/lib/seo.ts` | Helpers para gerar meta tags e JSON-LD |
| `scripts/generate-sitemap.ts` | Script para gerar sitemap.xml a partir do Firestore |
| `public/robots.txt` | Regras para crawlers |

### Modificacoes em Arquivos Existentes

| Arquivo | Modificacao |
|---|---|
| `vite.config.ts` | Nenhuma (se mantiver HashRouter) ou configurar historyApiFallback (se migrar para BrowserRouter) |
| `package.json` | Adicionar dependencias: react-i18next, i18next, i18next-browser-languagedetector, react-helmet-async |
| `index.html` | Adicionar og:site_name, twitter:card meta tags estaticas como fallback |
| `src/App.tsx` | Envolver com HelmetProvider; se migrar para BrowserRouter, trocar HashRouter |
| `src/components/layout/Header.tsx` | Adicionar LanguageSelector e CurrencyToggle |
| `src/components/layout/Footer.tsx` | Adicionar link "Gerir cookies" |
| `src/pages/DetalhesCarro.tsx` | Adicionar MetaTags, JsonLd e ShareButtons |
| `src/pages/Pecas.tsx` | Adicionar MetaTags para pagina de pecas |
| `src/pages/Home.tsx` | Adicionar MetaTags para pagina inicial |
| `src/components/home/CarCard.tsx` | Usar traducoes i18n para textos estaticos (se houver) |
| `src/lib/firebase.ts` | Inicializar Analytics condicionalmente apos consentimento |
| `src/lib/constants.ts` | Mover textos hardcoded da UI para chaves i18n |

### Colecoes Firestore

Nenhuma nova colecao e necessaria para este plano. O sitemap e gerado a partir das colecoes existentes (`cars`, `parts`) e servido como arquivo estatico.

Opcao: se implementar conversao de moeda em tempo real, pode-se usar uma colecao `config` para armazenar a taxa de cambio atualizada periodicamente por Cloud Function:

```typescript
// Documento unico em colecao 'config'
interface ConfigCambio {
  id: 'exchange_rates';
  EUR_BRL: number;        // taxa EUR → BRL
  dataAtualizacao: Timestamp;
}
```

### Regras de Seguranca Firestore

```
// Config — apenas admin pode escrever, todos podem ler
match /config/{configId} {
  allow read: if true;
  allow write: if isAdmin();
}
```

### APIs/Servicos Externos

| Servico | Uso | Custo |
|---|---|---|
| **react-helmet-async** | Meta tags dinamicas no client-side | Gratuito (biblioteca) |
| **prerender.io** | Renderizar HTML estatico para crawlers (WhatsApp, Google) | Gratuito ate 250 paginas/mes; $15/mes para 5000 |
| **i18next** | Framework de internacionalizacao | Gratuito (biblioteca) |
| **Google Analytics 4** | Analytics com consentimento RGPD | Gratuito |
| **ExchangeRate-API** | Taxa de cambio EUR/BRL | Gratuito ate 1500 req/mes |
| **Firebase Hosting** | Rewrite rules para prerendering ou BrowserRouter | Ja utilizado |

### Componentes React Principais

**MetaTags.tsx:**
- Props: `titulo?: string`, `descricao?: string`, `imagem?: string`, `url?: string`, `tipo?: string`
- Usa react-helmet-async para injetar no `<head>`:
  - `<title>`, `<meta name="description">`
  - `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
  - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- Defaults: titulo="ReparAuto — Carros Usados em Portugal", imagem=logo, tipo="website"
- Na pagina de detalhes: titulo=`${marca} ${modelo} ${ano} — ${preco}€ | ReparAuto`

**JsonLd.tsx:**
- Props: `data: Record<string, any>`
- Renderiza `<script type="application/ld+json">` no head via Helmet
- Helper `carroToVehicleSchema(carro: Carro)`: mapeia para schema.org/Vehicle
  - @type: "Vehicle", name, brand, model, mileageFromOdometer, offers.price, offers.priceCurrency
- Helper `pecaToProductSchema(peca: Peca)`: mapeia para schema.org/Product

**CookieBanner.tsx:**
- Renderiza banner fixo no bottom da tela
- 3 botoes: "Aceitar todos" (bg-accent), "Rejeitar" (outline), "Personalizar" (text link)
- Estado salvo em localStorage (key: 'reparauto_cookie_consent')
- Valores: 'all' | 'essential' | { analytics: boolean, marketing: boolean }
- Quando 'all' ou analytics=true → inicializar Google Analytics via src/lib/analytics.ts
- Nao mostra mais se ja consentiu (verifica localStorage no mount)

**LanguageSelector.tsx:**
- Dropdown com 3 opcoes: PT-PT (bandeira Portugal), PT-BR (bandeira Brasil), EN (bandeira UK/US)
- Usa i18next.changeLanguage() ao selecionar
- Bandeiras como emojis ou pequenos SVGs
- No mobile: icone Globe que abre modal com opcoes

**ShareButtons.tsx:**
- Props: `url: string`, `titulo: string`, `descricao: string`, `imagem?: string`
- Botoes inline com icones:
  - WhatsApp: `https://wa.me/?text=${encodeURIComponent(titulo + ' ' + url)}`
  - Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  - Twitter/X: `https://twitter.com/intent/tweet?text=${encodeURIComponent(titulo)}&url=${encodeURIComponent(url)}`
  - Copiar link: navigator.clipboard.writeText(url) com toast "Link copiado!"
- Usa navigator.share() quando disponivel (mobile) como opcao principal

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Funcionalidade | Esforco (dias) | Complexidade | Risco |
|---|---|---|---|
| Meta tags + Open Graph | 1.5 | Media | Baixo |
| Structured data (JSON-LD) | 1 | Media | Baixo |
| Sitemap.xml | 1 | Media | Medio |
| Framework i18n | 3 | Alta | Medio |
| Multi-moeda | 0.5 | Baixa | Baixo |
| URLs amigas (BrowserRouter) | 1.5 | Media | Alto |
| Compartilhamento social | 0.5 | Baixa | Baixo |
| Analytics + RGPD | 1.5 | Media | Baixo |
| **Total** | **10.5** | | |

### Avaliacao de Valor

- **Meta tags + Open Graph:** Valor MUITO ALTO. Impacto imediato na qualidade de links compartilhados no WhatsApp (principal canal de compartilhamento em Portugal). Essencial para viralidade organica.
- **Structured data:** Valor ALTO. Rich snippets no Google aumentam CTR em 20-30%. Essencial para trafego organico de longo prazo.
- **i18n:** Valor MEDIO. Amplia o publico-alvo (comunidade brasileira em Portugal e ~300k pessoas), mas o mercado primario continua sendo falantes de portugues.
- **URLs amigas:** Valor ALTO para SEO, mas RISCO ALTO pela migracao de HashRouter. Requer configuracao de hosting para SPA fallback.
- **Analytics:** Valor ALTO. Sem analytics, nao ha dados para tomar decisoes de produto. Essencial para qualquer negocio digital.

### Posicao na Matriz

```
         ALTO VALOR
              |
   Quick Win  |  Projeto Estrategico
  (meta tags, |  (i18n, URLs)
   share,     |
   analytics) |
  BAIXO ------+------ ALTO ESFORCO
              |
  Descartavel |  Projeto Grande
              |
         BAIXO VALOR
```

**Posicao: Majoritariamente Quick Wins com um Projeto Estrategico (i18n).** As funcionalidades de SEO (meta tags, JSON-LD, sitemap) e analytics sao de implementacao rapida e impacto imediato. O framework i18n e mais trabalhoso mas abre portas para expansao futura.

**Ordem recomendada de implementacao:**
1. Meta tags + Open Graph + Share buttons (impacto imediato no WhatsApp)
2. Analytics + RGPD (comecar a colher dados o mais cedo possivel)
3. Structured data + Sitemap (SEO de medio prazo)
4. URLs amigas (se confirmada a necessidade)
5. i18n + Multi-moeda (expansao futura)

---

## 5. Decisoes de Arquitetura

### Decisao 1: Manter HashRouter vs Migrar para BrowserRouter

**Contexto:** O ReparAuto usa HashRouter (React Router 7) o que significa que todas as URLs contem `#` (ex: `https://reparauto.pt/#/detalhes/abc`). Isso impede que crawlers do Google indexem paginas individuais e que previews do WhatsApp/Facebook funcionem corretamente, ja que a maioria dos crawlers ignora o fragmento hash.

| Opcao | Pros | Contras |
|---|---|---|
| **Manter HashRouter** | Nenhuma alteracao no hosting; deploy simples; sem risco de quebra; sem necessidade de server-side fallback | SEO impossivel sem prerender; crawlers nao veem paginas internas; previews de WhatsApp sempre genericos |
| **Migrar para BrowserRouter** | URLs limpas (/detalhes/abc); SEO nativo; crawlers veem cada pagina; previews ricos; padrao da industria | Requer configuracao de rewrite no Firebase Hosting (firebase.json); links antigos (com #) precisam de redirect; risco de 404 se mal configurado |

**Recomendacao:** **Migrar para BrowserRouter com prerender para crawlers.** A migracao em si e simples no codigo (trocar `<HashRouter>` por `<BrowserRouter>` em `src/App.tsx`). O Firebase Hosting ja suporta SPA rewrites nativamente — basta adicionar `"rewrites": [{ "source": "**", "destination": "/index.html" }]` no `firebase.json`. Para garantir que crawlers vejam conteudo renderizado, usar prerender.io como middleware ou, alternativamente, configurar Firebase Hosting com dynamic rendering. Se a migracao for considerada arriscada a curto prazo, manter HashRouter e usar prerender.io exclusivamente para crawlers e uma alternativa viavel.

### Decisao 2: react-intl (ICU standard) vs i18next (mais popular) vs Solucao Caseira

**Contexto:** O projeto precisa de um framework de internacionalizacao para suportar pelo menos 3 idiomas (PT-PT, PT-BR, EN). As traducoes devem ser faceis de manter e o framework deve se integrar bem com React 19.

| Opcao | Pros | Contras |
|---|---|---|
| **react-intl (FormatJS)** | Padrao ICU (industria); excelente formatacao de numeros/datas/plurais; mantido pelo Yahoo/Meta; tipagem forte | Sintaxe ICU mais verbosa; menos plugins que i18next; comunidade menor; curva de aprendizado maior |
| **i18next + react-i18next** | Mais popular (4M+ downloads/semana); enorme ecossistema de plugins; deteccao automatica de idioma; lazy loading de traducoes; interpolacao simples; excelente documentacao | Formatacao de numeros/datas menos sofisticada que ICU; bundle maior se muitos plugins |
| **Solucao caseira** | Zero dependencias; totalmente customizado; bundle minimo | Precisa reimplementar interpolacao, plurais, deteccao de idioma; nao escalavel; propenso a bugs |

**Recomendacao:** **i18next + react-i18next.** Para o escopo do ReparAuto (3 idiomas, textos de UI relativamente simples), i18next oferece o melhor equilibrio entre funcionalidade e simplicidade. O plugin `i18next-browser-languagedetector` detecta automaticamente o idioma do navegador. As traducoes podem ser carregadas sob demanda (lazy) para nao impactar o bundle inicial. A diferenca de formatacao para o react-intl nao e relevante neste caso de uso.

### Decisao 3: react-helmet-async vs Prerender.io vs SSR Parcial

**Contexto:** Para que meta tags Open Graph funcionem em links compartilhados, os crawlers precisam ver o HTML renderizado. Como o ReparAuto e uma SPA, o HTML inicial nao contem meta tags dinamicas. Tres abordagens existem para resolver isso.

| Opcao | Pros | Contras |
|---|---|---|
| **react-helmet-async (apenas)** | Simples de implementar; funciona para Google (renderiza JS); sem custo; sem infra adicional | Nao funciona para crawlers que nao executam JS (WhatsApp, Facebook, Twitter, LinkedIn) — estes veem apenas as meta tags estaticas do index.html |
| **prerender.io** | Resolve completamente o problema; serve HTML pre-renderizado para crawlers; facil de configurar com Firebase Hosting; funciona com HashRouter e BrowserRouter | Custo ($15/mes para 5000 paginas); dependencia externa; latencia adicional para crawlers; pode ficar desatualizado se cache nao for gerido |
| **SSR parcial (Cloud Functions)** | Controle total; dados sempre frescos; sem custo externo; funciona perfeitamente | Complexidade alta; precisa de Node.js server rendering; cold start do Cloud Functions; contradiz a arquitetura SPA do projeto; manutenção significativa |

**Recomendacao:** **react-helmet-async + prerender.io.** Abordagem em duas camadas: react-helmet-async para Google (que renderiza JS) e para melhorar o `<title>` na aba do navegador, combinado com prerender.io para servir HTML completo a crawlers de redes sociais (WhatsApp, Facebook, Twitter). O prerender.io se integra trivialmente com Firebase Hosting via Cloud Functions como middleware. O custo de $15/mes e justificado pelo impacto em compartilhamento social. Alternativamente, para comecar sem custo, usar apenas react-helmet-async e aceitar que previews de WhatsApp serao genericos ate implementar prerendering.

---

## 6. Prompt de Implementacao

```
You are implementing internationalization (i18n) and SEO features for ReparAuto, a Portuguese
used-car and parts marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase.

PROJECT CONTEXT:
- Vite 8 bundler with config at vite.config.ts (uses @tailwindcss/vite plugin, @/ alias,
  base: './', outDir: 'dist')
- React Router 7 with HashRouter in src/App.tsx — wraps AppProvider > ToastProvider > layout
- Firebase SDK in src/lib/firebase.ts: exports auth, db, storage. Project: reparauto-site,
  measurementId: 'G-MTSTFD5MJ5'
- Entry point: index.html (lang="pt-PT") with static meta title/description, loads Inter font
  from Google Fonts and Font Awesome from CDN
- Types: Carro (src/types/carro.ts) with marca, modelo, anoFabricacao, preco, km, local,
  descricao, fotos[], status. Peca (src/types/peca.ts) with titulo, categoria, preco,
  marcaCarro, estado, local, descricao, foto?, status.
- Pages: Home.tsx, DetalhesCarro.tsx, Anunciar.tsx, Pecas.tsx, Perfil.tsx, SetupPerfil.tsx,
  Admin.tsx, PoliticaPage.tsx (all in src/pages/)
- Layout: Header.tsx, Footer.tsx, BottomNav.tsx (src/components/layout/)
- Existing UI text is all in Portuguese (PT-PT) hardcoded in JSX
- Constants in src/lib/constants.ts: CONCELHOS, TIPOS_COMBUSTIVEL, CATEGORIAS_PECAS, etc.
- All UI text in Portuguese. Code/comments/variables in English.
- Import alias: @/ always (maps to src/). No relative imports.
- Tailwind utility classes only. Brand colors: brand-50 to brand-900. Accent: #e55b2b.
- Icons: lucide-react (already installed). Also uses Font Awesome 6.5 via CDN.
- Firebase Hosting configured. Deploy script: "vite build && firebase deploy --only hosting"

TASK 1 — Meta Tags & Open Graph (react-helmet-async):
1. Install react-helmet-async: add to package.json dependencies
2. Update src/App.tsx: wrap entire app with <HelmetProvider> (outermost wrapper)
3. Create src/components/seo/MetaTags.tsx:
   - Props: { titulo?: string, descricao?: string, imagem?: string, url?: string, tipo?: string }
   - Uses <Helmet> to set:
     <title>{titulo} | ReparAuto</title>
     <meta name="description" content={descricao} />
     <meta property="og:title" content={titulo} />
     <meta property="og:description" content={descricao} />
     <meta property="og:image" content={imagem} />
     <meta property="og:url" content={url || window.location.href} />
     <meta property="og:type" content={tipo || 'website'} />
     <meta property="og:site_name" content="ReparAuto" />
     <meta name="twitter:card" content="summary_large_image" />
     <meta name="twitter:title" content={titulo} />
     <meta name="twitter:description" content={descricao} />
     <meta name="twitter:image" content={imagem} />
   - Defaults: titulo="Carros Usados e Pecas em Portugal",
     descricao="Marketplace de carros usados, pecas e servicos automoveis em Portugal",
     imagem="/og-default.png"
4. Add MetaTags to key pages:
   - src/pages/Home.tsx: default meta tags
   - src/pages/DetalhesCarro.tsx: dynamic — titulo: `${carro.marca} ${carro.modelo}
     ${carro.anoFabricacao} — ${carro.preco}€`, descricao: carro.descricao (first 160 chars),
     imagem: carro.fotos[0] (if URL, not emoji), tipo: 'product'
   - src/pages/Pecas.tsx: titulo: "Pecas Automoveis", descricao about parts marketplace
5. Update index.html: add fallback og: meta tags for pages not yet hydrated

TASK 2 — Structured Data (JSON-LD):
1. Create src/components/seo/JsonLd.tsx:
   - Props: { data: Record<string, unknown> }
   - Renders <Helmet><script type="application/ld+json">{JSON.stringify(data)}</script></Helmet>
2. Create src/lib/seo.ts with helper functions:
   - carroToVehicleSchema(carro: Carro): returns schema.org/Vehicle object:
     { "@context": "https://schema.org", "@type": "Vehicle", name: `${marca} ${modelo}`,
       brand: { "@type": "Brand", name: marca }, model: modelo,
       vehicleModelDate: String(anoFabricacao),
       mileageFromOdometer: { "@type": "QuantitativeValue", value: km, unitCode: "KMT" },
       fuelType: combustivel, vehicleTransmission: cambio, color: cor,
       numberOfDoors: portas, description: descricao,
       offers: { "@type": "Offer", price: preco, priceCurrency: "EUR",
                 availability: "https://schema.org/InStock",
                 seller: { "@type": "Person", name: vendedorNome } },
       image: fotos.filter(f => f.startsWith('http')),
       vehicleCondition: estadoVeiculo === 'pronto' ? 'UsedCondition' : 'DamagedCondition' }
   - pecaToProductSchema(peca: Peca): returns schema.org/Product object:
     { "@context": "https://schema.org", "@type": "Product", name: titulo,
       category: categoria, description: descricao,
       offers: { "@type": "Offer", price: preco, priceCurrency: "EUR" },
       brand: { "@type": "Brand", name: marcaCarro } }
3. Add JsonLd to src/pages/DetalhesCarro.tsx: <JsonLd data={carroToVehicleSchema(carro)} />
4. Add JsonLd to individual peca detail views if they exist

TASK 3 — Sitemap Generation:
1. Create scripts/generate-sitemap.ts:
   - Uses Firebase Admin SDK to query 'cars' and 'parts' collections where status == 'aprovado'
   - Generates sitemap.xml with:
     - Static pages: /, /pecas, /anunciar (or /#/ equivalents if still HashRouter)
     - Dynamic pages: /detalhes/{id} for each approved car, /pecas/{id} if detail pages exist
     - Each entry: <url><loc>, <lastmod>, <changefreq>, <priority>
   - Writes to dist/sitemap.xml (post-build step)
   - Also generates robots.txt: Allow: /, Sitemap: https://reparauto-site.web.app/sitemap.xml
2. Update package.json scripts: add "postbuild": "tsx scripts/generate-sitemap.ts"
3. Create public/robots.txt with basic rules

TASK 4 — i18n Setup (i18next):
1. Install: i18next, react-i18next, i18next-browser-languagedetector
2. Create src/lib/i18n.ts:
   - Initialize i18next with:
     - resources: { 'pt-PT': { translation: ptPT }, 'pt-BR': { translation: ptBR },
       'en': { translation: en } }
     - lng: detected or 'pt-PT' (default)
     - fallbackLng: 'pt-PT'
     - detection: { order: ['localStorage', 'navigator'], lookupLocalStorage: 'reparauto_lang' }
     - interpolation: { escapeValue: false } (React already escapes)
3. Create translation files in src/locales/:
   - pt-PT.json: base file with ALL UI strings currently hardcoded in components
     Key structure: { "nav": { "home": "Inicio", "parts": "Pecas", "advertise": "Anunciar",
     "profile": "Perfil", "admin": "Admin" }, "home": { "hero_title": "Encontre o seu
     proximo carro", "hero_subtitle": "...", "filter_all": "Todos", ... },
     "details": { "price": "Preco", "year": "Ano", "km": "Quilometros", ... },
     "common": { "loading": "A carregar...", "error": "Erro", "save": "Guardar",
     "cancel": "Cancelar", "delete": "Eliminar", "search": "Pesquisar", ... } }
   - pt-BR.json: override only strings that differ (e.g., "Telemóvel"→"Celular",
     "Viatura"→"Veiculo", "A carregar"→"Carregando", "Eliminar"→"Excluir",
     "Pesquisar"→"Buscar", "Guardar"→"Salvar", "Cancelar" stays the same)
   - en.json: full translation to English
4. Import i18n.ts in src/main.tsx (before React render)
5. Update key components to use useTranslation() hook:
   - Start with Header.tsx, Footer.tsx, BottomNav.tsx (navigation labels)
   - Then Home.tsx (hero, filters), CarCard.tsx (labels)
   - Then DetalhesCarro.tsx, Pecas.tsx
   - Use t('key') for all static UI text. Keep user-generated content (anuncio descriptions) as-is.

TASK 5 — Currency Support:
1. Create src/lib/currency.ts:
   - EXCHANGE_RATES: { EUR_BRL: 6.10 } (hardcoded default, can be updated)
   - convertPrice(preco: number, from: 'EUR', to: 'BRL'): number
   - formatPrice(preco: number, moeda: 'EUR' | 'BRL'): string
     — EUR: "€600" or "600 €" (Portuguese format)
     — BRL: "R$ 3.660"
2. Create src/hooks/useCurrency.ts:
   - State: moeda ('EUR' | 'BRL'), saved in localStorage key 'reparauto_currency'
   - Functions: toggleCurrency(), formatPreco(preco: number): string
   - Optionally fetch live rate from free API on mount (ExchangeRate-API or similar)
3. Create src/components/layout/CurrencyToggle.tsx:
   - Simple toggle button: "€ EUR" / "R$ BRL"
   - Uses useCurrency hook
4. Update price displays in CarCard.tsx, DetalhesCarro.tsx to show secondary currency
   in parentheses: "600 € (~R$ 3.660)" when BRL selected

TASK 6 — Share Buttons:
1. Create src/components/seo/ShareButtons.tsx:
   - Props: { url: string, titulo: string, descricao?: string }
   - Horizontal button group with:
     a) WhatsApp: <a href="https://wa.me/?text=..."> with WhatsApp icon (fa-brands fa-whatsapp)
     b) Facebook: <a href="https://facebook.com/sharer/sharer.php?u=..."> with FB icon
     c) Twitter/X: <a href="https://twitter.com/intent/tweet?text=...&url=..."> with X icon
     d) Copy link: button with Link icon (lucide-react), onClick copies URL to clipboard,
        shows toast "Link copiado!" via ToastProvider
   - On mobile: also show navigator.share() button if available (Share2 icon)
   - Styling: icon buttons, each with brand color of the social network, rounded, hover effect
2. Add ShareButtons to src/pages/DetalhesCarro.tsx:
   - Place near the top of the detail page or next to favorites button
   - url: window.location.href
   - titulo: `${carro.marca} ${carro.modelo} ${carro.anoFabricacao} — ${carro.preco}€`

TASK 7 — Google Analytics + RGPD Cookie Banner:
1. Create src/hooks/useCookieConsent.ts:
   - Manages consent state in localStorage (key: 'reparauto_cookie_consent')
   - Values: null (not yet decided), 'all', 'essential', { analytics: boolean }
   - Returns: { consent, acceptAll(), rejectNonEssential(), showBanner: boolean }
2. Create src/components/rgpd/CookieBanner.tsx:
   - Fixed bottom bar: bg-brand-800 text-white, rounded-t-xl, shadow-2xl
   - Text: "Utilizamos cookies para melhorar a sua experiencia. Consulte a nossa
     Politica de Privacidade."
   - Buttons: "Aceitar todos" (bg-accent), "Apenas essenciais" (outline white), link to
     /privacidade (existing PoliticaPage)
   - Only renders when consent === null
   - Z-index: above BottomNav (z-50 or higher)
3. Create src/lib/analytics.ts:
   - initAnalytics(): imports firebase/analytics, calls getAnalytics(app)
   - logPageView(pagePath: string): logs page_view event
   - Only initializes if consent includes analytics
4. Update src/App.tsx:
   - Add CookieBanner component (rendered inside layout, fixed position)
   - After consent, initialize analytics
   - Log page views on route changes (useLocation + useEffect)
5. Update src/components/layout/Footer.tsx: add "Gerir cookies" link that resets consent
   state to null (re-shows banner)

TASK 8 — URL Migration (Optional — BrowserRouter):
NOTE: This task is optional and has the highest risk. Only implement if explicitly requested.
1. Update src/App.tsx: replace <HashRouter> with <BrowserRouter>
2. Update vite.config.ts: remove base: './' (use default '/')
3. Create/update firebase.json: add hosting rewrite rule:
   { "hosting": { "rewrites": [{ "source": "**", "destination": "/index.html" }] } }
4. Handle legacy hash URLs: add redirect logic in App.tsx that detects window.location.hash
   starting with '#/' and uses navigate() to redirect to the clean path
5. Update all internal links if any use hash-based paths (search codebase for '/#/')
6. Test: all routes must work on direct access (refresh) and navigation

IMPORTANT CONSTRAINTS:
- Do NOT modify existing UI text directly. Use i18n keys and the translation files.
  The pt-PT.json should contain the exact current Portuguese text as values.
- Keep all user-generated content (anuncio descriptions, messages) untranslated — i18n
  only applies to UI chrome (labels, buttons, navigation, static text).
- The Firebase measurementId 'G-MTSTFD5MJ5' is already in src/lib/firebase.ts config.
  Use it for Google Analytics initialization.
- For the sitemap generator, use Firebase Admin SDK in a Node.js script (not client-side).
  This script runs at build time only, not in the browser.
- react-helmet-async MUST be used (not react-helmet which is not compatible with React 19).
- All price formatting must respect locale: PT uses "600 €" (space before €), not "$600".
- The CookieBanner must comply with EU RGPD: no analytics before explicit consent.
- If keeping HashRouter, sitemap URLs should still use clean paths (assume prerender
  or future migration). Add a comment noting this.
- Translation files should be organized by page/feature namespace for maintainability.
```
