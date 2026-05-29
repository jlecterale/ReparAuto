# 17. Monetização B2B: Profissionais + Intenção de Compra

**Versão**: 1.0  
**Data**: Maio 2026  
**Autor**: Estratégia de Negócio  
**Status**: Planning

---

## 🎯 Objetivo Estratégico

Implementar um modelo de monetização B2B robusto que:
- ✅ Monetiza profissionais (oficinas, mecânicos) sem impactar compradores
- ✅ Cria receita via leads qualificados (matchmaking reverso)
- ✅ Expande receita através de serviços premium de valor acrescentado
- ✅ Integra parcerias com instituições financeiras e seguradoras
- ✅ Mantém UX limpa e sem intrusões para utilizadores comuns

**Visão**: ReparAuto não é apenas uma plataforma de transações — é um **ecossistema B2B completo** onde profissionais, lojas e instituições financeiras geram negócio continuamente.

---

## 📊 Modelo de Monetização: 4 Pilares

### Pilar 1: Assinatura Premium para Profissionais

#### A) Oficinas e Mecânicos — "Oficina Verificada"

**Tier**: Assinatura Mensal  
**Preço**: €15–25/mês  
**Público**: Oficinas, borracharias, eletricistas, funileiros, centros de suspensão, etc.

**O que está incluído**:
- ✅ Selo **"Oficina Verificada"** visível em todos os resultados
- ✅ Prioridade na busca geográfica (topo da lista no raio de km)
- ✅ Catálogo ilimitado de serviços com fotos
- ✅ Dashboard básico com estatísticas (impressões, cliques, orçamentos recebidos)
- ✅ Confirmação de horário de funcionamento (com notificação automática se offline)
- ✅ Badge de reputação em tempo real (média de avaliações)
- ✅ Chat integrado direto (não precisa de créditos para responder)

**Fluxo de Utilizador**:
1. Oficina completa perfil + envios documento comprovante residência
2. Após verificação de admin → ganha selo + acesso premium
3. Paga €20/mês via Stripe/PayPal
4. Sai do "Buscar Profissional" gratuito → vai para topo dos resultados premium
5. Recebe orçamentos via chat integrado (sem limite)
6. Pode editar catálogo de serviços em tempo real

**Motivação para o Profissional**:
- Visibilidade garantida (topo da busca dentro do raio)
- Lead geração contínua sem pagar por cada lead
- Reputação crescente = mais clientes naturalmente
- Diferenciação vs. concorrentes não verificados

#### B) Cascata de Tiers Futuros (Roadmap)

| Tier | Preço | Features Adicionais | Target |
|------|-------|--------------------|--------|
| **Verificado** (Básico) | €15–25/mês | Selo + Top de busca | PMEs / Mecânicos Independentes |
| **Premium** | €50/mês | + Anúncios patrocinados (5 por mês) + Relatório semanal + Suporte prioritário | Oficinas Médias (5–10 funcionários) |
| **Enterprise** | €100/mês | + Anúncios ilimitados + API para integrações + Relatórios custom + Gestor de contas | Grandes Redes / Concessionárias |

---

### Pilar 2: Pay-Per-Lead (Desbloqueio de Contactos)

#### A) Modelo de Créditos / Micro Transação

**Cenário**: Um cliente solicita um orçamento de reparação. A oficina que não paga assinatura premium pode responder, **mas precisa de gastar 1 crédito (€1–2)** para "desbloquear" o contacto direto no chat.

**Fluxo**:
1. Comprador publica: "Preciso de mudança de óleo no meu VW Golf VII"
2. Múltiplas oficinas gratuitas e premium veem a solicitação
3. Oficina Premium: Responde **grátis** no chat (já pagou assinatura)
4. Oficina Gratuita: Vê a solicitação → clica "Responder" → sistema avisa: "1 crédito (€1.50) para contactar este cliente"
5. Oficina decide: pagar ou passar

**Modelo de Créditos**:
- €1 = 1 lead qualificado
- Pack de 10 créditos = €12 (2% desconto)
- Pack de 50 créditos = €55 (10% desconto)
- Pack de 100 créditos = €100 (17% desconto) — renovação automática

**Protecção de Qualidade**:
- ✅ Taxa de abandono (oficina não responde em 2h) = crédito reembolsado
- ✅ Cliente pode denunciar "Resposta inadequada" = crédito reembolsado ao vendedor + aviso ao profissional
- ✅ Limite de spam: máximo 1 resposta por solicitação por profissional (evita que 10 oficinas gastam 10 créditos cada)

**Receita Estimada**:
- Se 500 oficinas (30% gratuitas, 20% premium)
- 350 oficinas gratuitas → média 2 leads/mês @ €1.50 = €1.050/mês
- Total anual: €12.600 (conservador; scale a 2000 oficinas = €50k+)

---

### Pilar 3: Publicidade Local Geolocalizada

#### A) Banners de Anúncios Patrocinados por Região

**Conceito**: Oficinas podem comprar espaço publicitário que aparece **apenas** para utilizadores numa região específica (ex: distrito, concelho, raio de 10km).

**Implementação**:
- ✅ Slot de banner no topo da página "Buscar Profissional" (1 banner patrocinado por região)
- ✅ Segmentação: distrito, concelho, raio de 10/25/50km
- ✅ Duração: campanha de 7/30/90 dias
- ✅ Criativo: até 3 imagens, CTA customizado (ex: "Mudança de Óleo — Hoje -15%")

**Preço**:
- **Micro-campanha**: €50/semana (1 região, 1 selo/comarca)
- **Regional**: €150/mês (inteiro distrito)
- **Nacional**: €500/mês (todas as regiões)

**Exemplo de ROI para Oficina**:
- Gasto: €150/mês
- Impressões esperadas: ~5.000 (utilizadores que procuram profissionais naquela região)
- CTR esperado: 2% = 100 cliques
- Taxa conversão: 5% = 5 orçamentos solicitados
- Ticket médio reparação: €120
- Conversão final: 40% = 2 clientes confirmados
- Faturação: 2 × €120 = €240/mês → ROI 60% apenas naquele mês

**Receita Estimada** (roadmap mensais 3–6):
- Se 100 oficinas gastam €150/mês = €15.000/mês
- Anual: €180.000

---

### Pilar 4: Acesso Antecipado a Leads (Early Access Bundle)

#### A) Assinatura Premium para Lojas — "Priority Access"

**Cenário**: Quando um comprador publica uma **Intenção de Compra** (ex: "Procuro Golf VII Diesel até €15.000"), lojas premium recebem notificação **exclusiva com 24h de vantagem** antes de lojas gratuitas.

**Fluxo**:
1. Comprador publica Intenção de Compra (grátis)
2. Sistema gera **notificação imediata** para todas as lojas com "Priority Access" (€50/mês)
3. Lojas Premium têm **24 horas de exclusividade** para contactar
4. Passadas 24h, a intenção é visível a todas as lojas gratuitas
5. Lojas Gratuitas podem pagar **€3 por lead** para "abrir o chat" antes das 24h

**Preço Priority Access para Lojas**:
- €50/mês (unlock todas as intenções antes dos concorrentes + dashboard com histórico)
- Alternativa avulsa: €5 por intenção individual (para lojas pequenas)

**Impacto**:
- Lojas premium enchem stock 24h antes dos concorrentes
- Lojas gratuitas podem "pular fila" com micro transação
- Compradores veem resposta mais rápida (melhor UX)

**Receita Estimada**:
- Se 200 lojas + 50 stands pagam €50/mês = €12.500/mês
- Lojas gratuitas: 500 lojas × 1 "jump" por mês @ €3 = €1.500/mês
- Total: €14.000/mês = €168.000/ano

---

### Pilar 5: Serviços de Valor Acrescentado

#### A) Relatórios de Histórico do Veículo (Parceria CarVertical/Carfax)

**Integração**: Via API com CarVertical ou Carfax  
**Fluxo**:
1. Vendedor (loja ou particular) lista um carro
2. Sistema oferece: "Adicionar Relatório de Histórico? €5 (verificado)"
3. Vendedor clica → API CarVertical gera relatório
4. Relatório anexado ao anúncio (com badge "História Verificada")
5. Anúncios com relatório: **50% mais visualizações, 30% mais rápido para vender**

**Modelo de Receita**:
- ReparAuto compra relatório @ €3 → revende @ €5
- Margem: €2 por relatório

**Previsão**:
- Se 1000 anúncios/mês usam relatório @ €2 margem = €2.000/mês
- Anual: €24.000

---

#### B) Destaques Avulsos (Bumping)

**Oferecido a Todos** (com ou sem assinatura):

| Serviço | Preço | O que faz | Duração |
|---------|-------|----------|---------|
| **Bump** (Subir para topo) | €2 | Recoloca anúncio como se tivesse publicado hoje | 1 dia |
| **Destaque Gold** | €9.90 | Carro com borda dourada + topo da categoria | 7 dias |
| **Destaque Platinum** | €19.90 | Gold + badge "Premium" + topo de busca + featured na home | 30 dias |
| **Pacote Anual** | €99 | 1 bump/semana + 1 destaque gold/mês + featured Home | 12 meses |

**Fluxo**:
1. Vendedor vê anúncio a perder visualizações (algoritmo detecta)
2. UI sugere: "Destaque por €2 para mais visibilidade?"
3. 1-click checkout
4. Anúncio volta ao topo + badge visual

**Receita Estimada**:
- Se 30% dos 5000 anúncios activos usam bump €2 = €3.000/mês
- Se 10% usam Destaque Gold €9.90 = €4.950/mês
- Total: €7.950/mês = €95.400/ano

---

### Pilar 6: Parcerias Estratégicas (Lead Generation B2B)

#### A) Simulador de Financiamento Automóvel

**Parceiros**: Bancos, intermediários de crédito (ex: Credibom, Banco CTT, Caixa Geral)

**Fluxo**:
1. Comprador visualiza carro na página de detalhes
2. Widget integrado: "Simular Crédito para este carro"
3. Comprador preenche: valor, prazo, rendimento
4. Sistema valida (score básico)
5. Se lead qualificada → redirecionada ao banco parceiro
6. Banco aprova crédito? ReparAuto recebe comissão

**Modelo de Comissão**:
- **CPL (Cost Per Lead)**: €5–10 por lead qualificada (banco paga imediatamente)
- **CPS (Cost Per Sale)**: 1–2% do valor do crédito aprovado (ao banco ganhar dinheiro)

**Previsão**:
- Se 100 leads/mês @ €7.50 médio (CPL) = €750/mês = €9.000/ano
- Se 10% convertem em crédito aprovado (~€15.000 médio) @ 1.5% = €2.250/ano
- **Total: €11.250/ano** (conservador — pode ser €50k+ com múltiplos bancos)

**Implementação técnica**:
```javascript
// No arquivo src/components/detalhes/FinanciamentoWidget.tsx
<SimuladorFinanciamento
  carroPreco={carro.preco}
  onLeadGerada={(lead) => {
    // Track event para analytics
    analytics.track('lead_financiamento', lead);
    // Enviar para API do banco parceiro
    redirectToPartnerBank(lead);
  }}
/>
```

---

#### B) Simulador de Seguro Automóvel

**Parceiros**: Seguradoras (ex: Allianz, Fidelidade, Tranquilidade, Zurich)

**Fluxo**:
1. Widget similar a financiamento: "Simular Seguro"
2. Comprador preenche: cobertura, frota, condutor principal
3. Redirecionado para portal segurador
4. Se subscrição → ReparAuto recebe comissão

**Modelo de Comissão**:
- **CPL**: €3–5 por lead
- **CPS**: 2–5% da primeira apólice

**Previsão**:
- Se 150 leads/mês @ €4 = €600/mês = €7.200/ano
- Se 5% convertem @ €50/primeira apólice (comissão) = €375/ano
- **Total: €7.575/ano**

---

## 💰 Impacto Financeiro Consolidado

### Receita Mensal por Pilar (Conservador / Realista / Optimista)

| Pilar | Conservador | Realista | Optimista |
|-------|------------|----------|-----------|
| **1. Assinatura Profissionais** | €2.000 | €6.000 | €15.000 |
| **2. Pay-Per-Lead (Créditos)** | €1.000 | €3.000 | €8.000 |
| **3. Publicidade Regional** | €1.000 | €10.000 | €25.000 |
| **4. Priority Access (Lojas)** | €5.000 | €14.000 | €30.000 |
| **5. Valor Acrescentado** | €500 | €2.000 | €5.000 |
| **6. Parcerias B2B (Financ+Seguros)** | €500 | €1.500 | €5.000 |
| **TOTAL/MÊS** | **€10.000** | **€36.500** | **€88.000** |
| **TOTAL/ANO** | **€120.000** | **€438.000** | **€1.056.000** |

### Breakdown de Custos (Implementação)

| Componente | Dev Hours | Custo (€150/h) | Observações |
|------------|-----------|----------------|-------------|
| Dashboard Premium (Profissionais) | 40h | €6.000 | CRUD serviços, stats |
| Sistema de Créditos (Pagamento) | 60h | €9.000 | Stripe integration, ledger |
| Publicidade Geolocalizada | 50h | €7.500 | Mapa + campaing builder |
| Priority Access (Notificações) | 35h | €5.250 | FCM, Redis queue |
| Simuladores (Financ + Seguros) | 45h | €6.750 | 2 integrações, webhooks |
| Relatórios Histórico Veículo | 20h | €3.000 | API CarVertical |
| **TOTAL** | **250h** | **€37.500** | **2–3 meses, 1–2 devs** |

---

## 🎨 Impacto na UX (Zero Intrusão para Compradores)

### ✅ O que NÃO Muda para Compradores

- ❌ Sem pop-ups intrusivos
- ❌ Sem paywalls
- ❌ Sem limite de visualizações
- ❌ Sem parar o scroll com ads
- ❌ Sem aumentar latência das páginas

### ✅ O que MUDA (Positivo)

| Alteração | Benefício | Exemplos |
|-----------|-----------|----------|
| Selo "Oficina Verificada" | Mais confiança na busca | Mecânicos com selo aparecem claramente |
| Notificação de Oferta Rápida | Melhor UX de resposta | Recebe resposta em <1h via chat |
| Relatório de Histórico | Comprador confiante | Badge "História Verificada" reduz dúvidas |
| Simulador de Financiamento | Solução integrada | "Posso financiar isto?" respondido aqui |

### UI Mockups (Pseudocódigo)

**1. Page: Buscar Profissional** (Premium aparece em destaque)
```
┌─ Filtros Geolocalização ─────────────────┐
│ Raio: [10km] 🔍                          │
└──────────────────────────────────────────┘

🔝 PREMIUM (Assinatura)
┌─────────────────────────────────┐
│ 🏅 AutoRepair Centro Verificado │
│ ⭐ 4.9 (152 reviews)            │
│ 📍 5.2 km away | ✅ Online      │
│ 🔧 Mudança Óleo • Pneus • Freios│
└─────────────────────────────────┘

GRATUITO
┌─────────────────────────────────┐
│ José Mecânico (não verificado)  │
│ ⭐ 4.5 (23 reviews)             │
│ 📍 7.8 km away | ⏰ Abre 09:00  │
└─────────────────────────────────┘
```

**2. Page: Detalhes Carro** (Simuladores)
```
[Galeria Fotos] [Specs Técnicas] [Mapa] [Contactar]

[Carro: VW Golf VII — €14.500]

┌─ FINANCIAMENTO ────────────────┐
│ 💳 Simular Crédito             │
│ "Como posso financiar isto?"   │
│ [Simular] → Redireciona Banco  │
└────────────────────────────────┘

┌─ SEGURO ──────────────────────┐
│ 🛡️  Simular Seguro             │
│ "Qual é o custo do seguro?"   │
│ [Simular] → Redireciona Segur. │
└────────────────────────────────┘

┌─ RELATÓRIO DE HISTÓRICO ──────┐
│ ✅ História Verificada (€5)    │
│ • Sem acidentes               │
│ • Quilometragem OK            │
│ [Ver Relatório Completo]      │
└────────────────────────────────┘
```

---

## 📋 Roadmap de Implementação

### Fase 1: MVP (Sprint 1–2 | Semanas 1–4)

**Objectivo**: Lançar assinatura de profissionais + sistema de créditos

| Task | Owner | Tempo | Deps |
|------|-------|-------|------|
| Create `Profissional` subscription tier in Firestore | Dev | 8h | Schema |
| Build Dashboard Profissional (CRUD serviços) | Dev | 20h | UI Kit |
| Implement Stripe subscription billing | Dev | 15h | Stripe API |
| Create Credit system (ledger, balance) | Dev | 20h | Firestore |
| Build Pay-Per-Lead modal (1-click purchase) | Dev | 12h | UI |
| **Subtotal** | | **75h** | |

**Output**: Profissionais podem pagar €20/mês, ganham selo + prioridade busca

---

### Fase 2: Expansão B2B (Sprint 3–4 | Semanas 5–8)

**Objectivo**: Publicidade local + Priority Access + Banners

| Task | Owner | Tempo | Deps |
|------|-------|-------|------|
| Build Publicidade Geolocalizada (map picker, campaign builder) | Dev | 35h | Maps API |
| Implement Priority Access notifications | Dev | 20h | FCM, Redis |
| Create AdManager dashboard para vendedores | Dev | 15h | UI Kit |
| Stripe payment integration para ads | Dev | 10h | Stripe |
| **Subtotal** | | **80h** | |

**Output**: Lojas pagam para anúncios regionais, priority access para intenções

---

### Fase 3: Valor Acrescentado (Sprint 5–6 | Semanas 9–12)

**Objectivo**: Destaques avulsos + Relatórios + Simuladores

| Task | Owner | Tempo | Deps |
|------|-------|-------|------|
| Build Bumping system (UI + checkout) | Dev | 15h | Stripe |
| Integrate CarVertical API (história veículo) | Dev | 12h | API docs |
| Build Simulador Financiamento widget | Dev | 18h | Banco API |
| Build Simulador Seguro widget | Dev | 12h | Seguradora API |
| **Subtotal** | | **57h** | |

**Output**: Vendedores podem destacar anúncios, compradores veem história + simuladores

---

### Fase 4: Otimização (Sprint 7–8 | Semanas 13–16)

**Objectivo**: Performance, analytics, A/B testing

| Task | Owner | Tempo | Deps |
|------|-------|-------|------|
| Setup Analytics (conversões, CAC, LTV) | Dev | 20h | Google Analytics |
| A/B Test: Priority Access (24h vs 48h) | QA | 10h | Analytics |
| Optimize conversion funnels (Payment retry logic, etc) | Dev | 15h | Stripe |
| Suporte multimoeda (€/£/$/₹) para parceiros | Dev | 8h | Stripe |
| **Subtotal** | | **53h** | |

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|--------|---------------|-----------|
| **Profissionais rejeitam assinatura** | Receita zero | 40% | Oferecer período trial 30 dias, pay-per-lead gratuito para testar valor |
| **Qualidade de leads ruim** (oficina não responde) | Reembolsos, churn | 30% | Reembolso automático se sem resposta em 2h, score de qualidade visível |
| **Anúncios não geram ROI para vendedores** | Churn publicidade | 35% | A/B test 3 modelos de ad, relatórios de conversão, otimizar targeting |
| **Parceiros (bancos/seguros) lentidão** | Atraso na integração | 20% | Assinar contratos SLA, ter fallback a outros parceiros |
| **Fraude de créditos** (oficina compra, não responde) | Perda monetária | 25% | Verificação de identidade antes de vender créditos, limite diário |
| **GDPR / Privacidade** (dados de leads) | Multa €20M | 5% | Consentimento explícito, criptografia dados, retenção <6 meses |
| **Concorrência reduz margens** (OLX, Standvirtual copiam) | Margem 10% vs 40% | 60% | First-mover advantage, lock-in com integração chat, ecosystem lock-in |

---

## 📈 KPIs de Sucesso

### Tier 1: Viabilidade (Mês 1–3)

| KPI | Target | Crítico? |
|-----|--------|----------|
| Profissionais inscritos (subscrição) | 50 | ✅ |
| Oficinas ativas (pagando €20) | 30 (60% retenção) | ✅ |
| Taxa de churn (mensal) | < 10% | ✅ |
| MRR (Monthly Recurring Revenue) | €2.000+ | ✅ |
| Taxa conversão Pay-Per-Lead | > 5% (1 em 20 leva a contrato) | ✅ |

### Tier 2: Crescimento (Mês 4–6)

| KPI | Target | Crítico? |
|-----|--------|----------|
| Profissionais subscritos | 200 | ✅ |
| MRR | €10.000+ | ✅ |
| Lojas pagando Priority Access | 100 | ✅ |
| Campaings de Publicidade Regional | 50 ativas | ⚠️ |
| CAC (Customer Acquisition Cost) | < €200 | ✅ |

### Tier 3: Escala (Mês 7–12)

| KPI | Target | Crítico? |
|-----|--------|----------|
| Profissionais subscritos | 500 | ✅ |
| MRR | €36.500+ (realista) | ✅ |
| Leads B2B (financiamento + seguros) | 1000/mês | ✅ |
| NPS (Net Promoter Score) profissionais | > 50 | ⚠️ |
| Lifetime Value (LTV) profissional | > €600 (30 meses) | ✅ |

---

## 📝 Modelo de Negócio Consolidado

### Estrutura de Preços Recomendada

| Segmento | Serviço | Modelo | Preço | Ideal Para |
|----------|---------|--------|-------|-----------|
| **Profissionais** | Selo Verificado + Top Busca | Assinatura Mensal | €15–25/mês | Mecânicos, Oficinas |
| **Profissionais** | Desbloqueio de Lead | Pay-Per-Lead | €1–2 por lead | Profissionais Gratuitos |
| **Lojas** | Priority Access (24h early) | Assinatura Mensal | €50/mês | Lojas / Stands |
| **Lojas** | Saltar fila de intenção | Pay-Per-Lead | €3–5 por lead | Lojas Gratuitas |
| **Publicidade** | Banner Regional | Campanha | €50–500/mês | Oficinas / Lojas |
| **Vendedores** | Bump (subir anúncio) | Avulso | €2–20 | Qualquer Vendedor |
| **Compradores** | Relatório Histórico | Avulso | €5 | Compradores (suportados por Vendedor) |
| **Instituições** | Leads Financiamento | CPA/CPS | €5–10 + 1–2% | Bancos / Crédito |
| **Instituições** | Leads Seguro | CPA/CPS | €3–5 + 2–5% | Seguradoras |

---

## 🎯 Decisões Arquitectónicas

### A. Pagamento e Compliance

**Stack recomendado**:
- ✅ **Stripe Connect** (para sub-pagamento de comissões entre plataforma e parceiros)
- ✅ **Compliance**: PSD2 (Open Banking), RGPD, NIF validation
- ✅ **Currencies**: EUR principal, suporte para GBP/USD em futuro
- ✅ **Escrow**: Não necessário (B2B, créditos pré-pagos)

### B. Firestore Schema (Extensões)

```typescript
// Nova coleção: subscriptions
{
  profissionais/{uid}/subscription: {
    tier: 'verificado' | 'premium' | 'enterprise',
    preço_mensal: 25,
    data_inicio: Timestamp,
    data_renovacao: Timestamp,
    stripe_subscription_id: 'sub_...',
    activo: true,
    cancelada_em: null,
  }
}

// Nova coleção: creditos_profissionais
{
  creditos/{uid}: {
    saldo: 45,
    total_gasto: 105,
    historico: [
      {
        tipo: 'compra_pack',
        quantidade: 50,
        custo: €55,
        data: Timestamp
      },
      {
        tipo: 'consumo_lead',
        quantidade: 1,
        custo: €1.50,
        data: Timestamp,
        lead_id: 'intent_123'
      }
    ]
  }
}

// Nova coleção: campanhas_publicidade
{
  campanhas/{campaignId}: {
    proprietario_uid: 'loja_123',
    tipo: 'banner' | 'destaque' | 'prioridade',
    regiao: 'Lisboa', // ou raio em km
    data_inicio: Timestamp,
    data_fim: Timestamp,
    budget: €150,
    gasto_ate_agora: €45,
    impressoes: 1234,
    cliques: 78,
    activa: true,
  }
}

// Extensão: intencoes_compra (do plano 15)
{
  intencoes/{id}: {
    // ... existentes campos ...
    resposta_prioritaria_recebida: {
      loja_uid: 'loja_123',
      data: Timestamp,
      tempo_resposta_minutos: 12
    },
    leads_premium_notificadas: ['loja_1', 'loja_2'],
    leads_fila_comum: ['loja_3', 'loja_4'],
  }
}
```

### C. Webhooks Parceiros (Bancos/Seguros)

```typescript
// POST https://reparauto.pt/api/webhooks/financiamento
{
  event: 'lead_converted',
  lead_id: 'lead_123',
  status: 'approved' | 'rejected' | 'pending',
  valor_credito: 15000,
  comissao_devido: 225, // 1.5%
  timestamp: 1234567890
}

// ReparAuto responde:
{
  status: 'ok',
  transacao_id: 'tx_abc123',
  timestamp: 1234567890
}
```

---

## 📚 Documentação Técnica Necessária

1. **API Stripe** — Webhooks, retry logic, reconciliation
2. **API CarVertical** — Rate limiting, error handling
3. **Bank API Documentation** — Lead schema, security
4. **Seguradora API Documentation** — Lead schema, security
5. **Firestore Indexes** — Queries para campanhas por região, leads por loja
6. **Security Rules Update** — Apenas profissional pode editar seus créditos, apenas loja pode ver suas campanhas

---

## 🚀 Próximos Passos

### Imediato (Esta Semana)

- [ ] Validar com 5 oficinas: "Pagariam €20/mês por isso?"
- [ ] Validar com 3 lojas: "Priority Access vale €50/mês?"
- [ ] Contactar 2 bancos para SLA de integração
- [ ] Escrever Technical Requirements Document (TRD)

### Semana 1–2

- [ ] Começar Sprint 1 (Assinatura + Créditos)
- [ ] Setup Stripe environment
- [ ] Reserve Firebase quotas
- [ ] Train support team

### Semana 3–4

- [ ] Beta com 10 profissionais piloto
- [ ] Coletar feedback, iterar UI
- [ ] Go-live Sprint 1

---

## 📞 Contacto & Suporte

**DRI (Directly Responsible Individual)**: @founder  
**Equipa Técnica**: @backend-lead, @frontend-lead  
**Equipa B2B**: @sales-lead  
**Suporte**: support@reparauto.pt

---

**Versão**: 1.0  
**Última atualização**: Maio 2026  
**Próxima revisão**: Julho 2026 (pós-MVP)
