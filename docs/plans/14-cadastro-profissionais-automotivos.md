# Plano de Implementação: Cadastro & Busca de Profissionais Automotivos

**Data:** Maio 2026  
**Versão:** 1.0  
**Status:** Proposta para análise  

---

## 1. Visão Geral

### Objetivo
Criar um marketplace horizontal integrado ao ReparAuto que conecte usuários a profissionais e estabelecimentos do setor automotivo (mecânicos, oficinas, borracharias, etc.) com busca geolocalizada, avaliações verificadas e sistema de orçamentos.

### Impacto Esperado
- **Ecossistema**: Ampliar além de carros/peças para serviços (reparação, manutenção)
- **Receita**: Destaque pago para profissionais (similar a lojas), fees de transações futuras
- **Retenção**: Usuários voltam para encontrar serviços → aumento de DAU
- **Diferenciação**: Competidores (OLX, Standvirtual) não têm integração de serviços automotivos
- **Network effect**: Mais profissionais atraem mais usuários; mais usuários atraem mais profissionais

### Casos de Uso
1. Usuário com carro quebrado → busca "mecânico perto de mim" → encontra + avalia
2. Usuário quer pneu novo → busca "borracharia" → vê preços + horário → entra em contato
3. Profissional novo → se cadastra → recebe contatos → ganha reputação → destaca-se

---

## 2. Arquitetura de Dados (Firestore)

### 2.1 Collection: `profissionais`

```typescript
interface Profissional {
  // Identificadores
  id: string;                          // UUID, gerado automaticamente
  userId: string;                      // FK → users.uid (proprietário)
  
  // Dados Básicos
  nome: string;                        // "João da Mecânica" ou "Oficina Premium"
  descricao: string;                   // até 500 caracteres
  tipoRegistro: 'pf' | 'pj';           // Pessoa Física ou Jurídica
  nif?: string;                        // NIF/CNPJ (opcional público)
  
  // Fotos
  fotos: {
    [key: string]: {
      url: string;                     // Firebase Storage URL
      storagePath: string;
      uploadoEm: Timestamp;
      ordem: number;                   // para ordenação customizada
    };
  };
  fotoPrincipal?: string;              // key de fotos.* para thumbnail
  
  // Categorias (múltipla escolha)
  categorias: Array<
    'mecanico_geral' |
    'oficina_mecanica' |
    'eletricista_automotivo' |
    'borracharia' |
    'funileiro_pintor' |
    'lojista_pecas' |
    'centro_suspensao' |
    'escapamento' |
    'ar_condicionado' |
    'alinhamento' |
    'blindagem' |
    'customizacao' |
    'detailing'
  >;
  
  // Localização
  endereco: {
    rua: string;
    numero: string;
    complemento?: string;
    cep: string;
    localidade: string;                // "Porto"
    distrito: string;                  // "Porto"
    latitude: number;
    longitude: number;
  };
  raioAtendimento: {
    ativo: boolean;
    km: number;                        // 0 = no local apenas, 50 = até 50km
  };
  
  // Contato
  telefone: string;                    // +351 XXX XXX XXX
  whatsapp?: string;                   // diferente de telefone se aplicável
  email?: string;                      // email comercial
  website?: string;
  instagram?: string;
  facebook?: string;
  
  // Horário de Funcionamento
  horario: {
    [dia: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom']: {
      aberto: boolean;
      abertura: string;                // "08:30"
      fechamento: string;              // "18:00"
      intervalo?: { inicio: string; fim: string }; // ex: 12:00–13:00
    };
  };
  
  // Serviços & Preços
  servicos: {
    [id: string]: {
      nome: string;                    // "Troca de óleo"
      categoria?: string;              // "Manutenção"
      precoMedio?: number;             // em € (pode ser null se "consultar")
      precoMinimo?: number;
      precoMaximo?: number;
      tempo?: string;                  // "30 min", "2h", etc
      descricao?: string;
      ativo: boolean;
    };
  };
  
  formasPagamento: Array<
    'dinheiro' |
    'cartao_credito' |
    'cartao_debito' |
    'transferencia' |
    'paypal' |
    'mbway'
  >;
  
  // Status & Verificação
  status: 'solicitacao' | 'ativo' | 'pausado' | 'rejeitado';
  verificado: boolean;
  seloVerificacao?: {
    emitidoEm: Timestamp;
    validadeAte?: Timestamp;           // renovação anual
    tipoVerificacao: 'comprovante_endereco' | 'documento_identidade' | 'nif_pj';
  };
  
  // Documentos de Verificação
  documentos: {
    comprovante?: string;              // storage path
    documento?: string;                // storage path
    uploadosEm?: Timestamp;
    analisadoEm?: Timestamp;
    analisadoPor?: string;             // UID do moderador
    motejvoRejeicao?: string;
  };
  
  // Reputação
  reputacao: {
    mediaAvaliacao: number;            // 0–5
    totalAvaliacoes: number;
    totalContatos: number;
    respondeEm: number;                // minutos (tempo médio resposta chat)
    ultimaAtualizacao: Timestamp;
  };
  
  // Destaque Pago
  destaque: {
    ativo: boolean;
    tipo?: 'diario' | 'semanal' | 'mensal';
    dataInicio?: Timestamp;
    dataFim?: Timestamp;
    posicao?: number;                  // ordem na busca
    recorrente?: boolean;
  };
  
  // Denúncias & Moderação
  denuncias: {
    total: number;
    motivos: {
      [motivo: 'fake' | 'spam' | 'conteudo_ofensivo' | 'golpe']: number;
    };
    verificadas: number;               // quantas resultaram em ação
    ativa: boolean;                    // se tem investigação em andamento
  };
  
  // Timestamps
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
  deletadoEm?: Timestamp;              // soft delete
  
  // Estatísticas (desnormalizadas)
  stats: {
    visualizacoes: number;
    visualizacoes7Dias: number;
    contatos7Dias: number;
    contatosTotais: number;
  };
}
```

### 2.2 Collection: `avaliacoes_profissionais`

```typescript
interface AvaliacaoProfissional {
  id: string;
  profissionalId: string;              // FK → profissionais.id
  usuarioId: string;                   // FK → users.uid
  
  nota: number;                        // 1–5
  titulo: string;                      // "Excelente trabalho"
  comentario: string;                  // até 500 caracteres
  
  // Detalhes do serviço
  servicoId?: string;                  // qual serviço foi avaliado
  servicoNome?: string;
  dataServico?: Timestamp;
  
  // Imagens (fotos do resultado)
  fotos?: string[];                    // storage paths
  
  // Metadados de confiabilidade
  verificada: boolean;                 // humano confirmou que é genuína
  uteis: number;                       // contagem de "helpful"
  denuncias: number;
  motivoDenuncia?: string;
  
  criadaEm: Timestamp;
  atualizadaEm: Timestamp;
}
```

### 2.3 Collection: `orcamentos_profissionais`

Requisições de orçamento (CRM simples):

```typescript
interface OrcamentoProfissional {
  id: string;
  profissionalId: string;
  usuarioId: string;
  
  titulo: string;                      // "Troca de pastilhas de freio"
  descricao: string;
  categorias: string[];
  
  status: 'aberto' | 'respondido' | 'aceito' | 'rejeitado' | 'fechado';
  
  // Resposta do profissional
  respostaEm?: Timestamp;
  orcamentoValor?: number;
  orcamentoNota?: string;
  
  // Conversa integrada (via chat existente)
  chatId?: string;                     // FK → chats.id
  
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}
```

### 2.4 Collection: `denuncias_profissionais`

Sistema de moderação:

```typescript
interface DenunciaProfissional {
  id: string;
  profissionalId: string;
  denunciantId: string;                // usuário que denunciou
  
  motivo: 'fake' | 'spam' | 'conteudo_ofensivo' | 'golpe' | 'outro';
  descricao: string;
  provas?: string[];                   // storage paths (screenshots, etc)
  
  status: 'aberta' | 'investigando' | 'fechada' | 'acao_tomada';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  
  // Investigação
  investigadorId?: string;             // admin responsável
  acaoTomada?: 'suspenso' | 'banido' | 'aviso' | 'rejeitado';
  notas?: string;
  
  criadaEm: Timestamp;
  investigadaEm?: Timestamp;
}
```

### 2.5 Collection: `destaque_profissionais`

Histórico de compras de destaque:

```typescript
interface DestaqueProf {
  id: string;
  profissionalId: string;
  userId: string;
  
  tipo: 'diario' | 'semanal' | 'mensal';
  quantidade: number;
  
  valor: number;                       // em €
  moeda: 'EUR';
  
  dataInicio: Timestamp;
  dataFim: Timestamp;
  status: 'aguardando_pagamento' | 'pago' | 'expirado';
  metodo?: 'stripe' | 'paypal';
  referenciaPagamento?: string;
  
  recorrente: boolean;
  
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}
```

### 2.6 Atualizar Collection: `users`

Adicionar campos:

```typescript
interface Usuario {
  // ... campos existentes ...
  
  profissionalId?: string;             // FK → profissionais.id (null se não é profissional)
  ehProfissional: boolean;
}
```

### 2.7 Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "profissionais",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "verificado", "order": "ASCENDING"},
        {"fieldPath": "reputacao.mediaAvaliacao", "order": "DESCENDING"},
        {"fieldPath": "atualizadoEm", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "profissionais",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "categorias", "order": "ASCENDING"},
        {"fieldPath": "destaque.ativo", "order": "DESCENDING"},
        {"fieldPath": "reputacao.mediaAvaliacao", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "profissionais",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "endereco.distrito", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "reputacao.mediaAvaliacao", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "avaliacoes_profissionais",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "profissionalId", "order": "ASCENDING"},
        {"fieldPath": "verificada", "order": "DESCENDING"},
        {"fieldPath": "criadaEm", "order": "DESCENDING"}
      ]
    }
  ]
}
```

---

## 3. Fluxo de Onboarding & Verificação

### 3.1 Alto-Nível

```
Novo Profissional
    ↓
[Tela: "Cadastre seu Negócio"]
    ↓
Preenche: nome, categoria, endereço, fotos, serviços
    ↓
Upload de documentos (comprovante endereço ou NIF)
    ↓
Perfil criado com status = 'solicitacao'
    ↓
[Sistema] Validações automáticas
    ↓
[Moderador] Análise manual (fotos, dados, documentos)
    ↓
Aprovado (status = 'ativo') ou Rejeitado
    ↓
Se verificado → recebe selo + prioridade em busca
```

### 3.2 Página: `/profissionais/cadastro` (Client Component)

**Fluxo multi-step:**

1. **Passo 1: Tipo & Categoria**
   - Radio: "Sou pessoa física" / "Sou empresa"
   - Checkboxes: selecionar categorias (obrigatório: 1+)
   - BTN: "Próximo"

2. **Passo 2: Informações Básicas**
   - Nome do profissional/empresa
   - Descrição (textarea, max 500 chars)
   - Email comercial
   - Telefone + WhatsApp
   - BTN: "Próximo"

3. **Passo 3: Localização**
   - Autocomplete de endereço (Google Places ou Mapbox)
   - Mapa: visualizar pin
   - Raio de atendimento (slider: 0–100 km)
   - BTN: "Próximo"

4. **Passo 4: Fotos**
   - Upload de 2–8 fotos (estabelecimento, trabalhos)
   - Compressão automática (Sharp)
   - Preview + reordenação (drag-drop)
   - BTN: "Próximo"

5. **Passo 5: Horário**
   - Table com 7 dias
   - Toggle "Aberto" + inputs de horário
   - Intervalo opcional (lunch break)
   - BTN: "Próximo"

6. **Passo 6: Serviços**
   - Form repetível: nome + preço (ou "Consultar") + tempo estimado
   - Add/remove rows dinamicamente
   - BTN: "Próximo"

7. **Passo 7: Pagamento & Documentos**
   - Formas de pagamento (checkboxes)
   - Upload de comprovante endereço (conta, hipoteca) OU documento NIF
   - Checkbox: "Concordo com Termos"
   - BTN: "Submeter Cadastro"

**Tech:** Form com `react-hook-form` + `zod` (validação)

### 3.3 Validações Automáticas (Backend)

```typescript
async function validarCadastroProfissional(profId: string): Promise<ValidationResult> {
  const prof = await getDoc(doc(db, 'profissionais', profId));
  const erros: string[] = [];

  // 1. Categorias selecionadas
  if (!prof.categorias || prof.categorias.length === 0) {
    erros.push('Selecione ao menos uma categoria');
  }

  // 2. Fotos presentes (mínimo 2)
  const fotoCount = Object.keys(prof.fotos || {}).length;
  if (fotoCount < 2) {
    erros.push('Mínimo 2 fotos necessárias');
  }

  // 3. Serviços cadastrados (mínimo 1)
  const servicoCount = Object.keys(prof.servicos || {}).length;
  if (servicoCount === 0) {
    erros.push('Cadastre ao menos um serviço');
  }

  // 4. Documentos presentes
  if (!prof.documentos.comprovante && !prof.documentos.documento) {
    erros.push('Envie comprovante de endereço ou documento de identificação');
  }

  // 5. Endereço buscável
  try {
    const coords = await geocodeEndereco(prof.endereco);
    if (!coords) {
      erros.push('Endereço não encontrado. Verifique e tente novamente.');
    }
  } catch (e) {
    erros.push('Erro ao validar endereço');
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
```

### 3.4 Análise Manual (Painel Moderador)

**Nova página: `app/admin/profissionais/verificacoes/page.tsx`**

Interface com:
- Fila de solicitações (status = 'solicitacao')
- Card com fotos (gallery), dados e documentos lado-a-lado
- Checklist automático
- Botões: "Aprovar" / "Solicitar Ajustes" / "Rejeitar com Motivo"
- Chat simples para se comunicar com o profissional (email)

**Permissões**: apenas admin (`role === 'admin'`)

### 3.5 Aprovação

```typescript
async function aprovarCadastroProfissional(profId: string, moderadorId: string) {
  const profRef = doc(db, 'profissionais', profId);
  const prof = await getDoc(profRef);

  const novoSelo = {
    emitidoEm: Timestamp.now(),
    validadeAte: Timestamp.fromDate(addYears(new Date(), 1)),
    tipoVerificacao: prof.documentos.comprovante ? 'comprovante_endereco' : 'documento_identidade',
  };

  await updateDoc(profRef, {
    status: 'ativo',
    verificado: true,
    seloVerificacao: novoSelo,
    'documentos.analisadoEm': Timestamp.now(),
    'documentos.analisadoPor': moderadorId,
  });

  // Notificar profissional
  await enviarNotificacao(prof.userId, {
    titulo: 'Seu cadastro foi aprovado! 🎉',
    mensagem: 'Você já pode receber contatos de clientes.',
    tipo: 'profissionalAprovado',
    acao: { texto: 'Ver meu perfil', rota: `/profissionais/${profId}` },
  });

  // Analytics
  await logModeracao({
    tipo: 'aprovacao_profissional',
    profissionalId: profId,
    moderadorId,
    timestamp: Timestamp.now(),
  });
}
```

---

## 4. Telas Principais & Navegação

### 4.1 Nova Seção: `/profissionais` (Hub)

**Página**: `app/profissionais/page.tsx` (Server Component + Client filters)

**Layout:**
- Hero banner: "Encontre o profissional certo para seu carro"
- Barra de busca + geolocalização (botão "Usar minha localização")
- 3 abas de categorias em featured (ex: "Mecânicos", "Borracharias", "Eletricistas")
- Mapa interativo (Mapbox) com pins dos profissionais próximos
- Grid de cards de profissionais com destaque
- Filtros (sticky): categoria, distância, avaliação, preço

**Cache**: ISR 10min

### 4.2 Página: `/profissionais/[id]` (Server Component)

**Meta tags dinâmicas**: `og:title`, `og:image` (foto principal)

**Layout:**
- Header com fotos (carousel/gallery)
- Info principal: nome, categorias, verificado✓, avaliação ⭐
- Seção "Sobre": descrição + horário + endereço (com mapa small)
- Seção "Serviços": tabela com nome, preço, tempo
- Seção "Avaliações": grid de cards com comentários, fotos, nota
- Seção "Localização": mapa full com raio de atendimento
- CTA botões: "Solicitar Orçamento" + "Ligar" + "WhatsApp"
- Stats: "234 visualizações", "12 contatos", "4.8⭐"

**Cache**: ISR 5min

### 4.3 Página: `/profissionais/[id]/editar` (Client Component)

Dashboard do profissional com abas:

1. **Perfil**: editar dados, fotos, descrição, horário
2. **Serviços**: gerenciar lista de serviços (add/edit/delete)
3. **Orçamentos**: inbox de requisições com status + responder
4. **Avaliações**: ver comentários, responder, reportar fake
5. **Estatísticas**: gráficos de visualizações, contatos, converção
6. **Configurações**: pausar perfil, privacidade, destaque pago

**Permissões**: apenas proprietário (`userId === auth.uid`) ou admin

### 4.4 Integração com Busca Principal

**Adicionar aba na home:**
```
[Carros] [Peças] [Profissionais] [Lojas]
```

Ao clicar em "Profissionais" → navegaçãopara `/profissionais`

**Filtros adicionais em `src/components/home/FilterChips.tsx`:**
```typescript
{
  tipo: 'tipo_vendedor',
  opcoes: [
    { label: 'Carros', valor: 'carros' },
    { label: 'Peças', valor: 'pecas' },
    { label: 'Profissionais', valor: 'profissionais' },
    { label: 'Lojas', valor: 'lojas' },
  ],
}
```

### 4.5 Chat Integrado

**Reutilizar chat existente** (`src/components/chat/`):
- Nova thread de chat ao clicar "Solicitar Orçamento"
- Automaticamente vinculado ao `orcamentos_profissionais` doc
- Profissional recebe notificação em tempo real

---

## 5. API Endpoints

### 5.1 CRUD de Profissionais

**Backend**: `src/lib/db.ts` + Cloud Functions

```typescript
// CREATE
async function criarProfissional(
  userId: string,
  dados: ProfissionalFormData
): Promise<string> {
  const profId = generateId();
  const validacao = await validarCadastroProfissional({
    ...dados,
    id: profId,
  });
  
  if (!validacao.valido) throw new Error(validacao.erros.join(', '));

  await setDoc(doc(db, 'profissionais', profId), {
    ...dados,
    id: profId,
    userId,
    status: 'solicitacao',
    verificado: false,
    reputacao: {
      mediaAvaliacao: 0,
      totalAvaliacoes: 0,
      totalContatos: 0,
      respondeEm: 0,
      ultimaAtualizacao: Timestamp.now(),
    },
    denuncias: {
      total: 0,
      motivos: {},
      verificadas: 0,
      ativa: false,
    },
    stats: {
      visualizacoes: 0,
      visualizacoes7Dias: 0,
      contatos7Dias: 0,
      contatosTotais: 0,
    },
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  });

  // Notificar moderadores
  await enviarNotificacaoAosTimes('moderadores', {
    titulo: 'Novo cadastro de profissional',
    mensagem: `${dados.nome} enviou solicitação de cadastro`,
  });

  return profId;
}

// READ
async function getProfissional(profId: string): Promise<Profissional> {
  const doc = await getDoc(doc(db, 'profissionais', profId));
  if (!doc.exists()) throw new Error('Profissional não encontrado');
  return doc.data() as Profissional;
}

// UPDATE
async function atualizarProfissional(
  profId: string,
  userId: string,
  updates: Partial<Profissional>
) {
  const prof = await getProfissional(profId);
  if (prof.userId !== userId) throw new Error('Não autorizado');

  await updateDoc(doc(db, 'profissionais', profId), {
    ...updates,
    atualizadoEm: Timestamp.now(),
  });
}

// DELETE (soft delete)
async function deletarProfissional(profId: string, userId: string) {
  const prof = await getProfissional(profId);
  if (prof.userId !== userId) throw new Error('Não autorizado');

  await updateDoc(doc(db, 'profissionais', profId), {
    deletadoEm: Timestamp.now(),
    status: 'pausado',
  });
}
```

### 5.2 Busca Geoespacial

**Usar Firestore GeoHash + Algolia/Meilisearch**

```typescript
// src/lib/search.ts
import { geohashForLocation } from 'geofire-common';

async function buscarProfissionaisPorLocalidade(
  latitude: number,
  longitude: number,
  radiusKm: number = 50,
  categoria?: string,
  filtros?: {
    minAvaliacao?: number;
    precoMax?: number;
  }
): Promise<Profissional[]> {
  // 1. Geoquery com Firestore
  const bounds = geohashQueryBounds([latitude, longitude], radiusKm * 1000);
  
  const queries = bounds.map(b =>
    query(
      collection(db, 'profissionais'),
      where('status', '==', 'ativo'),
      where('geohash', '>=', b[0]),
      where('geohash', '<=', b[1]),
      ...(categoria ? [where('categorias', 'array-contains', categoria)] : []),
      orderBy('geohash')
    )
  );

  let resultados: Profissional[] = [];
  for (const q of queries) {
    const snap = await getDocs(q);
    resultados.push(...snap.docs.map(d => d.data() as Profissional));
  }

  // 2. Filtrar por distância real + critérios
  resultados = resultados
    .map(p => ({
      ...p,
      distancia: getDistance([latitude, longitude], [p.endereco.latitude, p.endereco.longitude]),
    }))
    .filter(p => p.distancia <= radiusKm)
    .filter(p => !filtros?.minAvaliacao || p.reputacao.mediaAvaliacao >= filtros.minAvaliacao);

  // 3. Ordenar
  return resultados.sort((a, b) => {
    // Destaque ativo em primeiro
    if (a.destaque.ativo && !b.destaque.ativo) return -1;
    if (!a.destaque.ativo && b.destaque.ativo) return 1;
    
    // Depois por avaliação
    if (a.reputacao.mediaAvaliacao !== b.reputacao.mediaAvaliacao) {
      return b.reputacao.mediaAvaliacao - a.reputacao.mediaAvaliacao;
    }
    
    // Depois por distância
    return a.distancia - b.distancia;
  });
}
```

**Alternativa com Meilisearch** (melhor performance com 10k+ profissionais):

```typescript
async function buscarProfissionaisMeilisearch(
  latitude: number,
  longitude: number,
  radiusKm: number,
  categoria?: string
): Promise<Profissional[]> {
  const results = await meilisearch.index('profissionais').search('', {
    filter: [
      `status = "ativo"`,
      ...(categoria ? [`categorias = "${categoria}"`] : []),
    ],
    sort: [
      `_geoPoint(${latitude}, ${longitude}):asc`,
    ],
    limit: 100,
  });

  return results.hits.filter(p => {
    const dist = getDistance([latitude, longitude], [p.latitude, p.longitude]);
    return dist <= radiusKm;
  }) as Profissional[];
}
```

### 5.3 Avaliações

```typescript
// CREATE
async function criarAvaliacaoProfissional(
  profissionalId: string,
  usuarioId: string,
  dados: {
    nota: number;
    titulo: string;
    comentario: string;
    servicoId?: string;
  }
): Promise<string> {
  // 1. Validar que usuário tem relação com profissional (chat ou orçamento)
  const conversas = await getDocs(
    query(
      collection(db, 'messages'),
      where('participantes', 'array-contains', usuarioId),
      where('profissionalId', '==', profissionalId)
    )
  );
  
  if (conversas.empty) throw new Error('Sem autorização para avaliar');

  // 2. Criar avaliação
  const avalId = generateId();
  await setDoc(doc(db, 'avaliacoes_profissionais', avalId), {
    id: avalId,
    profissionalId,
    usuarioId,
    ...dados,
    verificada: false,
    uteis: 0,
    denuncias: 0,
    criadaEm: Timestamp.now(),
    atualizadaEm: Timestamp.now(),
  });

  // 3. Invalidar cache de reputação
  await invalidarReputacao(profissionalId);

  // 4. Notificar profissional
  await enviarNotificacao(profissionalId, {
    titulo: 'Nova avaliação',
    mensagem: `${dados.titulo} - ${dados.nota}⭐`,
  });

  return avalId;
}

// READ
async function getAvaliacesProfissional(
  profissionalId: string,
  limit: number = 20
): Promise<AvaliacaoProfissional[]> {
  const snap = await getDocs(
    query(
      collection(db, 'avaliacoes_profissionais'),
      where('profissionalId', '==', profissionalId),
      where('verificada', '==', true),
      orderBy('criadaEm', 'desc'),
      limit(limit)
    )
  );
  return snap.docs.map(d => d.data() as AvaliacaoProfissional);
}
```

### 5.4 Orçamentos

```typescript
// CREATE
async function criarOrcamento(
  profissionalId: string,
  usuarioId: string,
  dados: {
    titulo: string;
    descricao: string;
    categorias: string[];
  }
): Promise<string> {
  const orcId = generateId();

  // 1. Criar orçamento
  await setDoc(doc(db, 'orcamentos_profissionais', orcId), {
    id: orcId,
    profissionalId,
    usuarioId,
    ...dados,
    status: 'aberto',
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  });

  // 2. Criar chat automático
  const chatId = await criarChatProfissional(
    usuarioId,
    profissionalId,
    `Orçamento: ${dados.titulo}`,
    orcId
  );
  
  await updateDoc(doc(db, 'orcamentos_profissionais', orcId), {
    chatId,
  });

  // 3. Notificar profissional
  await enviarNotificacao(profissionalId, {
    titulo: 'Novo orçamento solicitado',
    mensagem: dados.titulo,
    acao: { texto: 'Responder', rota: `/profissionais/[id]/editar?tab=orcamentos` },
  });

  // 4. Update stats
  await updateDoc(doc(db, 'profissionais', profissionalId), {
    'stats.contatosTotais': increment(1),
    'stats.contatos7Dias': increment(1),
  });

  return orcId;
}
```

---

## 6. Sistema de Moderação & Denúncia

### 6.1 Tipos de Denúncia

| Motivo | Descrição | Ação |
|--------|-----------|------|
| `fake` | Perfil falso, não existe | Revisão manual, possível ban |
| `spam` | Spam, conteúdo repetido | Aviso → suspensão se repetir |
| `conteudo_ofensivo` | Discriminação, abuso | Suspensão imediata |
| `golpe` | Fraude, cobrança indevida | Investigação + ban |

### 6.2 Fluxo de Denúncia

**Tela: `/profissionais/[id]` → menu "..." → "Denunciar"**

Modal com:
- Radio buttons: motivo (obrigatório)
- Textarea: descrição (opcional)
- File upload: provas (screenshot, etc)
- Checkbox: "Permitir contato para mais info"
- BTN: "Enviar Denúncia"

```typescript
async function denunciarProfissional(
  profissionalId: string,
  denunciantId: string,
  motivo: 'fake' | 'spam' | 'conteudo_ofensivo' | 'golpe' | 'outro',
  descricao: string
): Promise<void> {
  const denunciaId = generateId();

  await setDoc(doc(db, 'denuncias_profissionais', denunciaId), {
    id: denunciaId,
    profissionalId,
    denunciantId,
    motivo,
    descricao,
    status: 'aberta',
    prioridade: motivo === 'golpe' ? 'critica' : 'media',
    criadaEm: Timestamp.now(),
    atualizadaEm: Timestamp.now(),
  });

  // Update profissional stats
  await updateDoc(doc(db, 'profissionais', profissionalId), {
    'denuncias.total': increment(1),
    [`denuncias.motivos.${motivo}`]: increment(1),
  });

  // Alert moderadores
  await enviarAlertaModerador({
    titulo: `Nova denúncia: ${motivo}`,
    profissionalId,
    prioridade: motivo === 'golpe' ? 'high' : 'medium',
  });
}
```

### 6.3 Painel de Moderador

**Página: `app/admin/profissionais/denuncias/page.tsx`**

Fila com:
- Status filter (aberta, investigando, etc)
- Prioridade (critica, alta, media, baixa)
- Profile side-by-side com denúncia + histórico
- Botões de ação:
  - "Arquivar" (falso alarme)
  - "Avisar" (email ao profissional)
  - "Suspender 7 dias"
  - "Banir permanentemente"
- Notas internas
- Log de todas as ações

### 6.4 Ações Automáticas

```typescript
// Cloud Function: denuncias_profissionais.onCreate
async function onNovaDenuncia(denunciaId: string) {
  const denuncia = await getDoc(doc(db, 'denuncias_profissionais', denunciaId));
  
  // Se 5+ denúncias de mesmo motivo em 7 dias → suspensão automática
  const recentes = await getDocs(
    query(
      collection(db, 'denuncias_profissionais'),
      where('profissionalId', '==', denuncia.profissionalId),
      where('criadaEm', '>', Timestamp.fromDate(addDays(new Date(), -7)))
    )
  );

  if (recentes.size >= 5) {
    await suspenderProfissional(denuncia.profissionalId, 'AUTOMATIC', '7 dias');
  }
}

async function suspenderProfissional(
  profId: string,
  moderadorId: string,
  duracao: string
) {
  const dataReativacao = addDays(new Date(), duracao.includes('7') ? 7 : 30);

  await updateDoc(doc(db, 'profissionais', profId), {
    status: 'pausado',
    'denuncias.ativa': true,
    atualizadoEm: Timestamp.now(),
  });

  // Schedule reativação
  await createTask({
    name: `reativar-profissional-${profId}`,
    scheduleTime: Timestamp.fromDate(dataReativacao),
    httpRequest: {
      uri: `${BACKEND_URL}/api/profissionais/${profId}/reativar`,
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    },
  });

  // Notificar profissional
  await enviarEmail(prof.email, {
    assunto: 'Seu perfil foi suspenso temporariamente',
    body: `Sua conta foi suspenso por ${duracao}. Será reativada em ${dataReativacao.toLocaleDateString('pt-PT')}.`,
  });
}
```

---

## 7. Busca Geoespacial com Mapa Interativo

### 7.1 Componente: `src/components/profissionais/MapaProfissionais.tsx`

**Tech**: Mapbox GL (já usado no ReparAuto)

```typescript
import MapboxGl from 'mapbox-gl';

export function MapaProfissionais({
  profissionais,
  localizacaoUsuario,
  radiusKm,
  onSelectProfissional,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // só inicializar uma vez

    map.current = new MapboxGl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [localizacaoUsuario.lon, localizacaoUsuario.lat],
      zoom: 12,
    });

    // Adicionar círculo de raio
    map.current.on('load', () => {
      map.current.addSource('raio-usuario', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [localizacaoUsuario.lon, localizacaoUsuario.lat],
          },
        },
      });

      map.current.addSource('raio-buffer', {
        type: 'geojson',
        data: turf.circle([localizacaoUsuario.lon, localizacaoUsuario.lat], radiusKm),
      });

      map.current.addLayer({
        id: 'raio-buffer-layer',
        type: 'fill',
        source: 'raio-buffer',
        paint: {
          'fill-color': '#088',
          'fill-opacity': 0.1,
        },
      });

      // Adicionar pins de profissionais
      profissionais.forEach(prof => {
        const el = document.createElement('div');
        el.className = 'marker-profissional';
        el.innerHTML = `
          <div class="marker-pin">
            ${prof.reputacao.mediaAvaliacao >= 4.5 ? '⭐' : ''}
          </div>
        `;

        new MapboxGl.Marker(el)
          .setLngLat([prof.endereco.longitude, prof.endereco.latitude])
          .addTo(map.current);

        el.addEventListener('click', () => onSelectProfissional(prof.id));
      });
    });
  }, [profissionais, localizacaoUsuario]);

  return <div ref={mapContainer} style={{ width: '100%', height: '500px' }} />;
}
```

---

## 8. Reputação Desnormalizada & Cache

### 8.1 Recalcular Reputação (Job diário, 02:30 UTC)

```typescript
async function atualizarReputacaoProfissional(profId: string) {
  const prof = await getDoc(doc(db, 'profissionais', profId));

  // 1. Média de avaliações (verificadas apenas)
  const avaliacoes = await getDocs(
    query(
      collection(db, 'avaliacoes_profissionais'),
      where('profissionalId', '==', profId),
      where('verificada', '==', true)
    )
  );

  const notas = avaliacoes.docs.map(d => d.data().nota);
  const mediaAvaliacao = notas.length > 0 ? 
    notas.reduce((a, b) => a + b) / notas.length : 0;

  // 2. Tempo médio resposta (últimos 30 dias)
  const mensagensRecentes = await getDocs(
    query(
      collection(db, 'messages'),
      where('profissionalId', '==', prof.userId),
      where('criadaEm', '>', Timestamp.fromDate(addDays(new Date(), -30)))
    )
  );

  const temposResposta = [];
  for (const msg of mensagensRecentes.docs) {
    if (msg.data().respondidoEm) {
      const delay = msg.data().respondidoEm.seconds - msg.data().criadaEm.seconds;
      temposResposta.push(delay / 60); // converter para minutos
    }
  }

  const respondeEm = temposResposta.length > 0 ?
    temposResposta.reduce((a, b) => a + b) / temposResposta.length : 0;

  await updateDoc(doc(db, 'profissionais', profId), {
    'reputacao.mediaAvaliacao': mediaAvaliacao,
    'reputacao.totalAvaliacoes': avaliacoes.size,
    'reputacao.respondeEm': respondeEm,
    'reputacao.ultimaAtualizacao': Timestamp.now(),
  });

  // Invalidar cache
  await redis.del(`prof:${profId}:reputacao`);
}
```

### 8.2 Cache com Redis

```typescript
async function getReputacaoProfissional(profId: string): Promise<Reputacao> {
  const cached = await redis.get(`prof:${profId}:reputacao`);
  if (cached) return JSON.parse(cached);

  const prof = await getDoc(doc(db, 'profissionais', profId));
  const reputacao = prof.data().reputacao;

  // Cache por 24h
  await redis.setex(`prof:${profId}:reputacao`, 86400, JSON.stringify(reputacao));
  return reputacao;
}
```

---

## 9. Integração com WhatsApp & CRM

### 9.1 Botão "Contatar via WhatsApp"

Se profissional tem WhatsApp cadastrado:

```tsx
<a
  href={`https://wa.me/${profissional.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá! Vi seu perfil no ReparAuto e gostaria de solicitar um orçamento para: [descrição do serviço]`
  )}`}
  target="_blank"
  className="btn btn-success"
>
  💬 Contatar via WhatsApp
</a>
```

### 9.2 CRM Simples (Painel do Profissional)

Aba "Orçamentos" mostra:
- Inbox com requisições (ordenadas por data)
- Status: "Aberto" (responder), "Respondido" (aguardando cliente), "Aceito"
- Botão "Responder": abre chat integrado
- Botão "Enviar Orçamento": modal com inputs de valor + nota
- Histórico de conversa inline

---

## 10. Estimativa de Tempo & Equipe

### 10.1 Breakdown por Módulo

| Módulo | Tarefas | Dev | QA | Design | Total (dias) |
|--------|---------|-----|-----|--------|--------------|
| **Estrutura BD + API** | Schema, indexes, CRUD | 3 | 2 | — | 5 |
| **Validações & Backend** | Validação auto, Cloud Functions | 3 | 2 | — | 5 |
| **Onboarding Form** | Multi-step form, upload, geocoding | 3 | 2 | 2 | 7 |
| **Painel Moderador** | Fila de aprovação, análise | 2 | 1 | 1 | 4 |
| **Página de Profissional** | Server Component, avaliações | 3 | 2 | 1 | 6 |
| **Dashboard Profissional** | Edição, orçamentos, stats | 3 | 2 | 1 | 6 |
| **Busca & Mapa** | Geofencing, Mapbox, Meilisearch | 4 | 2 | 1 | 7 |
| **Avaliações** | Form, verificação, moderação | 2 | 1 | 1 | 4 |
| **Denúncias & Moderação** | Sistema completo, ações automáticas | 3 | 2 | — | 5 |
| **Integração Chat** | Reutilizar chat, orçamentos | 2 | 1 | — | 3 |
| **Destaque Pago** | Stripe, renovação automática | 2 | 1 | — | 3 |
| **Testes & Deploy** | E2E, load tests, Firebase deploy | 2 | 3 | — | 5 |

**Total: 13–15 semanas (1 time full-stack de 2–3 pessoas)**

### 10.2 Equipe Recomendada

```
Cenário 1: Time enxuto (4–5 pessoas, 15 semanas)
├─ 1 Full-Stack Engineer (70%)
├─ 1 Backend Engineer (50%)
├─ 1 UI/UX Designer (40%)
├─ 1 QA Engineer (70%)
└─ 1 Moderador Pilot (20%, análise manual inicial)

Cenário 2: Time dedicado (10 semanas, 2 devs)
├─ 2 Full-Stack Engineers (100% cada)
├─ 1 Designer (shared, 30%)
└─ 1 QA (part-time, 50%)
```

### 10.3 Roadmap de Entrega

```
Semana 1–2:   Design + Setup BD + Validações
Semana 3–5:   Onboarding Form + Painel Moderador
Semana 6–8:   Páginas de Profissional + Dashboard
Semana 9–11:  Busca Geo + Mapa + Avaliações
Semana 12–13: Denúncias + Chat + Destaque Pago
Semana 14–15: Testes + Otimização + Deploy
```

---

## 11. Riscos Técnicos & Mitigações

### 11.1 Performance de Geosearch com Muitos Profissionais

**Risco**: 10k+ profissionais causam queries lentas.

**Mitigação**:
- ✅ Usar Meilisearch com `_geoPoint()` (índice dedicado)
- ✅ Firestore geohashing (fallback)
- ✅ Cache Redis de resultado de busca por 5min
- ✅ Pagination (máx 50 resultados por página)

### 11.2 Spam & Perfis Falsos

**Risco**: Muitos cadastros fake, denúncias mal-intencionadas.

**Mitigação**:
- ✅ Análise manual obrigatória de fotos + documentos
- ✅ Validação de NIF/CNPJ em tempo real (API gov PT)
- ✅ Limite de 1 profissional por email
- ✅ Ação automática: 5+ denúncias = suspensão automática
- ✅ Score de confiabilidade (novo, sem avaliações, etc)

### 11.3 Avaliações Falsas (Gaming)

**Risco**: Profissional compra avaliações 5⭐, prejudica concorrência.

**Mitigação**:
- ✅ Validar que avaliador tem histórico de contato com profissional
- ✅ Marcar avaliação como "verificada" apenas se contato via chat/orçamento
- ✅ Detectar padrão: múltiplas avaliações do mesmo email em curto tempo
- ✅ Moderador humano revisa avaliações suspeitas

### 11.4 Escalabilidade de Chat Realtime

**Risco**: Muitos profissionais + muitos chats = congestionamento Firestore.

**Mitigação**:
- ✅ Usar Firestore `onSnapshot` com unsubscribe automático
- ✅ Pagination de histórico: carregar últimas 50 msgs
- ✅ Limite: máx 20 listeners por usuário
- ✅ Cloud Pub/Sub para notificações (não via Firestore)

### 11.5 Segurança: Documentos Sensíveis

**Risco**: NIF/CNPJ expostos, documentos acessados sem autorização.

**Mitigação**:
- ✅ Storage Rules: apenas proprietário + admin podem ler
- ✅ Nunca expor NIF em público (só manter em doc privado)
- ✅ Antivírus em upload (ClamAV)
- ✅ Audit log de quem acessou documentos
- ✅ GDPR: deletar documentos após 2 anos

### 11.6 Fraude: Profissional Desaparece Após Receber Orçamento

**Risco**: Usuário paga adiantado, profissional some.

**Mitigação**:
- ✅ **Não integrar pagamento por ora** (apenas destaque pago)
- ✅ Redirecionar para WhatsApp/chat (transação fora do app)
- ✅ Se implementar pagamento futuro: escrow + mediação de disputa
- ✅ Score de confiabilidade: tempo de resposta, taxa de conclusão

### 11.7 Reputação Desnormalizada Out-of-Sync

**Risco**: Campo `mediaAvaliacao` fica defasado com novas avaliações.

**Mitigação**:
- ✅ Invalidar cache ao criar/deletar avaliação (via Cloud Function)
- ✅ Recalcular job diário (garantia)
- ✅ Admin pode forçar recalcular via button
- ✅ Usar read-time consistency onde crítico

### 11.8 Armazenamento de Fotos Ilimitadas

**Risco**: Cada profissional faz upload de 100+ fotos = quota excedida.

**Mitigação**:
- ✅ Limitar a 20 fotos por profissional
- ✅ Redimensionar + comprimir (Sharp)
- ✅ Manter apenas últimas versões (delete ao reupload)
- ✅ CDN (Cloudflare) para cache e otimização

---

## 12. Firestore Security Rules

```javascript
// firestore.rules (add)
match /profissionais/{profId} {
  // Leitura pública para ativos/verificados
  allow read: if resource.data.status == 'ativo';
  
  // Leitura própria (profissional)
  allow read: if request.auth.uid == resource.data.userId;
  
  // Criação: usuário autenticado
  allow create: if request.auth != null && 
                   request.resource.data.userId == request.auth.uid;
  
  // Update: apenas proprietário ou admin
  allow update: if request.auth.uid == resource.data.userId ||
                   isAdmin(request.auth.uid);
  
  // Delete: soft delete por admin apenas
  allow delete: if isAdmin(request.auth.uid);
}

match /avaliacoes_profissionais/{avalId} {
  // Leitura: pública para verificadas, própria para não verificadas
  allow read: if resource.data.verificada == true ||
                 request.auth.uid == resource.data.usuarioId;
  
  // Criação: user autenticado
  allow create: if request.auth != null &&
                   request.resource.data.usuarioId == request.auth.uid;
  
  // Update/delete: apenas autor ou admin
  allow update, delete: if request.auth.uid == resource.data.usuarioId ||
                           isAdmin(request.auth.uid);
}

match /orcamentos_profissionais/{orcId} {
  // Leitura: proprietário ou profissional
  allow read: if request.auth.uid == resource.data.usuarioId ||
                 request.auth.uid == getProfissional(resource.data.profissionalId).userId;
  
  // Criação: user autenticado
  allow create: if request.auth != null &&
                   request.resource.data.usuarioId == request.auth.uid;
}

match /denuncias_profissionais/{denunciaId} {
  // Leitura: denunciante ou admin
  allow read: if request.auth.uid == resource.data.denunciantId ||
                 isAdmin(request.auth.uid);
  
  // Criação: user autenticado
  allow create: if request.auth != null &&
                   request.resource.data.denunciantId == request.auth.uid;
}

function isAdmin(uid) {
  return get(/databases/$(database)/documents/users/$(uid)).data.role == 'admin';
}

function getProfissional(profId) {
  return get(/databases/$(database)/documents/profissionais/$(profId)).data;
}
```

---

## 13. KPIs & Sucesso

### 13.1 Métricas de Adoção

| KPI | Target | Como Medir |
|-----|--------|-----------|
| Profissionais cadastrados (6 meses) | 500+ | `COUNT(profissionais WHERE status = 'ativo')` |
| % aprovação de cadastros | 70% | `COUNT(aprovados) / COUNT(solicitacoes)` |
| Tempo médio aprovação | < 24h | `timestamp_aprovacao - timestamp_solicitacao` |
| Taxa de rejeição | < 20% | `COUNT(rejeitados) / COUNT(solicitacoes)` |
| Profissionais com destaque pago | 10% | `COUNT(destaque_ativo) / COUNT(ativos)` |

### 13.2 Métricas de Engajamento

| KPI | Target | Como Medir |
|-----|--------|-----------|
| Usuários usando busca de profissionais | 30% MAU | `COUNT(DISTINCT usuarios_que_buscaram)` |
| Orçamentos solicitados/mês | 100+ | `COUNT(orcamentos WHERE status != 'aberto')` |
| Taxa de avaliação | 40% | `COUNT(usuarios_que_avaliaram) / COUNT(usuarios_que_usaram)` |
| Satisfação média de profissional | 4.2⭐ | Média de `avaliacoes.nota` |

### 13.3 Métricas de Qualidade

| KPI | Target | Como Medir |
|-----|--------|-----------|
| Tempo load `/profissionais/[id]` | < 2s | Lighthouse |
| Geosearch (buscar 50 profissionais) | < 500ms | Meilisearch metrics |
| Taxa de denúncias verificadas | 60%+ | `COUNT(investigadas) / COUNT(abertas)` |
| Uptime dashboard profissional | 99.9% | CloudWatch |

---

## 14. Roadmap de Lançamento

### Fase 1: MVP (Semanas 1–10)
- ✅ Firestore schema + validações
- ✅ Onboarding form + aprovação manual
- ✅ Página do profissional (info + avaliações)
- ✅ Busca simples + mapa básico
- ✅ Chat + orçamentos integrados

**Lançamento**: Beta fechado com 50 profissionais (convite)

### Fase 2: Otimização (Semanas 11–15)
- ✅ Meilisearch para busca em escala
- ✅ Dashboard profissional completo (stats, destaque)
- ✅ Sistema de moderação + denúncias
- ✅ Validação automática de NIF/CNPJ
- ✅ Mobile: app nativa (React Native)

**Lançamento**: Beta público

### Fase 3: Expansão (Mês 5+)
- ✅ Destaque pago (Stripe integração)
- ✅ WhatsApp Business API (notificações)
- ✅ Analytics avançado para profissionais
- ✅ Serviços de agendamento (calendário)
- ✅ Integração com Seguradoras (oferta de cobertura)
- ✅ Marketplace de peças (cross-sell)

---

## 15. Stack Técnico

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js 15 App Router | Já usa, SSR/ISR |
| Styling | Tailwind CSS v4 | Já usa, performance |
| Mapa | Mapbox GL | Geosearch visual |
| Busca | Meilisearch | Geo + full-text |
| Cache | Redis | Reputação + resultados |
| BD | Firestore | Já usa, real-time |
| Storage | Firebase Storage | Fotos, documentos |
| Functions | Cloud Functions | Validações, jobs |
| Pagamento | Stripe | Destaque pago |
| Chat | Firestore Realtime | Já usa, integrado |
| Notificações | Cloud Messaging | Push + email |

---

## 16. Exemplo de Documento Firestore

```json
{
  "id": "prof-001",
  "userId": "user-789",
  "nome": "João Silva - Mecânica Geral",
  "descricao": "Mais de 15 anos de experiência em manutenção e reparação de carros nacionais e importados.",
  "tipoRegistro": "pf",
  "nif": "123456789",
  "categorias": ["mecanico_geral", "alinhamento"],
  "endereco": {
    "rua": "Rua da Fábrica",
    "numero": "456",
    "cep": "4000-123",
    "localidade": "Porto",
    "distrito": "Porto",
    "latitude": 41.1579,
    "longitude": -8.6291
  },
  "raioAtendimento": {
    "ativo": true,
    "km": 30
  },
  "telefone": "+351 222 567 890",
  "whatsapp": "+351 966 123 456",
  "email": "joao@mecanicasilva.pt",
  "website": "https://mecanicasilva.pt",
  "instagram": "mecanica_silva",
  "horario": {
    "seg": { "aberto": true, "abertura": "08:00", "fechamento": "18:00" },
    "ter": { "aberto": true, "abertura": "08:00", "fechamento": "18:00" },
    "qua": { "aberto": true, "abertura": "08:00", "fechamento": "18:00" },
    "qui": { "aberto": true, "abertura": "08:00", "fechamento": "18:00" },
    "sex": { "aberto": true, "abertura": "08:00", "fechamento": "18:00" },
    "sab": { "aberto": true, "abertura": "09:00", "fechamento": "13:00" },
    "dom": { "aberto": false }
  },
  "servicos": {
    "serv-001": {
      "nome": "Troca de óleo e filtro",
      "categoria": "Manutenção",
      "precoMedio": 35,
      "tempo": "30 min",
      "ativo": true
    },
    "serv-002": {
      "nome": "Alinhamento 3D",
      "categoria": "Alinhamento",
      "precoMedio": 50,
      "tempo": "45 min",
      "ativo": true
    }
  },
  "formasPagamento": ["dinheiro", "cartao_credito", "mbway"],
  "status": "ativo",
  "verificado": true,
  "seloVerificacao": {
    "emitidoEm": "2026-05-15T10:30:00Z",
    "validadeAte": "2027-05-15T10:30:00Z",
    "tipoVerificacao": "comprovante_endereco"
  },
  "documentos": {
    "comprovante": "profissionais/prof-001/comprovante.pdf",
    "uploadosEm": "2026-05-10T15:00:00Z",
    "analisadoEm": "2026-05-15T10:00:00Z",
    "analisadoPor": "admin-mod-001"
  },
  "reputacao": {
    "mediaAvaliacao": 4.8,
    "totalAvaliacoes": 23,
    "totalContatos": 67,
    "respondeEm": 15,
    "ultimaAtualizacao": "2026-05-29T02:30:00Z"
  },
  "destaque": {
    "ativo": false,
    "tipo": null,
    "dataInicio": null,
    "dataFim": null
  },
  "denuncias": {
    "total": 0,
    "motivos": {},
    "verificadas": 0,
    "ativa": false
  },
  "stats": {
    "visualizacoes": 342,
    "visualizacoes7Dias": 67,
    "contatos7Dias": 8,
    "contatosTotais": 67
  },
  "criadoEm": "2026-05-01T12:00:00Z",
  "atualizadoEm": "2026-05-29T02:30:00Z"
}
```

---

## 17. Próximos Passos

1. **Design**: Validar wireframes de onboarding, página profissional e dashboard com PO
2. **Prototipagem**: Criar protótipo Figma de fluxo completo
3. **BD**: Criar branch, aplicar schema + indexes
4. **MVP**: Iniciar dev de onboarding + busca básica
5. **Beta Testing**: Recrutar 50 profissionais para feedback em semana 10
6. **Docs**: Manter runbooks para moderação manual

---

**Fim do Plano**

*Versão 1.0 — Pronto para apresentação ao time de produto.*
