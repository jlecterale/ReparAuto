# Plano de Implementação: Lojas Virtuais de Vendedores Verificados

**Data:** Maio 2026  
**Versão:** 1.0  
**Status:** Proposta para análise  

---

## 1. Visão Geral

### Objetivo
Permitir que vendedores com múltiplos carros (5+) criem uma **loja virtual verificada** dentro do app ReparAuto, com marca própria, destaque em busca (pago/orgânico), reputação centralizada e catálogo ilimitado.

### Impacto Esperado
- **Monetização**: taxa mensal por loja (10–50€) + destaque pago (diário/semanal)
- **Retenção**: vendedores profissionais criam marca própria, aumentando stickiness
- **Confiança**: selos de verificação e reputação centralizada reduzem fricção de compra
- **Escalabilidade**: concentração de estoque de poucos vendedores 80/20, sem degradar search performance

---

## 2. Estrutura de Dados (Firestore)

### 2.1 Nova Collection: `lojas`

```typescript
interface Loja {
  // Identificadores
  id: string;                          // UUID, gerado automaticamente
  userId: string;                      // FK → users.uid (proprietário)
  
  // Dados Básicos
  nomeFantasia: string;                // "Auto Gomes Premium"
  descricao: string;                   // até 500 caracteres
  banner: {
    url: string;                       // Firebase Storage: /lojas/{lojaId}/banner
    storagePath: string;
  };
  logo: {
    url: string;                       // Firebase Storage: /lojas/{lojaId}/logo
    storagePath: string;
  };
  
  // Contato & Localização
  endereco: {
    rua: string;
    numero: string;
    complemento?: string;
    cep: string;
    localidade: string;                // "Porto"
    distrito: string;                  // "Porto"
    latitude?: number;
    longitude?: number;
  };
  telefone: string;                    // +351 XXX XXX XXX
  telefonePrincipal?: boolean;         // se é o número principal
  email?: string;                      // email comercial (diferente da auth)
  
  // Links Sociais
  website?: string;
  instagram?: string;
  facebook?: string;
  
  // Horário de Funcionamento
  horario: {
    [dia: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom']: {
      aberto: boolean;
      abertura: string;                // "09:00"
      fechamento: string;              // "18:00"
    };
  };
  
  // Status & Verificação
  status: 'solicitacao' | 'pendente_verificacao' | 'ativa' | 'pausada' | 'rejeitada';
  verificada: boolean;
  seloVerificacao?: {
    emitidaEm: Timestamp;
    validadeAte?: Timestamp;           // opcional: renovação anual
    tipoVerificacao: 'empresa' | 'autonomo';
  };
  
  // Documentos de Verificação (referências ao Storage)
  documentos: {
    nif?: string;                      // número, não armazenar arquivo
    certificadoRegistro?: string;      // storage path
    pruebaResidencia?: string;         // storage path (autonomos)
    uploadosEm: Timestamp;
    analisadoEm?: Timestamp;
    analisadoPor?: string;             // UID do admin
    motejvoRejeicao?: string;          // se rejeitada
  };
  
  // Reputação
  reputacao: {
    mediaAvaliacao: number;            // 0–5 (média das avaliações dos carros)
    totalVendas: number;
    tempoMedioResposta: number;        // minutos
    ultimaAtualizacao: Timestamp;
  };
  
  // Destaque Pago
  destaque: {
    ativo: boolean;
    tipoDestaque: 'nenhum' | 'diario' | 'semanal' | 'mensal';
    dataInicio: Timestamp;
    dataFim: Timestamp;
    posicaoNaBusca: number;            // 1–X (ordem de exibição)
    recorrente: boolean;
  };
  
  // Timestamps
  criadaEm: Timestamp;
  atualizadaEm: Timestamp;
  deletadaEm?: Timestamp;              // soft delete
  
  // Estatísticas (desnormalizadas para performance)
  stats: {
    totalCarros: number;               // contagem de carros ativos
    visitasUltimaMes: number;
    contatos7Dias: number;
    contatosTotais: number;
  };
}
```

### 2.2 Extensão da Collection: `users`

Adicionar campo a cada documento `users`:

```typescript
interface Usuario {
  // ... campos existentes ...
  
  // Dados de Loja (se aplicável)
  lojaId?: string;                     // FK → lojas.id (null se não tem loja)
  possuiLoja: boolean;
  podeAbrirLoja: boolean;              // true se totalCarros >= 5 && verificado
  
  // Timestamps para auditoria
  lojaAuditoriaUltimo: {
    alteradoEm: Timestamp;
    alteradoPor: string;               // UID do admin
  };
}
```

### 2.3 Nova Collection: `destaque_lojas`

Registro de compras de destaque (auditoria e billing):

```typescript
interface DestaqueLojaCompra {
  id: string;                          // UUID
  lojaId: string;                      // FK → lojas.id
  userId: string;                      // FK → users.uid
  
  tipoDestaque: 'diario' | 'semanal' | 'mensal';
  quantidade: number;                  // quantos dias/semanas/meses
  
  valor: number;                       // em €, ex: 5.00
  moeda: string;                       // "EUR"
  
  dataInicio: Timestamp;
  dataFim: Timestamp;
  
  status: 'aguardando_pagamento' | 'pago' | 'expirado' | 'cancelado';
  metodo: 'stripe' | 'paypal' | 'transferencia';
  referenciaPagamento?: string;        // ID da transação
  
  recorrente: boolean;
  
  criadaEm: Timestamp;
  atualizadaEm: Timestamp;
}
```

### 2.4 Nova Collection: `verificacoes_loja`

Histórico detalhado de verificações:

```typescript
interface VerificacaoLoja {
  id: string;
  lojaId: string;
  userId: string;
  
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'expirada';
  tipoVerificacao: 'empresa' | 'autonomo';
  
  // Checklist automático
  validacoes: {
    nifValido: boolean;
    documentosPresentes: boolean;
    fotosBannerLogo: boolean;
    enderecoBuscavel: boolean;
  };
  
  // Análise manual
  analisadoPor?: string;               // UID do admin
  notasAnalista?: string;
  aprovadoEm?: Timestamp;
  rejeitadoEm?: Timestamp;
  motjvoRejeicao?: string;
  
  dataProximaRenovacao?: Timestamp;    // ~1 ano após aprovação
  
  criadaEm: Timestamp;
}
```

### 2.5 Firestore Indexes

Adicionar ao `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "lojas",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "verificada", "order": "ASCENDING"},
        {"fieldPath": "destaque.ativo", "order": "DESCENDING"},
        {"fieldPath": "atualizadaEm", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "lojas",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "reputacao.mediaAvaliacao", "order": "DESCENDING"},
        {"fieldPath": "atualizadaEm", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "destaque_lojas",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "lojaId", "order": "ASCENDING"},
        {"fieldPath": "dataFim", "order": "DESCENDING"}
      ]
    }
  ]
}
```

---

## 3. Workflow de Solicitação & Verificação

### 3.1 Fluxo Alto-Nível

```
Usuário com 5+ carros
    ↓
[Tela: "Abrir Minha Loja"]
    ↓
Preenche formulário (dados da loja)
    ↓
Upload de documentos (NIF, comprovante residência, fotos)
    ↓
Salva em `lojas` com status = 'solicitacao'
    ↓
[Sistema] Validações automáticas (formato NIF, imagens, etc.)
    ↓
[Admin] Análise manual no painel
    ↓
Aprovar / Rejeitar
    ↓
Loja muda para 'ativa' ou 'rejeitada'
    ↓
Se verificada, recebe selo + acesso a destaque pago
```

### 3.2 Validações Automáticas (Backend)

**Ao submeter solicitação, executar (`src/lib/db.ts`)**:

```typescript
async function validarSolicitacaoLoja(lojaId: string): Promise<ValidationResult> {
  const loja = await getDoc(doc(db, 'lojas', lojaId));
  const erros: string[] = [];

  // 1. NIF válido (Portugal)
  if (!isValidNIF(loja.nif)) {
    erros.push('NIF inválido');
  }

  // 2. Documentos presentes
  if (!loja.documentos.certificadoRegistro && loja.documentos.tipoVerificacao === 'empresa') {
    erros.push('Certificado de registro da empresa obrigatório');
  }

  // 3. Imagens ok
  if (!loja.logo.url || !loja.banner.url) {
    erros.push('Logo e banner são obrigatórios');
  }

  // 4. Endereço buscável (geocoding)
  try {
    const coords = await geocodeEndereco(loja.endereco);
    if (!coords) erros.push('Endereço não encontrado. Verifique e tente novamente.');
  } catch (e) {
    erros.push('Erro ao validar endereço');
  }

  // 5. Usuário tem 5+ carros ativos
  const carrosCount = await countCarrosAtivos(loja.userId);
  if (carrosCount < 5) {
    erros.push('Mínimo 5 carros ativos necessário');
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
```

### 3.3 Análise Manual (Painel Admin)

**Nova página: `app/admin/verificacoes/page.tsx`**

Interface para admin com:
- Fila de solicitações (status = 'solicitacao')
- Visualização lado-a-lado: dados da loja + documentos
- Botões: "Aprovar" / "Rejeitar com motivo"
- Upload de certificado de verificação (assinado digitalmente)
- Log de todas as aprovações/rejeições

**Segurança**: Apenas admin (`role === 'admin'`) pode acessar.

### 3.4 Aprovação & Geração de Selo

Ao clicar "Aprovar":

```typescript
async function aprovarLoja(lojaId: string, adminId: string) {
  const lojaRef = doc(db, 'lojas', lojaId);
  
  const novoSelo = {
    emitidaEm: Timestamp.now(),
    validadeAte: Timestamp.fromDate(addYears(new Date(), 1)),
    tipoVerificacao: loja.documentos.tipoVerificacao,
  };

  await updateDoc(lojaRef, {
    status: 'ativa',
    verificada: true,
    seloVerificacao: novoSelo,
    'documentos.analisadoPor': adminId,
    'documentos.analisadoEm': Timestamp.now(),
  });

  // Criar registro em verificacoes_loja
  await addDoc(collection(db, 'verificacoes_loja'), {
    lojaId,
    userId: loja.userId,
    status: 'aprovada',
    tipoVerificacao: loja.documentos.tipoVerificacao,
    validacoes: { /* ... */ },
    analisadoPor: adminId,
    aprovadoEm: Timestamp.now(),
    dataProximaRenovacao: addYears(new Date(), 1),
    criadaEm: Timestamp.now(),
  });

  // Notificar usuário
  await enviarNotificacao(loja.userId, {
    titulo: 'Sua loja foi verificada! 🎉',
    mensagem: 'Sua loja agora tem o selo de verificação.',
    tipo: 'lojaAprovada',
  });
}
```

### 3.5 Rejeição

Se rejeitada:

```typescript
async function rejeitarLoja(lojaId: string, adminId: string, motivo: string) {
  const lojaRef = doc(db, 'lojas', lojaId);

  await updateDoc(lojaRef, {
    status: 'rejeitada',
    'documentos.analisadoPor': adminId,
    'documentos.analisadoEm': Timestamp.now(),
    'documentos.motejvoRejeicao': motivo,
  });

  // Notificar usuário
  await enviarNotificacao(loja.userId, {
    titulo: 'Solicitação de loja rejeitada',
    mensagem: `Motivo: ${motivo}`,
    tipo: 'lojaRejeitada',
    acao: { texto: 'Reenviar', rota: `/lojas/${lojaId}/editar` },
  });
}
```

---

## 4. Destaque Pago & Lógica de Topo de Busca

### 4.1 Modelo de Monetização

| Tipo | Período | Preço (€) | Posição | Visibilidade |
|------|---------|-----------|---------|--------------|
| Nenhum | — | Grátis | Orgânico (rotativo) | Incluído em pesquisa normal |
| Destaque Diário | 1 dia | 5,00 | #1–#3 em busca | Ícone destaque, topo |
| Destaque Semanal | 7 dias | 25,00 | #1–#5 em busca | Prioridade alta |
| Destaque Mensal | 30 dias | 80,00 | #1–#10 em busca | Máxima prioridade |
| Recorrente | A cada período | 50% desconto | Prioridade + renovação automática | Estável |

**Preços em revisão conforme testes A/B.**

### 4.2 Lógica de Topo de Busca

Ao fazer query em `/busca?q=...`, ordenar lojas por:

1. **Se destaque ativo**: `order by destaque.posicaoNaBusca ASC, destaque.dataFim DESC`
2. **Senão (orgânico)**: Rotativo por semana entre lojas verificadas:
   ```typescript
   const lojasBuscaOrganica = lojas.filter(l => l.verificada && !l.destaque.ativo)
     .sort((a, b) => {
       const semanaA = Math.floor(a.id.charCodeAt(0) / 7); // determinístico
       const semanaB = Math.floor(b.id.charCodeAt(0) / 7);
       const semanaAtual = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
       
       return Math.abs(semanaAtual - semanaA) - Math.abs(semanaAtual - semanaB);
     });
   ```

### 4.3 Fluxo de Compra de Destaque

**Tela: `src/screens/VendedorMeuDestaque.tsx`** (nova)

```
[Dashboard Vendedor]
  ↓
Selecionar tipo de destaque (Diário / Semanal / Mensal)
  ↓
Revisar preço + datas
  ↓
[Integração Stripe / PayPal]
  ↓
Criar documento em `destaque_lojas` com status = 'aguardando_pagamento'
  ↓
[Webhook] Pagamento confirmado → status = 'pago'
  ↓
Ativar destaque na `lojas` (destaque.ativo = true, dataFim = ...)
  ↓
Atualizar posição na busca (index renewal a cada 5min)
  ↓
Expiração: job diário revisa dataFim, desativa se expirado
```

### 4.4 Renovação Automática

Se `destaque.recorrente = true` e pagamento salvo:

```typescript
async function processarRenovacoesDestaque() {
  const destaques = await getDocs(
    query(
      collection(db, 'destaque_lojas'),
      where('recorrente', '==', true),
      where('status', '==', 'pago'),
      where('dataFim', '<=', Timestamp.now())
    )
  );

  for (const doc of destaques.docs) {
    const novaDataFim = addDays(doc.data().dataFim, periodoDias[doc.data().tipoDestaque]);
    
    try {
      const charge = await stripe.charges.create({
        amount: doc.data().valor * 100, // centavos
        currency: 'eur',
        customer: doc.data().stripeCustomerId,
      });

      await updateDoc(doc.ref, {
        dataFim: Timestamp.fromDate(novaDataFim),
        referenciaPagamento: charge.id,
        atualizadaEm: Timestamp.now(),
      });
    } catch (e) {
      // Falha: enviar notificação ao vendedor
      await enviarNotificacao(doc.data().userId, {
        titulo: 'Falha na renovação do destaque',
        mensagem: 'Seu método de pagamento foi recusado. Atualize e tente novamente.',
      });
    }
  }
}
```

**Executar:** Cloud Scheduler, diariamente às 02:00 UTC.

---

## 5. Interface & Integração com Busca

### 5.1 Novas Páginas/Telas

#### A. `/lojas` — Diretório de Lojas
- Grid de cards com lojas verificadas
- Filtros: distrito, categoria de carro, reputação
- Busca por nome da loja
- Destaque: lojas com destaque ativo em destaque visual (badge "Em Destaque")
- **Cache**: ISR 10min (ou Redis se muitas lojas)

#### B. `/lojas/[id]` — Página da Loja (Server Component)
- **Meta tags dinâmicas**: `og:title`, `og:image` (banner da loja)
- **Layout**: banner + logo + info da loja (horário, contato) + grid de carros
- **Grid de carros**: todos os carros do vendedor (`userId = loja.userId`)
- **Reputação**: média de avaliações (agregado de `cars.avaliacoes`)
- **Estatísticas**: "453 visitas este mês", "12 contatos", etc.
- **CTA**: botão "Entrar em contato" → abre chat ou modal de contato
- **Related lojas**: sugestões de 3 outras lojas similares (por tipo de veículo)
- **Cache**: ISR 5min

#### C. `/lojas/[id]/editar` — Painel do Vendedor (Client Component)
- **Abas**:
  1. **Dados da Loja**: banner, logo, nome, descrição, contato, horário
  2. **Meus Carros**: tabela com status de cada carro (ativo, pendente, vendido)
  3. **Destaque**: comprar/gerenciar destaque pago, ver histórico
  4. **Estatísticas**: gráficos de visitas, contatos, converção
  5. **Configurações**: pausar loja, renovação de verificação
- **Permissões**: apenas o proprietário ou admin pode editar

#### D. Integração com Busca Principal (`src/components/home/CarGrid.tsx`)

Adicionar filtro:
```typescript
{
  tipo: 'vendedor',
  label: 'Incluir lojas verificadas',
  opcoes: [
    { label: 'Todas', valor: 'todas' },
    { label: 'Apenas lojas verificadas', valor: 'verificadas' },
    { label: 'Apenas vendedores privados', valor: 'privados' },
  ],
}
```

**Resultado**: ao selecionar "verificadas", a busca:
1. Agrupa carros por `userId`
2. Filtra apenas `userId` que possuem `lojaId`
3. Ordena por destaque ativo, depois reputação

**Visual**: cada grupo com card resumido da loja acima dos carros.

---

## 6. Sistema de Reputação da Loja

### 6.1 Cálculo de Reputação

```typescript
interface ReputacaoLoja {
  mediaAvaliacao: number;              // 0–5 (média das avaliações dos carros)
  totalVendas: number;                 // contagem de carros com status = 'vendido'
  tempoMedioResposta: number;          // minutos (agregado de chats)
  ultimaAtualizacao: Timestamp;
}
```

**Cálculo (job diário em 02:15 UTC)**:

```typescript
async function atualizarReputacaoLoja(lojaId: string) {
  const loja = await getDoc(doc(db, 'lojas', lojaId));
  const userId = loja.userId;

  // 1. Média de avaliações dos carros
  const carros = await getDocs(
    query(collection(db, 'cars'), where('userId', '==', userId))
  );
  const avaliacoes = carros.docs
    .flatMap(c => c.data().avaliacoes || [])
    .map(a => a.nota);
  const mediaAvaliacao = avaliacoes.length > 0 ? 
    avaliacoes.reduce((a, b) => a + b) / avaliacoes.length : 0;

  // 2. Total de vendas
  const totalVendas = carros.docs.filter(c => c.data().status === 'vendido').length;

  // 3. Tempo médio de resposta (últimos 30 dias)
  const mensagensRecentes = await getDocs(
    query(
      collection(db, 'messages'),
      where('vendedorId', '==', userId),
      where('criadaEm', '>', Timestamp.fromDate(addDays(new Date(), -30)))
    )
  );
  const temposResposta = mensagensRecentes.docs
    .map(m => m.data().tempoRespostaSeg || null)
    .filter(t => t !== null);
  const tempoMedio = temposResposta.length > 0 ? 
    temposResposta.reduce((a, b) => a + b) / temposResposta.length / 60 : null;

  await updateDoc(doc(db, 'lojas', lojaId), {
    'reputacao.mediaAvaliacao': mediaAvaliacao,
    'reputacao.totalVendas': totalVendas,
    'reputacao.tempoMedioResposta': tempoMedio,
    'reputacao.ultimaAtualizacao': Timestamp.now(),
  });
}
```

### 6.2 Exibição de Reputação

Na página da loja (`/lojas/[id]`):

```tsx
<div className="reputacao-widget">
  <div className="rating">
    <Stars rating={loja.reputacao.mediaAvaliacao} />
    <span className="text">{loja.reputacao.mediaAvaliacao.toFixed(1)}/5</span>
  </div>
  <div className="stats">
    <Stat icon="check" label="Vendas" value={loja.reputacao.totalVendas} />
    <Stat icon="clock" label="Resp. Média" value={`${loja.reputacao.tempoMedioResposta.toFixed(0)}min`} />
  </div>
  {loja.verificada && <Badge className="verificado">✓ Verificado</Badge>}
</div>
```

---

## 7. Sistema de Cache para Catálogos Grandes

### 7.1 Problema

Uma loja com 500+ carros causa:
- Rendering lento na página da loja (`/lojas/[id]`)
- Query pesada ao Firestore
- Bundle size grande (JSON inline)

### 7.2 Solução: Cache em 3 Níveis

#### Nível 1: Cache do Browser (ISR)
- Página `/lojas/[id]` renderizada com `revalidate = 300` (5min)
- Firestore query agrupada: `getDocs(query(collection(db, 'cars'), where('userId', '==', userId)))`
- Next.js regenera HTML estaticamente a cada 5min

#### Nível 2: Redis (Cache Distribuído)
- Instalação: `npm install redis ioredis`
- Chave: `loja:${lojaId}:carros` com TTL 10min
- Preenchido por job de sincronização (02:30 UTC)

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function getCarrosLojaComCache(lojaId: string): Promise<Carro[]> {
  const cached = await redis.get(`loja:${lojaId}:carros`);
  if (cached) return JSON.parse(cached);

  const carros = await getDocs(
    query(collection(db, 'cars'), where('userId', '==', lojaId))
  );
  const data = carros.docs.map(d => d.data());

  // Cache por 10 min
  await redis.setex(`loja:${lojaId}:carros`, 600, JSON.stringify(data));
  return data;
}
```

#### Nível 3: Índice de Busca (Algolia ou Meilisearch)
- **Usar**: Meilisearch (self-hosted, grátis) ou Algolia (SaaS 500k hits/mês gratuito)
- **Index**: `cars_por_loja`
- **Campos searchables**: `titulo`, `modelo`, `marca`
- **Facets**: `lojaId`, `preco`, `ano`, `combustivel`
- **Atualização**: webhook ao criar/editar/deletar carro

```typescript
// src/lib/search.ts
import { MeiliSearch } from 'meilisearch';

const search = new MeiliSearch({
  host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_KEY,
});

async function indexarCarro(carro: Carro) {
  await search.index('cars_por_loja').addDocuments([
    {
      id: carro.id,
      titulo: carro.titulo,
      modelo: carro.modelo,
      marca: carro.marca,
      lojaId: carro.userId,
      preco: carro.preco,
      ano: carro.ano,
      combustivel: carro.combustivel,
    },
  ]);
}

async function buscarCarrosLoja(lojaId: string, query?: string) {
  return search.index('cars_por_loja').search(query || '', {
    filter: [`lojaId = "${lojaId}"`],
    limit: 50,
  });
}
```

### 7.3 Paginação

Na página da loja, usar paginação com `limit` + `offset`:

```typescript
// Server Component: app/lojas/[id]/page.tsx
async function fetchCarrosLoja(lojaId: string, page: number = 1, limit: number = 20) {
  const carros = await getCarrosLojaComCache(lojaId);
  const offset = (page - 1) * limit;
  return {
    carros: carros.slice(offset, offset + limit),
    total: carros.length,
    pages: Math.ceil(carros.length / limit),
  };
}
```

Client-side pagination com URL search params:

```tsx
// /lojas/[id] → /lojas/[id]?page=2
<Pagination
  current={page}
  total={totalPages}
  onChange={(p) => router.push(`?page=${p}`)}
/>
```

### 7.4 Performance Targets

| Métrica | Alvo | Como Atingir |
|---------|------|--------------|
| Loja com 500 carros, 1º load | < 2s | ISR + Redis |
| Search na loja (filter + sort) | < 300ms | Meilisearch |
| Page load (CLS, FCP) | < 75ms, < 100 | Imagens otimizadas + lazy load |

---

## 8. Integração com Sistema de Notificações

### 8.1 Eventos que Geram Notificações

| Evento | Destinatário | Mensagem |
|--------|--------------|----------|
| Solicitação de loja enviada | Admin | "Nova solicitação: Loja XYZ" |
| Loja aprovada | Vendedor | "Sua loja foi verificada! 🎉" |
| Loja rejeitada | Vendedor | "Solicitação rejeitada: motivo..." |
| Destaque expira | Vendedor | "Seu destaque expira em 2 dias" |
| Novo contato na loja | Vendedor | "5 pessoas contataram seus carros hoje" |
| Avaliação na loja | Vendedor | "Você recebeu uma avaliação 5 ⭐" |

Implementação: estender `src/hooks/useNotificacoes.ts` com tipos novos.

---

## 9. Fluxo de Autorização & Permissões

### 9.1 Regras de Acesso (Firestore Security Rules)

```javascript
// firestore.rules (add)
match /lojas/{lojaId} {
  // Leitura pública para lojas ativas/verificadas
  allow read: if resource.data.status == 'ativa' && resource.data.verificada == true;
  
  // Leitura própria (vendedor)
  allow read: if request.auth.uid == resource.data.userId;
  
  // Criação: usuário autenticado com 5+ carros
  allow create: if request.auth != null && 
                   canAbrirLoja(request.auth.uid);
  
  // Update: apenas proprietário ou admin
  allow update: if (request.auth.uid == resource.data.userId ||
                    isAdmin(request.auth.uid));
  
  // Delete: apenas admin (soft delete)
  allow delete: if isAdmin(request.auth.uid);
}

match /destaque_lojas/{destaqueId} {
  // Leitura: proprietário da loja ou admin
  allow read: if isOwnerOfLoja(request.auth.uid, resource.data.lojaId) ||
                 isAdmin(request.auth.uid);
  
  // Criação: proprietário da loja
  allow create: if request.auth != null &&
                   isOwnerOfLoja(request.auth.uid, request.resource.data.lojaId);
}

match /verificacoes_loja/{verificacaoId} {
  // Leitura: proprietário ou admin
  allow read: if request.auth.uid == resource.data.userId ||
                 isAdmin(request.auth.uid);
}

function canAbrirLoja(uid) {
  let user = get(/databases/$(database)/documents/users/$(uid));
  return user.data.get('totalCarrosAtivos', 0) >= 5 &&
         user.data.get('emailVerificado', false) == true;
}

function isAdmin(uid) {
  return get(/databases/$(database)/documents/users/$(uid)).data.role == 'admin';
}

function isOwnerOfLoja(uid, lojaId) {
  return get(/databases/$(database)/documents/lojas/$(lojaId)).data.userId == uid;
}
```

### 9.2 Checklist de Acesso no Frontend

```typescript
// src/hooks/useAcessoLoja.ts
export function useAcessoLoja(lojaId: string) {
  const { user } = useAuth();
  const [loja, setLoja] = useState<Loja | null>(null);

  useEffect(() => {
    getDoc(doc(db, 'lojas', lojaId)).then(s => setLoja(s.data() as Loja));
  }, [lojaId]);

  return {
    podeVerLoja: loja?.status === 'ativa' && loja?.verificada || user?.uid === loja?.userId,
    podeEditarLoja: user?.uid === loja?.userId || user?.role === 'admin',
    podeAprovarLoja: user?.role === 'admin',
  };
}
```

---

## 10. Estimativa de Tempo & Equipe

### 10.1 Breakdown por Módulo

| Módulo | Tarefas | Dev | QA | Design | Total (dias) |
|--------|---------|-----|-----|--------|--------------|
| **Estrutura BD + API** | Firestore schema, indexes, CRUD | 3 | 2 | — | 5 |
| **Backend** | Cloud Functions, renovação automática, reputação | 4 | 2 | — | 6 |
| **Tela de Solicitação** | Form, upload docs, validações FE | 2 | 1 | 1 | 4 |
| **Painel Admin** | Fila de verificação, aprovação | 2 | 1 | 1 | 4 |
| **Página da Loja** | Server Component, grid de carros, cache | 3 | 2 | 1 | 6 |
| **Painel de Vendedor** | Destaque, stats, edição | 3 | 2 | 1 | 6 |
| **Diretório de Lojas** | Grid + filtros + ISR | 2 | 1 | 1 | 4 |
| **Integração Pagamento** | Stripe/PayPal, renovação | 2 | 2 | — | 4 |
| **Cache & Otimização** | Redis, Meilisearch, ISR | 3 | 2 | — | 5 |
| **Testes & Deploy** | E2E, load tests, Firebase deploy | 2 | 3 | — | 5 |
| **Documentação** | API docs, runbooks | 1 | — | — | 1 |

**Total: 10–12 semanas (1 equipe full-stack de 2–3 pessoas)**

### 10.2 Equipe Mínima Viável

```
Cenário 1: Time enxuto (4–5 pessoas, 12 semanas)
├─ 1 Full-Stack Engineer (70% do tempo)
├─ 1 Backend Engineer (50%)
├─ 1 UI/UX Designer (30%)
├─ 1 QA Engineer (60%)
└─ 1 Devops/Infra (20%, Redis + Meilisearch)

Cenário 2: Time dedicado (8 semanas, 2 pessoas)
├─ 2 Full-Stack Engineers (100% cada)
└─ 1 Shared: QA (outsourced/part-time)
```

### 10.3 Roadmap de Entrega

```
Semana 1–2:   Design + Setup BD
Semana 3–4:   Backend + Validações
Semana 5–6:   Telas de Solicitação + Admin
Semana 7–9:   Loja + Painel de Vendedor + Integração Pagamento
Semana 10–11: Cache + Otimização + Testes
Semana 12:    Deploy + Monitoramento
```

---

## 11. Riscos Técnicos & Mitigações

### 11.1 Performance com Muitas Lojas

**Risco**: Query em collection `lojas` fica lenta com 1000+ lojas.

**Mitigação**:
- ✅ Indexes compostos (já no schema)
- ✅ Firestore sharding se necessário (`lojas_0`, `lojas_1`, ...)
- ✅ Algolia/Meilisearch para busca full-text
- ✅ ISR 10min na página `/lojas`

### 11.2 Fraude em Destaque Pago

**Risco**: Vendedor compra destaque, depois deleta carros ou abre múltiplas lojas fake.

**Mitigação**:
- ✅ Verificação antes de permitir destaque (6+ carros, reputação > 3.5⭐)
- ✅ Limite de 1 loja por usuário (FK `lojaId` em `users`)
- ✅ Auditoria: log de todas as transações em `destaque_lojas`
- ✅ Admin pode revogar destaque se suspeita

### 11.3 Escalabilidade de Realtime (Chat na Loja)

**Risco**: Muitos chats simultâneos causam congestionamento do Firestore.

**Mitigação**:
- ✅ `onSnapshot` apenas para chats abertos (não subs infinitas)
- ✅ Paginação de histórico: carregar últimas 50 mensagens
- ✅ Limitar listeners por usuário (max 10 chats abertos)
- ✅ Cloud Firestore: escalar apenas collection `messages` se necessário

### 11.4 Segurança: Documentos de Verificação

**Risco**: Upload de documentos falsos, acesso não autorizado.

**Mitigação**:
- ✅ Validação de formato (PDF, JPEG, dimensions)
- ✅ Antivírus em upload (ClamAV ou terceirizado)
- ✅ Storage Rules: apenas proprietário + admin podem ler
- ✅ Admin faz análise manual visual
- ✅ GDPR: deletar documentos após 1 ano (data de expiração)

### 11.5 Integração Stripe/PayPal

**Risco**: Falha em pagamento não é tratada, usuário não sabe status.

**Mitigação**:
- ✅ Webhook com retry (3x com backoff exponencial)
- ✅ Dead-letter queue em Pub/Sub para payamentos falhados
- ✅ Dashboard de admin com "Pagamentos Pendentes"
- ✅ Email de confirmação imediato, sem aguardar webhook
- ✅ Monitoramento: alertas se taxa de rejeição > 5% em 1h

### 11.6 Renovação Automática de Destaque

**Risco**: Falha silenciosa, destaque desaparece sem avisar.

**Mitigação**:
- ✅ Notificação 7 dias antes (ao atingir `dataFim - 7 dias`)
- ✅ Se falha, notificação ao vendedor + pause automático (não desativa)
- ✅ Cloud Task com retry (até 5x)
- ✅ Admin dashboard mostra "Destaque Expirando"

### 11.7 Reputação Desnormalizada

**Risco**: Campo `reputacao` fica out-of-sync com avaliações dos carros.

**Mitigação**:
- ✅ Job diário (02:15 UTC) recalcula
- ✅ Invalidação imediata ao adicionar avaliação (trigger Cloud Function)
- ✅ Admin pode forçar recalcular via button no painel

### 11.8 Limite de Fotos em Storage

**Risco**: 1000 lojas × 2 imagens (banner + logo) = 2000+ uploads, quota excedida.

**Mitigação**:
- ✅ Redimensionar + comprimir (Sharp na Cloud Function)
- ✅ Manter apenas últimas versões (delete ao atualizar)
- ✅ Firebase Storage: escalar quota conforme necessário (~1GB/mês inicial)
- ✅ Considerar CDN (Cloudflare) para cache de banner/logo

---

## 12. Roadmap de Lançamento

### Fase 1: MVP (Semanas 1–8)
- ✅ Firestore schema
- ✅ Solicitação + Aprovação de loja (manual)
- ✅ Página da loja (básica: info + grid de carros)
- ✅ Painel do vendedor (editar info, ver carros)
- ✅ Destaque pago (Stripe)

**Lançamento**: Beta fechado com 20–30 vendedores top

### Fase 2: Otimização (Semanas 9–12)
- ✅ Cache + Meilisearch
- ✅ Reputação + Sistema de avaliação
- ✅ Renovação automática de destaque
- ✅ Análise automática de documentos (IA)
- ✅ Mobile: bottom nav com acesso a "Minhas Lojas"

**Lançamento**: Beta público

### Fase 3: Expansão (Mês 4+)
- ✅ Lojas de Peças (mesmo modelo)
- ✅ Serviços & Workshops (mecânicos, detailers)
- ✅ Integração com WhatsApp Business API
- ✅ Marketplace de Seguros / Financiamento
- ✅ Analytics avançado (dashboard personalizado para vendedor)

---

## 13. KPIs & Sucesso

### 13.1 Métricas de Adoção

| KPI | Target | Como Medir |
|-----|--------|-----------|
| % de vendedores com 5+ carros que abrem loja | 30% | `COUNT(lojas) / COUNT(usuarios_com_5+_carros)` |
| Tempo médio até aprovação | < 24h | `timestamp_aprovacao - timestamp_solicitacao` |
| Taxa de rejeição | < 5% | `COUNT(rejeitadas) / COUNT(solicitacoes)` |
| Destaque pago: Conversion rate | 10% | `COUNT(destaque_pago) / COUNT(lojas_ativas)` |
| Receita mensal (lojas + destaque) | €5k–€20k | Stripe dashboard |

### 13.2 Métricas de Qualidade

| KPI | Target | Como Medir |
|-----|--------|-----------|
| Tempo load `/lojas/[id]` (500 carros) | < 2s | Lighthouse |
| Uptime do painel de vendedor | 99.9% | CloudWatch |
| Taxa de erro no webhook de pagamento | < 0.1% | Error Reporting |
| Satisfação de vendedor | 4.5⭐ | Survey (email) |

---

## 14. Próximos Passos

1. **Design**: Validar wireframes de `/lojas`, `/lojas/[id]`, painel do vendedor com PO
2. **BD**: Criar branch e aplicar schema + indexes
3. **MVP**: Iniciar dev em paralelo (Backend + Frontend)
4. **Beta Tester**: Recrutar 20 vendedores para testar em semana 8
5. **Docs**: Manter runbooks para operações (aprovação, suporte, etc.)

---

## Apêndice: Exemplo de Documento Firestore

```json
// Document: lojas/loja-001
{
  "id": "loja-001",
  "userId": "user-12345",
  "nomeFantasia": "Auto Gomes Premium",
  "descricao": "Concessionária de carros usados de qualidade. Verificação completa, financiamento disponível.",
  "banner": {
    "url": "https://storage.googleapis.com/reparauto-site.appspot.com/lojas/loja-001/banner.jpg",
    "storagePath": "lojas/loja-001/banner.jpg"
  },
  "logo": {
    "url": "https://storage.googleapis.com/reparauto-site.appspot.com/lojas/loja-001/logo.png",
    "storagePath": "lojas/loja-001/logo.png"
  },
  "endereco": {
    "rua": "Avenida da Liberdade",
    "numero": "123",
    "complemento": "Andar 2",
    "cep": "4050-100",
    "localidade": "Porto",
    "distrito": "Porto",
    "latitude": 41.1579,
    "longitude": -8.6291
  },
  "telefone": "+351 222 123 456",
  "telefonePrincipal": true,
  "email": "contato@autogomes.pt",
  "website": "https://autogomes.pt",
  "instagram": "https://instagram.com/autogomes",
  "facebook": "https://facebook.com/autogomes",
  "horario": {
    "seg": { "aberto": true, "abertura": "09:00", "fechamento": "19:00" },
    "ter": { "aberto": true, "abertura": "09:00", "fechamento": "19:00" },
    "qua": { "aberto": true, "abertura": "09:00", "fechamento": "19:00" },
    "qui": { "aberto": true, "abertura": "09:00", "fechamento": "19:00" },
    "sex": { "aberto": true, "abertura": "09:00", "fechamento": "19:00" },
    "sab": { "aberto": true, "abertura": "10:00", "fechamento": "17:00" },
    "dom": { "aberto": false, "abertura": null, "fechamento": null }
  },
  "status": "ativa",
  "verificada": true,
  "seloVerificacao": {
    "emitidaEm": "2026-05-15T10:30:00Z",
    "validadeAte": "2027-05-15T10:30:00Z",
    "tipoVerificacao": "empresa"
  },
  "documentos": {
    "nif": "501234567",
    "certificadoRegistro": "lojas/loja-001/certificado-registro.pdf",
    "uploadosEm": "2026-05-10T15:00:00Z",
    "analisadoEm": "2026-05-15T10:00:00Z",
    "analisadoPor": "admin-user-001",
    "motejvoRejeicao": null
  },
  "reputacao": {
    "mediaAvaliacao": 4.7,
    "totalVendas": 47,
    "tempoMedioResposta": 12,
    "ultimaAtualizacao": "2026-05-29T02:15:00Z"
  },
  "destaque": {
    "ativo": true,
    "tipoDestaque": "semanal",
    "dataInicio": "2026-05-20T00:00:00Z",
    "dataFim": "2026-05-27T00:00:00Z",
    "posicaoNaBusca": 2,
    "recorrente": true
  },
  "criadaEm": "2026-05-10T12:00:00Z",
  "atualizadaEm": "2026-05-29T02:15:00Z",
  "deletadaEm": null,
  "stats": {
    "totalCarros": 47,
    "visitasUltimaMes": 1230,
    "contatos7Dias": 23,
    "contatosTotais": 456
  }
}
```

---

**Fim do Plano**

*Para dúvidas ou detalhes adicionais, contactar equipe de produto.*
