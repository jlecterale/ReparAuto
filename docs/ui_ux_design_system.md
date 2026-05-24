# Design System e UI/UX - ReparAuto

A ReparAuto posiciona-se no mercado de carros de entrada (*low-cost*) e viaturas seminovas/usadas. O design deve transmitir **confiança, transparência, durabilidade e economia**, alinhando-se com a usabilidade familiar de gigantes como Bring a Trailer (foco no conteúdo e transparência) e OLX/Standvirtual (simplicidade de utilização).

---

## 1. Guia de Estilo (Style Guide)

### 1.1 Tipografia
A plataforma utiliza a **Inter** (do Google Fonts) como fonte primária para todo o sistema. É altamente legível em ecrãs pequenos e densos em informação (como ficha técnica de viaturas).
- **Cabeçalhos (H1-H3):** `Inter ExtraBold` ou `Bold` para transmitir solidez.
- **Corpo e Detalhes:** `Inter Regular` e `Medium`.

### 1.2 Paleta de Cores
O esquema de cores deve inspirar confiança utilitária. O laranja queimado será a cor de destaque, associado a trabalho, reparação e pechinchas.

- **Primary Action (Laranja Queimado):** `#E55B2B` (Hover: `#C44A1F`). Usado *exclusivamente* para Call-to-Actions (Comprar, Publicar Anúncio).
- **Backgrounds (Fundos):** `#F8FAFC` (Cinza muito claro azulado, relaxante para a vista) e `#FFFFFF` (para cartões/cards).
- **Text & UI Base (Brand Colors):**
  - Textos principais: `#0F172A` (Slate 900) - Um preto-azulado suave.
  - Textos secundários: `#64748B` (Slate 500).
- **Cores de Estado Semânticas:**
  - Sucesso/Pronto para rodar: `#10B981` (Emerald) ou green shades.
  - Alerta/Precisa manutenção: `#F59E0B` (Amber) - Usado para assinalar a necessidade de reparos.
  - Perigo/Avaria Grave: `#EF4444` (Red) - Usado para avarias muito severas ou danos estruturais.

### 1.3 Formas e Sombras
- **Bordas Arredondadas (Border Radius):** 
  - Cartões e imagens: `16px` (`rounded-2xl` no Tailwind) para suavizar a experiência.
  - Botões e Badges: `9999px` (`rounded-full`) para clicabilidade orgânica.
- **Sombras (Shadows):** 
  - Cards normais usam uma sombra leve (`shadow-sm`).
  - No hover (quando o rato passa por cima), usa-se uma elevação notória (`shadow-xl` + deslocamento `-translate-y-1`) para criar uma sensação tátil de interatividade.

---

## 2. Design System: Componentes Críticos (UI Kit)

### 2.1 Botão Primário com Feedback Tátil
Um botão desenhado para as ações mais importantes.

```html
<!-- Componente Botão Primário (Tailwind CSS) -->
<button class="bg-[#E55B2B] hover:bg-[#C44A1F] text-white font-bold py-3 px-6 rounded-full shadow-md hover:shadow-lg transform transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-orange-300 flex items-center justify-center gap-2">
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
  Publicar Anúncio
</button>
```

### 2.2 Badges de Estado e Transparência
Badges flutuantes por cima das imagens dos carros para classificar instantaneamente o veículo.
- **Pronto para rodar:** `<span class="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">✅ Pronto</span>`
- **Precisam de Reparos:** `<span class="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">🔧 Reparos</span>`

### 2.3 Cartão de Veículo (Car Card)
O cartão é o elemento central do marketplace. Focado na hierarquia: Preço > Fotografia > Informação Técnica.

```html
<!-- Componente Cartão de Carro (Tailwind CSS) -->
<article class="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100 group relative">
  <!-- Imagem com Aspect Ratio e Badge -->
  <div class="relative aspect-[4/3] bg-slate-200 overflow-hidden">
    <img src="placeholder.jpg" alt="Viatura" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
    
    <div class="absolute top-3 left-3">
      <span class="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-1 rounded-full border border-amber-200 shadow-sm backdrop-blur-sm bg-opacity-90">⚠️ Precisa Reparação</span>
    </div>
    
    <!-- Microinteração: Botão Favorito -->
    <button class="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm focus:outline-none" aria-label="Adicionar aos Favoritos">
      <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    </button>
  </div>
  
  <!-- Info Corpo -->
  <div class="p-4">
    <div class="flex justify-between items-start mb-1">
      <h3 class="font-bold text-slate-900 line-clamp-1">Volkswagen Golf IV 1.9 TDI</h3>
    </div>
    <p class="text-2xl font-extrabold text-[#E55B2B] mb-3">900 €</p>
    
    <!-- Meta Dados -->
    <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
      <span class="bg-slate-100 px-2 py-1 rounded">280.000 km</span>
      <span>•</span>
      <span>Diesel</span>
      <span>•</span>
      <span>Coimbra</span>
    </div>
  </div>
</article>
```

---

## 3. Microinterações e Animações
Para conferir a personalidade de uma plataforma moderna:
- **Coração Favorito:** Ao favoritar um anúncio, o ícone transita para um preenchido de vermelho vibrante, com um pequeno efeito de salto (*spring animation*).
- **Skeleton Loading:** Antes de carregar as fotos ou as informações dos carros, os cards mostram caixas cinza pulsantes (shimmer effect `animate-pulse`), mantendo a estabilidade do layout (evita CLS - Cumulative Layout Shift).

---

## 4. Layouts Base

### 4.1 Home Page (Mobile-First)
- **Barra de Pesquisa (Sticky Top):** Fixa no topo. Sincronizada entre mobile e desktop.
- **Chips de Filtro Horizontais:** Logo abaixo da pesquisa, um carrossel horizontal de filtros rápidos ("Destaques Low-Cost", "Qualquer Valor", "Até 500€", "Até 1.000€", "Precisam de Reparos").
- **Grelha de Oportunidades:** Cartões organizados em grelhas flexíveis.

### 4.2 Detalhe do Carro (Transparência Máxima)
A página de detalhe divide-se em blocos:
1. **Galeria Full-Width (Mobile):** Imagens do carro, focando nas áreas gerais e possíveis reparos.
2. **Ficha Técnica Organizadora:** Grelha de fácil leitura com dados de ano de fabricação, modelo, km, cor, combustível, câmbio, portas e concelho.
3. **Caixa de Estado & Manutenção (Crucial):** Uma zona colorida estruturada:
   - Fundo verde agradável se o veículo estiver pronto para circular.
   - Fundo laranja com listagem de tipos de manutenção afetados e visualização do orçamento preexistente opcional (respeitando privacidade de contactos do mecânico) se precisar de manutenção.
4. **Botões de Ação:** Contacto direto ao vendedor e favoritos.

---

## 5. Metas de Qualidade e Performance (Standards)

1. **Core Web Vitals "Verde" & Lighthouse:**
   - **LCP (Largest Contentful Paint):** < 2.5s. As imagens primárias da listagem são leves e otimizadas.
   - **FID (First Input Delay):** < 100ms. JavaScript otimizado sem bloqueios extensos da Main Thread.
   - **CLS (Cumulative Layout Shift):** < 0.1. O uso de proporções e dimensões de layout coerentes impede saltos visuais.
2. **Acessibilidade (WCAG 2.1 AA):**
   - Rácio de contraste da cor laranja (`#E55B2B`) face ao fundo branco/cinza verificado (4.5:1).
   - Elementos focáveis contêm contornos claros para navegação por teclado, suportando focus trapping para modais ativos.
3. **SEO Técnico (Structured Data):**
   - Utilização de JSON-LD Schema.org tipo `Vehicle` (Carro) dinâmico.
