# Plano: Servicos Financeiros

**Prioridade:** MEDIA | **Estimativa Total:** ~12-18 dias de desenvolvimento

---

## 1. Visao Geral

### O Que Resolve

Comprar um carro usado em Portugal envolve custos ocultos que muitos compradores desconhecem: IMT (Imposto Municipal sobre Transmissoes), ISV (Imposto sobre Veiculos), seguro obrigatorio, custos de transferencia, e potenciais reparacoes. O ReparAuto atualmente exibe apenas o preco de venda, sem qualquer contexto financeiro. Isto gera surpresas desagradaveis pos-compra e reduz a confianca na plataforma. Alem disso, muitos compradores dependem de financiamento e nao tem como simular parcelas diretamente no anuncio.

### Benchmark Competitivo

- **Standvirtual**: Oferece simulador de credito integrado (parceria com instituicoes financeiras) e seguro online. Nao mostra custos totais de posse.
- **AutoScout24**: Calculadora de financiamento basica, sem custos de transferencia/impostos.
- **Carwow (UK)**: Calculadora de financiamento avancada com taxas reais de parceiros. Sem equivalente em Portugal.
- **iCarros (Brasil)**: Tabela FIPE integrada com historico de valorizacao/desvalorizacao.
- **Oportunidade**: Nenhum marketplace em Portugal oferece um "simulador de custo total de posse" que combine preco + IMT + seguro estimado + reparos. Isto seria um diferenciador unico.

### Historias de Usuario

1. **Como comprador**, quero simular o custo mensal de financiamento de um carro diretamente no anuncio, para saber se cabe no meu orcamento.
2. **Como comprador**, quero ver uma estimativa do custo total de aquisicao (preco + IMT + transferencia + seguro), para evitar surpresas financeiras.
3. **Como comprador**, quero comparar o preco pedido com o valor de referencia do mercado (Eurotax/tabela de referencia), para negociar melhor.
4. **Como comprador**, quero obter uma cotacao estimada de seguro auto, para incluir no meu planeamento financeiro.
5. **Como vendedor**, quero aceitar um sinal/deposito online seguro, para garantir que compradores serios nao desistam a ultima hora.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

| # | Funcionalidade | Descricao | Prioridade |
|---|---------------|-----------|------------|
| F1 | Calculadora de financiamento | Simulador de parcelas com entrada, prazo e taxa. Widget inline no anuncio | Alta |
| F2 | Simulador de custos totais | Calculo de preco + IMT + transferencia + seguro estimado + reparos estimados | Alta |
| F3 | Tabela de referencia Eurotax | Consulta de valor de mercado por marca/modelo/ano/combustivel | Media |
| F4 | Widget de seguro auto | Cotacao estimada de seguro via parceiros ou calculo proprio | Media |
| F5 | Pagamento seguro/escrow | Deposito de sinal via Stripe Connect com retencao ate confirmacao | Baixa |

### Fluxos de Usuario

**F1 -- Calculadora de Financiamento:**
1. Comprador na pagina de detalhes (`DetalhesCarro.tsx`) ve seccao "Simular Financiamento"
2. Preco do carro ja esta pre-preenchido
3. Ajusta: entrada (slider ou input, default 20%), prazo (12-84 meses), taxa de juro (default 7.9% TAEG)
4. Ve em tempo real: parcela mensal, total de juros, custo total com juros
5. Botao "Partilhar simulacao" gera link ou envia por email

**F2 -- Simulador de Custos Totais:**
1. Na pagina de detalhes, seccao "Quanto vai custar no total?"
2. Campos pre-preenchidos: preco do anuncio, ano do carro, combustivel, cilindrada (se disponivel)
3. Calculo automatico: IMT (tabela oficial por escalao), custos de transferencia (~55 euros fixo), seguro estimado (por escalao de cilindrada/idade)
4. Se carro tem `estadoVeiculo === 'manutencao'` e `orcamentoTexto`, extrai valor numerico para somar como "Custos de reparacao estimados"
5. Total final: preco + IMT + transferencia + seguro anual estimado + reparos

**F3 -- Tabela de Referencia:**
1. Widget na pagina de detalhes mostrando "Valor de referencia: X euros - Y euros"
2. Baseado em dados internos: media de precos de carros similares (mesma marca, modelo, faixa de ano, combustivel) ja vendidos/anunciados no ReparAuto
3. Se nao houver dados suficientes, mostra "Dados insuficientes para estimativa"
4. Progresso futuro: integrar API Eurotax quando disponivel

**F4 -- Widget de Seguro:**
1. Seccao "Seguro Auto Estimado" na pagina de detalhes
2. Calculo basico: idade do carro x tipo de combustivel x localizacao -> faixa de preco anual
3. Tabela de referencia interna com precos medios de seguro em Portugal
4. Botao "Obter cotacao real" -> link afiliado para comparador (ex: Deco Proteste, ComparaJa)

**F5 -- Pagamento Escrow (Fase Futura):**
1. Vendedor ativa opcao "Aceitar sinal online" no anuncio
2. Comprador clica "Dar sinal de X euros" -> redirecionado para Stripe Checkout
3. Valor retido em conta Stripe Connect do vendedor (nao transferido imediatamente)
4. Apos confirmacao presencial: vendedor confirma, valor e libertado
5. Se desistencia: comprador pode pedir reembolso dentro de 48h

### Requisitos de UI/UX

- Calculadoras devem ser interativas com sliders e inputs numericos, resultados em tempo real
- Valores monetarios formatados com `formatarPreco()` existente (XX.XXX euros)
- IMT e custos devem ter tooltips explicativos ("O que e o IMT?")
- Cores: usar accent color para valores de destaque, vermelho para custos adicionais
- Mobile-first: calculadoras devem funcionar bem em ecras pequenos (colunas empilhadas)
- Escrow: badge "Aceita Sinal Online" visivel no card do carro na listagem

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/detalhes/FinanceCalculator.tsx` | Widget de calculadora de financiamento com sliders |
| `src/components/detalhes/TotalCostSimulator.tsx` | Simulador de custo total de aquisicao |
| `src/components/detalhes/InsuranceWidget.tsx` | Widget de estimativa de seguro auto |
| `src/components/detalhes/MarketValueBadge.tsx` | Badge/widget de valor de referencia de mercado |
| `src/lib/finance.ts` | Logica de calculo: financiamento, IMT, custos totais |
| `src/lib/insurance.ts` | Tabelas de referencia de seguro e calculo de estimativa |
| `src/lib/imt-tables.ts` | Tabelas oficiais de IMT por escalao (Portugal) |
| `src/types/finance.ts` | Tipos: FinanceSimulation, TotalCostBreakdown, InsuranceEstimate |
| `src/hooks/useFinanceCalculator.ts` | Hook para estado e logica da calculadora de financiamento |
| `src/components/detalhes/EscrowButton.tsx` | Botao e fluxo de pagamento de sinal (fase futura) |

### Modificacoes em Arquivos Existentes

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/DetalhesCarro.tsx` | Adicionar secoes FinanceCalculator, TotalCostSimulator, InsuranceWidget, MarketValueBadge abaixo da descricao |
| `src/types/carro.ts` | Adicionar campos opcionais: `cilindrada?: number`, `aceitaSinal?: boolean`, `valorSinal?: number` |
| `src/components/detalhes/StatusPanel.tsx` | Mostrar badge "Aceita Sinal" se `carro.aceitaSinal === true` |
| `src/components/anunciar/StepPreco.tsx` | Adicionar toggle "Aceitar sinal online" com campo de valor do sinal |
| `src/components/home/CarCard.tsx` | Mostrar parcela estimada no card ("desde X euros/mes") se preco > 3000 |
| `src/lib/utils.ts` | Adicionar `formatarParcela(valor: number): string` e `extrairValorNumerico(texto: string): number | null` |
| `src/lib/constants.ts` | Adicionar constantes: `TAXA_JURO_DEFAULT`, `IMT_ISENTO_LIMITE`, `CUSTO_TRANSFERENCIA` |

### Colecoes Firestore (schema)

```
// Collection: cars (campos adicionais ao documento existente)
{
  ...campos_existentes,
  cilindrada?: number,       // Cilindrada em cc (ex: 1900 para 1.9 TDI)
  aceitaSinal?: boolean,     // Aceita deposito de sinal online
  valorSinal?: number,       // Valor do sinal em euros
}

// Nova Collection: escrow_transactions (apenas se F5 for implementada)
{
  id: string,
  carroId: string,
  compradorUid: string,
  vendedorUid: string,
  valor: number,
  stripePaymentIntentId: string,
  status: 'pendente' | 'confirmado' | 'reembolsado' | 'libertado',
  dataCriacao: Timestamp,
  dataAtualizacao: Timestamp,
}

// Nova Collection: market_prices (referencia interna de precos)
{
  id: string,
  marca: string,
  modelo: string,
  anoMin: number,
  anoMax: number,
  combustivel: string,
  precoMin: number,
  precoMax: number,
  precoMedio: number,
  totalAmostras: number,
  dataAtualizacao: Timestamp,
}
```

### Regras de Seguranca Firestore

```
// firestore.rules -- adicionar novas colecoes

match /escrow_transactions/{txId} {
  allow read: if isAuthenticated() && (
    request.auth.uid == resource.data.compradorUid ||
    request.auth.uid == resource.data.vendedorUid
  );
  allow create: if isAuthenticated() && request.resource.data.compradorUid == request.auth.uid;
  allow update: if isAdmin() || (
    isAuthenticated() && request.auth.uid == resource.data.vendedorUid &&
    resource.data.status == 'pendente' &&
    request.resource.data.status in ['confirmado', 'libertado']
  );
  allow delete: if false; // Nunca apagar transacoes
}

match /market_prices/{priceId} {
  allow read: if true; // Publico
  allow write: if isAdmin(); // Apenas admin pode atualizar tabelas
}
```

### APIs/Servicos Externos

| Servico | Uso | Custo |
|---------|-----|-------|
| Stripe Connect (fase futura) | Pagamento de sinal/escrow | 1.4% + 0.25 euros por transacao (Europa) |
| ComparaJa / Deco Proteste | Link afiliado para seguro | Comissao por lead (variavel) |
| API de IMT (Autoridade Tributaria) | Calculo oficial de IMT | Gratuito (tabelas publicas, implementar client-side) |
| Nenhuma API externa para F1-F4 | Calculos feitos localmente | Gratuito |

### Componentes React Principais

**FinanceCalculator:**
- Props: `preco: number`, `className?: string`
- Estado: `entrada` (%), `prazo` (meses), `taxaJuro` (%)
- Calculo: parcela = (capital * taxa_mensal) / (1 - (1 + taxa_mensal)^-prazo) (formula Price)
- UI: 3 sliders com labels, resultado em destaque, tabela resumo

**TotalCostSimulator:**
- Props: `carro: Carro`
- Calcula automaticamente IMT (baseado em preco, ano, combustivel), custo de transferencia (fixo ~55 euros), seguro estimado, reparos estimados
- UI: lista de itens de custo com valores, total em destaque na parte inferior

**MarketValueBadge:**
- Props: `marca: string`, `modelo: string`, `ano: number`, `combustivel: string`, `precoAtual: number`
- Consulta colecao `market_prices` ou calcula a partir dos carros existentes na app
- UI: badge inline "Valor de mercado: 5.000 - 7.000 euros" com cor verde/amarelo/vermelho conforme o preco do anuncio

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Funcionalidade | Frontend | Backend/Config | Total |
|---------------|----------|---------------|-------|
| F1: Calculadora financiamento | 2 dias | 0 | 2 dias |
| F2: Simulador custos totais | 3 dias | 0.5 dia (tabelas IMT) | 3.5 dias |
| F3: Tabela de referencia | 2 dias | 1 dia (colecao + seed) | 3 dias |
| F4: Widget de seguro | 1.5 dias | 0.5 dia (tabelas) | 2 dias |
| F5: Pagamento escrow | 4 dias | 3 dias (Stripe + rules) | 7 dias |
| **Total** | **12.5 dias** | **5 dias** | **~17.5 dias** |

### Avaliacao de Valor

- **Impacto no utilizador:** MUITO ALTO. Transparencia financeira e a maior queixa de compradores de carros usados. O simulador de custos totais pode ser o diferenciador #1 do ReparAuto.
- **Diferenciacao competitiva:** ALTO. Nenhum marketplace em Portugal oferece simulacao de custo total de posse (preco + IMT + seguro + reparos).
- **Conversao de vendas:** ALTO. Compradores informados sobre custos totais tomam decisoes mais rapidas.
- **Monetizacao futura:** ALTO. Links afiliados de seguro e financiamento sao fontes de receita sem custo para o utilizador.
- **Risco tecnico:** BAIXO para F1-F4 (calculos client-side). MEDIO para F5 (integracao Stripe requer conta verificada).

### Posicao na Matriz

**Quadrante: Alto Valor / Esforco Medio-Alto**

F1 (calculadora) e F2 (custos totais) devem ser priorizados por serem 100% client-side e de alto impacto. F5 (escrow) deve ser adiado para uma fase posterior por requerer integracao com Stripe Connect e compliance PSD2.

---

## 5. Decisoes de Arquitetura

### Decisao 1: Gateway de Pagamento para Escrow

**Contexto:** Para o sistema de sinal/deposito seguro, necessidade de um gateway que suporte retencao de fundos e libertacao condicional.

| Opcao | Pros | Contras |
|-------|------|---------|
| **Stripe Connect** | API madura, suporta escrow nativo (PaymentIntents com capture manual), PSD2 compliant, popular em Portugal | Requer verificacao de conta de vendedor (KYC), 1.4%+0.25 euros por transacao, precisa de backend (Cloud Functions) |
| **MBWay/Multibanco (via ifthenpay/Eupago)** | Metodo de pagamento preferido em Portugal, taxas baixas | Nao suporta escrow nativo, so pagamento direto. Precisaria de conta intermediaria propria |
| **PayPal** | Suporte a escrow (Adaptive Payments descontinuado, mas Managed Payments existe), familiar | API complexa, taxas mais altas (3.4%+0.35 euros), experiencia UX menos polida |

**Recomendacao:** **Stripe Connect** com capture manual. Permite reter o pagamento do sinal e so capturar quando o vendedor confirma a venda presencial. E a unica opcao que suporta verdadeiro escrow sem conta intermediaria propria. MBWay pode ser adicionado como metodo de pagamento dentro do Stripe (via SEPA Direct Debit), mas nao como alternativa ao escrow. Nota: requer Firebase Cloud Functions para webhooks do Stripe (nao pode ser 100% client-side).

### Decisao 2: Estrategia de Seguro

**Contexto:** Fornecer ao comprador uma estimativa de custo de seguro auto para o veiculo que esta a ver.

| Opcao | Pros | Contras |
|-------|------|---------|
| **API de parceiro especifico** (Fidelidade, Tranquilidade) | Cotacoes reais e atualizadas, potencial de monetizacao direta | Integracao complexa, dependencia de parceiro, aprovacao demorada, requer dados pessoais do comprador |
| **Comparador de seguros** (ComparaJa, Deco Proteste) | Cotacoes de multiplas seguradoras, link afiliado simples | Redireciona o utilizador para fora da plataforma, sem controlo sobre UX |
| **Tabela interna de estimativas** | 100% client-side, sem dependencia externa, privacidade total | Valores aproximados (nao sao cotacoes reais), requer atualizacao manual periodica |

**Recomendacao:** **Tabela interna de estimativas** com link afiliado para comparador. Fase 1: usar uma tabela simplificada (por faixa de cilindrada x idade do carro x tipo de combustivel) para mostrar "Seguro estimado: 250-400 euros/ano". Fase 2: adicionar botao "Obter cotacao real no ComparaJa" como link afiliado. Esta abordagem respeita a privacidade (nenhum dado pessoal e enviado), e rapida de implementar, e gera receita via afiliacao.

---

## 6. Prompt de Implementacao

```
You are implementing the "Financial Services" feature set for ReparAuto, a Portuguese used-car marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase. All UI text must be in Portuguese (PT-PT). Code, comments, and variable names in English. Use @/ import alias.

## Context

The project uses:
- React 19 with Context API + custom hooks (no Redux/Zustand)
- Tailwind CSS v4 with theme in src/index.css (@theme)
- Firestore for data, Firebase Storage for images
- Existing car type at src/types/carro.ts: Carro interface with preco, marca, modelo, anoFabricacao, combustivel, estadoVeiculo, orcamentoTexto fields
- Car details page at src/pages/DetalhesCarro.tsx: renders TechnicalSheet, StatusPanel, ContactSection, GalleryModal
- Price formatting utility: src/lib/utils.ts -> formatarPreco(valor) returns "X.XXX €"
- Existing StatusPanel at src/components/detalhes/StatusPanel.tsx shows price + contact buttons
- Constants at src/lib/constants.ts: CONCELHOS, TIPOS_COMBUSTIVEL, etc.
- Car card at src/components/home/CarCard.tsx shows car info in the listing grid

## Task 1: Finance Calculator Widget

Create src/components/detalhes/FinanceCalculator.tsx:

1. Props: preco (number from Carro.preco).
2. State: entrada (number, default 20% of preco), prazo (number, default 48 months), taxaJuro (number, default 7.9 representing 7.9% TAEG).
3. Calculate monthly payment using the Price formula (French amortization): parcela = (capital * taxaMensal) / (1 - (1 + taxaMensal)^(-prazo)) where capital = preco - entrada, taxaMensal = taxaJuro / 100 / 12.
4. UI: Three input rows, each with a label, a range slider, and a number input:
   - "Entrada": slider 0% to 80% of preco, step 5%, show value in €
   - "Prazo": slider 12 to 84 months, step 6, show "X meses"
   - "Taxa de Juro (TAEG)": slider 3.0% to 15.0%, step 0.1%
5. Results section: "Parcela mensal: X €" in large accent-colored text. Below: "Total de juros: X €", "Custo total com juros: X €" in smaller text.
6. Disclaimer text: "Simulação meramente indicativa. Consulte a sua instituição financeira para condições reais."
7. Wrap in a card with rounded-2xl, shadow, matching the style of TechnicalSheet component (bg-slate-50, border-slate-200).
8. Only show this widget if preco > 1000 (no point financing a 500€ car).

Create src/lib/finance.ts with pure functions:
- calculateMonthlyPayment(principal: number, annualRate: number, months: number): number
- calculateTotalInterest(principal: number, monthlyPayment: number, months: number): number
- calculateIMT(preco: number, anoFabricacao: number, combustivel: string): number

Create src/types/finance.ts with interfaces:
- FinanceSimulation { entrada, prazo, taxaJuro, parcelaMensal, totalJuros, custoTotal }
- TotalCostBreakdown { preco, imt, transferencia, seguroAnual, reparosEstimados, total }
- InsuranceEstimate { minAnual, maxAnual, faixa }

## Task 2: Total Cost Simulator

Create src/components/detalhes/TotalCostSimulator.tsx:

1. Props: carro (Carro type).
2. Calculate automatically:
   - IMT: Use official Portuguese IMT tables. For used cars (not new): 0% if preco <= 500€; 2% for 500-2500€; 5% for 2500-5000€; 7% for 5000-10000€; 8% for 10000-20000€; rates vary by year. Store table in src/lib/imt-tables.ts.
   - Transfer cost: fixed value of 55.00€ (registering ownership transfer at Conservatória).
   - Estimated insurance: calculate from src/lib/insurance.ts based on age of car and fuel type. Ranges: petrol <5yo: 400-600€; petrol 5-10yo: 300-450€; petrol >10yo: 200-350€; diesel similar but +10%. Electric: -15%.
   - Estimated repairs: if carro.estadoVeiculo === 'manutencao' AND carro.orcamentoTexto exists, attempt to extract a numeric value (look for patterns like "250€", "180 euros", "120EUR"). Use a regex in src/lib/utils.ts -> extrairValorNumerico(texto: string): number | null. If not found, show "Reparações: valor desconhecido".
3. UI: A breakdown list showing each cost line item with its value, and a total line at the bottom in bold accent color. Each line item should have a small (i) tooltip icon explaining what that cost is.
4. Add constants to src/lib/constants.ts: CUSTO_TRANSFERENCIA = 55, IMT_ISENTO_LIMITE = 500.
5. Show this below the FinanceCalculator on the details page.

Create src/lib/imt-tables.ts:
- Export function calculateIMT(preco: number, tipo: 'usado' | 'novo', combustivel: string): number
- Use simplified PT IMT brackets for used vehicles (Tabela II of Código do IMT).

## Task 3: Market Value Reference

Create src/components/detalhes/MarketValueBadge.tsx:

1. Props: marca, modelo, anoFabricacao, combustivel, precoAtual (all from Carro).
2. Calculate market reference by querying the local carros array from context (useApp().carros.carros) and filtering cars with same marca AND similar anoFabricacao (±3 years) AND same combustivel.
3. If fewer than 3 matching cars found, show nothing (insufficient data).
4. If 3+ matches: calculate min, max, and average price. Show a badge:
   - If precoAtual < average * 0.8: green badge "Abaixo do valor médio de mercado"
   - If precoAtual between average * 0.8 and average * 1.2: yellow badge "Dentro do valor médio de mercado"
   - If precoAtual > average * 1.2: red badge "Acima do valor médio de mercado"
5. Show the range: "Referência: X € — Y € (baseado em N anúncios similares)"
6. Place this badge near the price in DetalhesCarro.tsx, below the main price display.

## Task 4: Insurance Estimate Widget

Create src/components/detalhes/InsuranceWidget.tsx:

1. Props: carro (Carro type).
2. Create src/lib/insurance.ts with function estimateInsurance(anoFabricacao: number, combustivel: string): { min: number, max: number }.
3. Calculation logic: base ranges by fuel type and age bracket (see Task 2 for ranges). Add 15% for diesel (higher repair costs), subtract 15% for electric.
4. UI: Small card showing "Seguro Auto Estimado: X € — Y € / ano" with a car insurance icon.
5. Link: "Obter cotação real" button that opens comparaja.pt in a new tab (target="_blank").
6. Disclaimer: "Valores estimados com base em médias de mercado. O valor real depende do perfil do condutor e cobertura escolhida."

## Task 5: Integration in DetalhesCarro.tsx

Modify src/pages/DetalhesCarro.tsx to integrate all new widgets:

1. After the description section and before ContactSection, add a new section "Informação Financeira" with icon fa-solid fa-calculator.
2. Inside this section, render in order:
   - MarketValueBadge (inline, near the price area at the top)
   - TotalCostSimulator (full width card)
   - FinanceCalculator (full width card, only if preco > 1000)
   - InsuranceWidget (smaller card, inline)
3. Each widget should be conditionally rendered and handle missing data gracefully.
4. All widgets are read-only for the viewer (no data saved to Firestore).

## Important Implementation Notes

- All calculations are 100% client-side. No Cloud Functions needed for F1-F4.
- IMT tables should be accurate for Portugal 2024/2025 fiscal year. Source: https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cimt/
- Use formatarPreco() from src/lib/utils.ts for all monetary displays.
- Sliders should use Tailwind styling (accent-colored thumb via accent-accent class).
- All new components go in src/components/detalhes/ since they are part of the car details page.
- Add the cilindrada optional field to Carro interface in src/types/carro.ts but do NOT make it required (backward compatibility).
- Do NOT implement Stripe integration yet (F5). Only create the UI placeholder with a "Em breve" badge.
- The finance calculator hook (src/hooks/useFinanceCalculator.ts) should use useCallback for memoized calculations and expose all state + setters.
```
