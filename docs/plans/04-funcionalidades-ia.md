# Plano: Funcionalidades com IA

**Prioridade:** MEDIA
**Estimativa Total:** 22-30 dias de desenvolvimento
**Impacto Principal:** Diferenciacao, qualidade dos anuncios, experiencia do utilizador

---

## 1. Visao Geral

### O Que Resolve

A qualidade dos anuncios e um dos maiores desafios de qualquer marketplace. Vendedores nao sabem como escrever descricoes atrativas, nao sabem que preco pedir, e fotos de veiculos com danos nao sao facilmente interpretadas por compradores. Adicionalmente, a moderacao manual de anuncios nao escala e perguntas frequentes consomem tempo de suporte.

Este plano introduz inteligencia artificial em cinco frentes: geracao automatica de descricoes de anuncios, sugestao inteligente de preco, classificacao visual de danos em fotos, chatbot de atendimento, e deteccao automatica de anuncios potencialmente fraudulentos. Estas funcionalidades melhoram a qualidade do conteudo, reduzem o esforco do vendedor, protegem o comprador e aliviam a carga de moderacao.

### Benchmark Competitivo

| Plataforma | Geracao Descricao | Sugestao Preco | Visao Danos | Chatbot | Deteccao Fraude |
|---|---|---|---|---|---|
| **Standvirtual** | Nao | Nao | Nao | Nao | Manual |
| **AutoScout24** | Nao | Parcial | Nao | Sim (basico) | Sim (automatico) |
| **Carvana (EUA)** | Sim | Sim | Parcial | Sim | Sim |
| **AutoTrader UK** | Nao | Sim | Nao | Sim | Sim |
| **OLX Portugal** | Nao | Nao | Nao | Nao | Basico |
| **ReparAuto (atual)** | Nao | Nao | Nao | Nao | Nao |
| **ReparAuto (proposto)** | Sim | Sim | Sim | Sim | Sim |

### Historias de Utilizador

1. **Como vendedor que nao sabe escrever descricoes**, quero que a plataforma gere automaticamente uma descricao profissional do meu carro a partir dos dados que ja preenchi e das fotos que carreguei, para que o meu anuncio seja mais atrativo e completo.
2. **Como comprador a ver fotos de um carro com danos**, quero que a plataforma me indique automaticamente onde estao os danos visiveis nas fotos, para que possa avaliar melhor a extensao dos problemas antes de contactar o vendedor.
3. **Como administrador**, quero que o sistema sinalize automaticamente anuncios suspeitos (preco irrealista, fotos duplicadas, padroes de fraude conhecidos), para que eu possa priorizar a minha revisao e proteger os utilizadores.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

#### 2.1 Geracao Automatica de Descricao
No formulario de criacao de anuncio (`/anunciar`), apos o vendedor preencher os dados basicos (marca, modelo, ano, km, combustivel, estado, manutencoes) e carregar fotos, um botao "Gerar Descricao com IA" envia estes dados para um LLM que gera um texto descritivo profissional em portugues. O vendedor pode editar o resultado antes de publicar.

#### 2.2 Sugestao Inteligente de Preco
Extensao do plano 02 (Inteligencia de Precos) com camada de IA. Alem da mediana estatistica, o LLM analisa os dados do veiculo (incluindo manutencoes necessarias e estado) para sugerir um preco mais preciso, explicando o raciocinio ("Sugerimos X EUR porque veiculos similares custam Y EUR, mas descontamos Z EUR pelas manutencoes necessarias").

#### 2.3 Classificacao Visual de Danos
O utilizador faz upload de fotos do veiculo. A IA de visao computacional analisa cada foto e identifica areas com danos visiveis (amassados, riscos, ferrugem, pecas em falta). O resultado e apresentado como overlay na foto com bounding boxes e labels.

#### 2.4 Chatbot de Atendimento
Widget de chat acessivel em todas as paginas que responde a perguntas frequentes sobre a plataforma (como publicar, como contactar vendedor, politicas, seguranca) e pode ajudar na busca ("Procuro um carro ate 2000 EUR no Porto"). Usa o contexto da plataforma (anuncios ativos, regras, FAQs) para respostas relevantes.

#### 2.5 Deteccao de Fraude
Sistema automatico que analisa novos anuncios a procura de sinais de fraude: preco significativamente abaixo do mercado, fotos reversiveis (ja usadas noutros anuncios), texto copiado de outros anuncios, padrao de multiplos anuncios do mesmo criador num curto espaco de tempo. Anuncios sinalizados sao priorizados na fila de moderacao.

### Fluxos de Utilizador

**Fluxo de Geracao de Descricao:**
1. Vendedor esta no passo de descricao do formulario `/anunciar`
2. Dados ja preenchidos: marca, modelo, ano, km, combustivel, estado, manutencoes, fotos
3. Botao "Gerar com IA" fica ativo quando campos obrigatorios estao preenchidos
4. Ao clicar, spinner de loading + chamada a Firebase Cloud Function
5. Cloud Function envia prompt ao LLM com os dados do veiculo
6. Resposta e inserida no campo de descricao (textarea)
7. Vendedor pode editar livremente antes de submeter
8. Indicador discreto: "Descricao gerada com auxilio de IA"

**Fluxo de Classificacao de Danos:**
1. Na pagina de detalhes de um carro com `estadoVeiculo === 'manutencao'`
2. Botao "Analisar Danos nas Fotos" disponivel (ou automatico no upload para o vendedor)
3. Ao clicar, fotos sao enviadas para Cloud Function com modelo de visao
4. Resultado: JSON com coordenadas de danos por foto
5. UI sobrepoe bounding boxes semi-transparentes com labels ("Amassado", "Risco", "Ferrugem")
6. Toggle para mostrar/esconder overlay

**Fluxo de Deteccao de Fraude (Background):**
1. Novo anuncio e submetido (status: `pendente`)
2. Trigger (Cloud Function ou periodico) analisa o anuncio:
   a. Preco vs. media de mercado (usa logica do plano 02)
   b. Hash perceptual das fotos para comparar com fotos existentes
   c. Similaridade de texto com outros anuncios (TF-IDF basico)
   d. Frequencia de anuncios do mesmo criador
3. Se score de suspeita > limiar, adiciona flag `fraudeSuspect: true` ao documento
4. Admin panel mostra anuncios sinalizados com prioridade e explicacao do motivo

### Requisitos de UI/UX

- Botao "Gerar com IA" deve ter icone de sparkle/estrela e ser visualmente distinto
- Descricao gerada deve aparecer com animacao de "digitacao" (typewriter effect) para reforcar a experiencia de IA
- Overlay de danos nas fotos deve ser opcional e nao obstruir a visualizacao normal
- Chatbot deve ter personalidade amigavel, usar linguagem coloquial portuguesa, e ser claro sobre o que sabe e nao sabe
- Deteccao de fraude deve ser invisivel para o utilizador final (apenas visible no admin panel)
- Sugestao de preco com IA deve diferenciar-se visualmente da sugestao estatistica (badge "Assistido por IA")

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Caminho | Finalidade |
|---|---|
| `src/types/ia.ts` | Interfaces para DamageDetection, FraudScore, ChatMessage, AIDescription |
| `src/hooks/useAIDescription.ts` | Hook para gerar descricao via Cloud Function |
| `src/hooks/useAIPriceSuggestion.ts` | Hook para sugestao de preco com IA |
| `src/hooks/useDamageDetection.ts` | Hook para analise visual de danos |
| `src/hooks/useChatbot.ts` | Hook para o chatbot de atendimento |
| `src/hooks/useFraudDetection.ts` | Hook para admin consultar scores de fraude |
| `src/components/anunciar/AIDescriptionButton.tsx` | Botao + logica de geracao de descricao |
| `src/components/anunciar/AIPriceSuggestion.tsx` | Widget de sugestao de preco com IA |
| `src/components/detalhes/DamageOverlay.tsx` | Overlay visual de danos nas fotos |
| `src/components/detalhes/DamageAnalysisButton.tsx` | Botao para acionar analise de danos |
| `src/components/chat/Chatbot.tsx` | Widget de chatbot flutuante |
| `src/components/chat/ChatbotBubble.tsx` | Botao flutuante para abrir chatbot |
| `src/components/chat/ChatbotMessage.tsx` | Componente de mensagem individual do chatbot |
| `src/components/admin/FraudAlerts.tsx` | Painel de alertas de fraude no admin |
| `functions/src/generateDescription.ts` | Cloud Function para geracao de descricao |
| `functions/src/analyzeDamage.ts` | Cloud Function para analise de danos |
| `functions/src/suggestPrice.ts` | Cloud Function para sugestao de preco |
| `functions/src/chatbotResponse.ts` | Cloud Function para chatbot |
| `functions/src/detectFraud.ts` | Cloud Function (trigger on create) para deteccao de fraude |
| `functions/src/lib/prompts.ts` | Templates de prompts para o LLM |

### Modificacoes em Arquivos Existentes

| Caminho | Alteracoes |
|---|---|
| `src/types/carro.ts` | Adicionar campos opcionais: `descricaoGeradaIA?: boolean`, `fraudeSuspect?: boolean`, `fraudeScore?: number`, `fraudeMotivos?: string[]` |
| `src/components/anunciar/StepDados.tsx` | Integrar `AIDescriptionButton` junto ao textarea de descricao |
| `src/components/anunciar/StepPreco.tsx` | Integrar `AIPriceSuggestion` junto ao campo de preco |
| `src/pages/DetalhesCarro.tsx` | Integrar `DamageAnalysisButton` e `DamageOverlay` na galeria de fotos |
| `src/components/detalhes/GalleryModal.tsx` | Suportar overlay de danos quando ativo |
| `src/pages/Admin.tsx` | Adicionar aba "Alertas de Fraude" com `FraudAlerts` |
| `src/components/admin/ListingsTable.tsx` | Adicionar indicador visual de fraude suspeita (icone de alerta) |
| `src/App.tsx` | Adicionar `ChatbotBubble` como componente global (visivel em todas as paginas) |
| `firestore.rules` | Adicionar regras para `fraudAlerts` (admin-only) |

### Colecoes Firestore

#### Colecao `fraudAlerts` (nova)
```typescript
interface FraudAlert {
  id: string;
  anuncioId: string;
  anuncioType: 'car' | 'part';
  criadorEmail: string;
  score: number;              // 0-100, quanto maior mais suspeito
  motivos: FraudMotivo[];
  status: 'pendente' | 'confirmado' | 'falso_positivo';
  resolvidoPor?: string;
  dataCriacao: Timestamp;
  dataResolucao?: Timestamp;
}

type FraudMotivo =
  | { tipo: 'preco_baixo'; detalhe: string; precoAnuncio: number; precoMedio: number }
  | { tipo: 'foto_duplicada'; detalhe: string; anuncioOriginalId: string }
  | { tipo: 'texto_copiado'; detalhe: string; similaridade: number; anuncioOriginalId: string }
  | { tipo: 'alta_frequencia'; detalhe: string; totalAnuncios: number; periodo: string }
  | { tipo: 'outro'; detalhe: string };
```

#### Colecao `chatbotSessions` (nova)
```typescript
interface ChatbotSession {
  id: string;
  uid?: string;              // null para utilizadores nao autenticados
  mensagens: ChatbotMessage[];
  dataCriacao: Timestamp;
  dataUltimaMsg: Timestamp;
}

interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
}
```

#### Atualizacao na colecao `cars` e `parts`
```typescript
// Campos adicionais opcionais
{
  descricaoGeradaIA?: boolean;   // Flag se descricao foi gerada por IA
  fraudeSuspect?: boolean;       // Flag de suspeita de fraude
  fraudeScore?: number;          // Score 0-100
  fraudeMotivos?: string[];      // Resumo dos motivos
  damageAnalysis?: {             // Resultado da analise de danos (cache)
    analisadoEm: Timestamp;
    resultados: DamageResult[];
  };
}

interface DamageResult {
  fotoIndex: number;           // Indice da foto no array fotos[]
  areas: DamageArea[];
}

interface DamageArea {
  tipo: string;                // 'amassado' | 'risco' | 'ferrugem' | 'peca_faltando' | 'vidro_partido'
  confianca: number;           // 0-1
  bbox: {                      // Bounding box normalizado (0-1)
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### Regras de Seguranca Firestore

```
match /fraudAlerts/{alertId} {
  allow read: if isAdmin();
  allow create: if false;  // Apenas Cloud Functions criam alertas
  allow update: if isAdmin();
  allow delete: if isAdmin();
}

match /chatbotSessions/{sessionId} {
  allow read: if isAuthenticated() && resource.data.uid == request.auth.uid;
  allow create: if true;  // Permitir sessoes anonimas
  allow update: if true;  // Permitir adicionar mensagens
  allow delete: if false;  // Nao eliminar sessoes
}
```

### APIs / Servicos Externos

#### Google Gemini (via Firebase AI / Vertex AI)
- **Uso:** Geracao de descricoes, sugestao de preco, chatbot
- **Integracao:** Firebase Extensions (Vertex AI) ou chamada direta via Cloud Function
- **Custo:** Gemini 1.5 Flash — ~0.075 USD/1M tokens input, ~0.30 USD/1M tokens output. Estimativa: ~0.001-0.005 USD por descricao gerada
- **Vantagem:** Integracao nativa com Firebase, sem necessidade de gerir API keys externas, suporte nativo a portugues

#### Google Cloud Vision API (para analise de danos)
- **Uso:** Deteccao de objetos e classificacao visual nas fotos
- **Integracao:** Via Cloud Function
- **Custo:** 1.50 USD/1000 imagens (primeiras 1000/mes gratis)
- **Limitacao:** Nao e treinado especificamente para danos automoveis — necessita de prompt engineering com Gemini Vision como alternativa mais flexivel

#### Alternativas Consideradas

| Provider | Pros | Contras |
|---|---|---|
| **Google Gemini** | Integracao nativa Firebase; bom custo; multimodal (texto + visao); portugues nativo | Menos potente que GPT-4/Claude para tarefas complexas |
| **OpenAI GPT-4o** | Muito potente; excelente em portugues; visao avancada | Sem integracao nativa Firebase; custo mais alto; API key externa |
| **Anthropic Claude API** | Excelente em portugues; thinking mode para raciocinio complexo; contexto muito longo | Sem integracao Firebase; custo mais alto que Gemini; visao menos robusta |

### Componentes React Principais

```typescript
// src/types/ia.ts
interface AIDescriptionRequest {
  marca: string;
  modelo: string;
  anoFabricacao: number;
  km: number;
  combustivel: string;
  cambio: string;
  cor: string;
  portas: number;
  estadoVeiculo: string;
  tiposManutencao: string[];
  temOrcamento: boolean;
  orcamentoTexto?: string;
  rodando?: boolean;
  inspecao?: boolean;
  fotosUrls?: string[];        // URLs das fotos para analise visual
}

interface AIDescriptionResponse {
  descricao: string;
  tokens: number;
}

interface AIPriceSuggestionRequest {
  marca: string;
  modelo: string;
  anoFabricacao: number;
  km: number;
  combustivel: string;
  estadoVeiculo: string;
  tiposManutencao: string[];
  precoMedianoMercado?: number;  // Do plano 02, se disponivel
}

interface AIPriceSuggestionResponse {
  precoSugerido: number;
  precoMinimo: number;
  precoMaximo: number;
  explicacao: string;            // Texto explicando o raciocinio
}

interface DamageDetectionResult {
  fotoIndex: number;
  areas: DamageArea[];
  resumo: string;                // Texto descritivo dos danos encontrados
}

interface DamageArea {
  tipo: 'amassado' | 'risco' | 'ferrugem' | 'peca_faltando' | 'vidro_partido' | 'pintura_danificada';
  confianca: number;
  bbox: { x: number; y: number; width: number; height: number };
  descricao: string;
}

// src/components/anunciar/AIDescriptionButton.tsx
interface AIDescriptionButtonProps {
  formData: CarroFormData;
  fotosUrls: string[];
  onGenerated: (descricao: string) => void;
  disabled?: boolean;
}

// src/components/anunciar/AIPriceSuggestion.tsx
interface AIPriceSuggestionProps {
  formData: CarroFormData;
  onSuggestedPrice: (preco: number) => void;
}

// src/components/detalhes/DamageOverlay.tsx
interface DamageOverlayProps {
  fotoUrl: string;
  areas: DamageArea[];
  visible: boolean;
}

// src/components/detalhes/DamageAnalysisButton.tsx
interface DamageAnalysisButtonProps {
  carroId: string;
  fotos: string[];
  estadoVeiculo: string;
  onAnalysisComplete: (results: DamageDetectionResult[]) => void;
}

// src/components/chat/Chatbot.tsx
interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  userUid?: string;
  userName?: string;
}

// src/components/chat/ChatbotBubble.tsx
interface ChatbotBubbleProps {
  onClick: () => void;
  hasUnread?: boolean;
}

// src/components/admin/FraudAlerts.tsx
interface FraudAlertsProps {
  // Sem props — busca dados internamente via hook
}
```

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Tarefa | Esforco (dias) | Competencias |
|---|---|---|
| Tipos TypeScript (ia.ts, atualizacoes em carro.ts) | 1 | TypeScript |
| Setup do projeto Firebase Cloud Functions (se nao existir) | 1 | Firebase Functions, Node.js |
| Cloud Function: generateDescription + prompts | 2 | Node.js, Gemini API, Prompt Engineering |
| Cloud Function: suggestPrice + prompts | 1.5 | Node.js, Gemini API |
| Cloud Function: analyzeDamage + prompts | 2.5 | Node.js, Gemini Vision API |
| Cloud Function: chatbotResponse + contexto + prompts | 3 | Node.js, Gemini API, Prompt Engineering |
| Cloud Function: detectFraud (trigger on create) | 3 | Node.js, Logica de negocios, Hashing |
| Hook `useAIDescription` | 0.5 | React, Firebase |
| Hook `useAIPriceSuggestion` | 0.5 | React, Firebase |
| Hook `useDamageDetection` | 0.5 | React, Firebase |
| Hook `useChatbot` | 1 | React, Firebase |
| Hook `useFraudDetection` | 0.5 | React, Firebase |
| Componente `AIDescriptionButton` + integracao em StepDados | 1.5 | React, Tailwind |
| Componente `AIPriceSuggestion` + integracao em StepPreco | 1 | React, Tailwind |
| Componentes `DamageOverlay` + `DamageAnalysisButton` + integracao em galeria | 2.5 | React, Tailwind, Canvas/CSS overlays |
| Componentes do chatbot (`Chatbot`, `ChatbotBubble`, `ChatbotMessage`) | 2.5 | React, Tailwind |
| Componente `FraudAlerts` + integracao no Admin | 1.5 | React, Tailwind |
| Regras Firestore + deploy | 0.5 | Firestore Rules |
| Prompt engineering e tuning (iteracoes) | 3 | IA, Prompt Engineering |
| Testes manuais e ajustes | 2 | QA |
| **Total** | **~30 dias** | |

### Avaliacao de Valor

| Dimensao | Impacto | Justificacao |
|---|---|---|
| **Aquisicao** | Alto | "IA que escreve o anuncio por si" e um forte argumento de marketing; diferenciador unico no mercado portugues |
| **Retencao** | Medio | Chatbot reduz frustracao; deteccao de fraude aumenta confianca |
| **Qualidade** | Muito Alto | Descricoes geradas sao mais completas e profissionais; eleva a qualidade media dos anuncios |
| **Eficiencia Operacional** | Alto | Deteccao de fraude reduz trabalho manual de moderacao; chatbot reduz questoes de suporte |
| **Receita** | Medio | Funcionalidades IA podem ser monetizadas (geracao de descricao premium, analise de danos por consulta) |

### Posicao na Matriz

**COMPLEMENTAR tendendo a ESTRATEGICO** — Esforco alto (30 dias), valor alto. A geracao de descricao e a deteccao de fraude sao as sub-funcionalidades com melhor relacao esforco/valor dentro deste plano. O chatbot e a classificacao de danos sao complementares e podem ser adiados para uma segunda fase.

**Priorizacao interna recomendada:**
- **Fase 1 (Alta prioridade, ~8 dias):** Geracao de descricao + Setup Cloud Functions
- **Fase 2 (Media prioridade, ~8 dias):** Sugestao de preco IA + Deteccao de fraude
- **Fase 3 (Baixa prioridade, ~8 dias):** Chatbot de atendimento
- **Fase 4 (Futura, ~6 dias):** Classificacao visual de danos

---

## 5. Decisoes de Arquitetura

### Decisao 1: Provider de IA

**Contexto:** Necessitamos de um LLM para geracao de texto (descricoes, chatbot, sugestao de preco) e um modelo de visao computacional (analise de danos). Tres providers principais foram avaliados.

| Opcao | Pros | Contras |
|---|---|---|
| **Google Gemini (Firebase Extension)** | Integracao nativa com Firebase (sem setup de infra adicional); Gemini 1.5 Flash e economico; multimodal (texto + visao no mesmo modelo); Firebase Extensions simplificam deploy; suporte nativo a portugues europeu; billing integrado no projeto Firebase | Menos potente que GPT-4o ou Claude em tarefas de raciocinio complexo; ecossistema de prompting menos maduro; documentacao por vezes fragmentada |
| **OpenAI GPT-4o** | Modelo mais capaz para geracao de texto; excelente em portugues; visao muito avancada; comunidade enorme; tooling maduro | Sem integracao nativa Firebase (requer API key gerida manualmente); custo mais alto (~2-3x Gemini Flash); dependencia de terceiro externo ao ecossistema |
| **Anthropic Claude API** | Excelente qualidade de texto em portugues; Extended thinking para raciocinio complexo; janela de contexto muito longa (ideal para chatbot com muito contexto) | Sem integracao Firebase; custo mais alto que Gemini; capacidades de visao menos desenvolvidas que GPT-4o; menor ecossistema de ferramentas |

**Recomendacao:** **Google Gemini via Firebase Extensions / Vertex AI**. A integracao nativa com o ecossistema Firebase e o fator determinante: elimina a gestao de API keys externas, simplifica o billing (tudo numa fatura Google Cloud), e as Cloud Functions chamam Vertex AI diretamente. O Gemini 1.5 Flash e suficientemente capaz para geracao de descricoes e chatbot em portugues, e o custo e significativamente inferior. Para a classificacao de danos, o Gemini Vision (multimodal) substitui a necessidade de um modelo separado. Se no futuro a qualidade nao for satisfatoria para o chatbot, pode-se migrar esse unico componente para GPT-4o ou Claude sem afetar o resto.

### Decisao 2: Classificacao de Danos — Modelo Proprio vs. API Generica

**Contexto:** Necessitamos de identificar danos em fotos de veiculos. Duas abordagens foram avaliadas.

| Opcao | Pros | Contras |
|---|---|---|
| **Gemini Vision (prompt engineering)** | Sem treino necessario; flexivel (qualquer tipo de dano); rapido de implementar; custo por imagem baixo; evolui automaticamente com updates do modelo | Menos preciso que modelo especializado; bounding boxes menos precisas; pode ter falsos positivos/negativos; depende da qualidade do prompt |
| **Modelo proprio (fine-tuned YOLOv8 ou similar)** | Muito preciso para os tipos de dano definidos; bounding boxes precisas; tempo de inferencia rapido | Requer dataset de treino (milhares de imagens anotadas de danos automoveis); esforco de treino e manutencao; necessita de infraestrutura de ML (GPU para treino, endpoint de inferencia); custo inicial muito alto |

**Recomendacao:** **Gemini Vision com prompt engineering** para a primeira versao. O custo e esforco de treinar um modelo proprio sao desproporcionais para a fase atual da plataforma. O Gemini Vision com prompts bem construidos ("Identifica areas com danos visiveis nesta foto de um veiculo. Para cada dano, indica o tipo e a localizacao aproximada...") oferece resultados aceitaveis para uma v1. Os resultados sao cacheados no documento do carro para evitar chamadas repetidas. Se o volume de utilizacao justificar e a qualidade for insatisfatoria, pode-se evoluir para um modelo fine-tuned.

---

## 6. Prompt de Implementacao

```
You are implementing the "AI Features" set for ReparAuto, a Portuguese used-car and parts marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase.

IMPORTANT CONTEXT:
- All UI text must be in Portuguese (PT-PT). Code, comments, variable names in English.
- Import alias: @/ maps to src/. NEVER use relative imports.
- Styling: Tailwind utility classes only. Theme in src/index.css.
- State: Context API + custom hooks. No Redux/Zustand.
- This plan requires Firebase Cloud Functions (2nd gen, Node.js 18+). The functions/ directory may need to be initialized.
- AI provider: Google Gemini via Vertex AI (Firebase integrated). Use @google-cloud/vertexai package in Cloud Functions.
- All Cloud Functions are HTTPS Callable (not HTTP triggers) for seamless Firebase client SDK integration.

EXISTING FILES TO REFERENCE:
- src/types/carro.ts — Carro interface with all fields including marca, modelo, anoFabricacao, km, combustivel, cambio, cor, portas, estadoVeiculo, tiposManutencao[], temOrcamento, orcamentoTexto, rodando, inspecao, fotos[], descricao, status
- src/types/carro.ts — CarroFormData interface used in the multi-step form
- src/types/peca.ts — Peca interface
- src/types/usuario.ts — Usuario interface
- src/lib/db.ts — All CRUD functions. Collection names: 'cars', 'parts', 'users', 'notifications'. Key functions: addCarro(), updateCarro(), criarNotificacao(), getAllCarrosAdmin()
- src/lib/constants.ts — TIPOS_COMBUSTIVEL, TIPOS_CAMBIO, TIPOS_MANUTENCAO, CONCELHOS
- src/hooks/useAuth.ts — user, isLoggedIn, isAdmin
- src/components/anunciar/StepDados.tsx — Step 1 of car listing form (vehicle data + description textarea)
- src/components/anunciar/StepPreco.tsx — Step 3 of car listing form (price input)
- src/components/anunciar/StepFotos.tsx — Step 2 of car listing form (photo upload)
- src/pages/DetalhesCarro.tsx — Car detail page with photo gallery
- src/components/detalhes/GalleryModal.tsx — Fullscreen photo gallery modal
- src/components/chat/ChatModal.tsx — Existing user-to-user chat modal (reference for chat UI patterns)
- src/pages/Admin.tsx — Admin panel with tabs
- src/components/admin/ListingsTable.tsx — Table of listings in admin
- src/App.tsx — Main router
- firestore.rules — Current security rules
- src/lib/firebase.ts — Firebase config and initialization

SETUP TASKS (run first):
1. Initialize Firebase Cloud Functions if not already:
   - cd to project root
   - firebase init functions (TypeScript, 2nd gen)
   - This creates a functions/ directory

2. Install dependencies in functions/:
   - cd functions && npm install @google-cloud/vertexai

3. Install client-side dependency:
   - npm install firebase (should already be installed, but ensure functions module is available)

TASKS — Implement in this order:

1. TYPE DEFINITIONS
   Create src/types/ia.ts with all interfaces:
   - AIDescriptionRequest (marca, modelo, anoFabricacao, km, combustivel, cambio, cor, portas, estadoVeiculo, tiposManutencao, temOrcamento, orcamentoTexto, rodando, inspecao, fotosUrls?)
   - AIDescriptionResponse (descricao: string, tokensUsed: number)
   - AIPriceSuggestionRequest (marca, modelo, anoFabricacao, km, combustivel, estadoVeiculo, tiposManutencao, precoMedianoMercado?)
   - AIPriceSuggestionResponse (precoSugerido, precoMinimo, precoMaximo, explicacao)
   - DamageArea (tipo, confianca, bbox: {x,y,width,height}, descricao)
   - DamageDetectionResult (fotoIndex, areas: DamageArea[], resumo)
   - ChatbotMessage (role: 'user'|'assistant', content, timestamp)
   - FraudMotivo (type union as defined in plan)
   - FraudAlert (id, anuncioId, anuncioType, criadorEmail, score, motivos, status, etc.)

   Modify src/types/carro.ts:
   - Add optional fields: descricaoGeradaIA?: boolean; fraudeSuspect?: boolean; fraudeScore?: number;

2. CLOUD FUNCTIONS — PROMPT TEMPLATES
   Create functions/src/lib/prompts.ts:
   
   - DESCRIPTION_PROMPT: System prompt for generating car descriptions. Must instruct the model to:
     - Write in Portuguese (PT-PT), professional but accessible tone
     - Use the provided vehicle data (marca, modelo, ano, km, etc.)
     - Mention maintenance needs honestly if estadoVeiculo is 'manutencao'
     - Include bullet points for key features
     - Keep between 100-300 words
     - Do NOT invent features not provided in the data
   
   - PRICE_SUGGESTION_PROMPT: System prompt for price suggestions. Must instruct to:
     - Analyze the vehicle data and market median (if provided)
     - Factor in maintenance costs from tiposManutencao
     - Explain reasoning in Portuguese
     - Return JSON with precoSugerido, precoMinimo, precoMaximo, explicacao
   
   - DAMAGE_ANALYSIS_PROMPT: System prompt for damage detection. Must instruct to:
     - Analyze the image for visible vehicle damage
     - Identify type (amassado, risco, ferrugem, peca_faltando, vidro_partido, pintura_danificada)
     - Estimate confidence 0-1
     - Estimate approximate bounding box location (normalized 0-1)
     - Return JSON array of findings
   
   - CHATBOT_SYSTEM_PROMPT: System prompt for the chatbot. Must instruct to:
     - Be a helpful assistant for the ReparAuto platform
     - Answer in Portuguese (PT-PT)
     - Help with: how to list a car, how to search, platform policies, contact info
     - If asked about specific cars, suggest using the search feature
     - Never provide legal or financial advice
     - Be concise and friendly

3. CLOUD FUNCTIONS — IMPLEMENTATIONS
   Create functions/src/generateDescription.ts:
   - Export onCall function (2nd gen)
   - Validate input (require marca, modelo, ano at minimum)
   - Build prompt from template + user data
   - Call Vertex AI Gemini 1.5 Flash
   - Return { descricao, tokensUsed }
   - Rate limit: max 10 calls per user per hour

   Create functions/src/suggestPrice.ts:
   - Export onCall function
   - Build prompt from template + vehicle data + optional market median
   - Call Vertex AI, parse JSON response
   - Return { precoSugerido, precoMinimo, precoMaximo, explicacao }

   Create functions/src/analyzeDamage.ts:
   - Export onCall function
   - Accept array of image URLs (Firebase Storage URLs)
   - For each image, send to Gemini Vision with DAMAGE_ANALYSIS_PROMPT
   - Parse response, return array of DamageDetectionResult
   - Cache result in the car document (damageAnalysis field)

   Create functions/src/chatbotResponse.ts:
   - Export onCall function
   - Accept message string + session history (last 10 messages)
   - Build prompt with CHATBOT_SYSTEM_PROMPT + conversation history
   - Call Vertex AI
   - Return assistant response string

   Create functions/src/detectFraud.ts:
   - Export onDocumentCreated trigger for 'cars/{carId}'
   - When a new car document is created (status: 'pendente'):
     a. Check price vs market: query similar cars, if price < 50% of median → flag
     b. Check text similarity: basic keyword overlap with recent listings
     c. Check creator frequency: count listings from same criador in last 7 days, if > 5 → flag
     d. Calculate overall fraud score (0-100)
     e. If score > 50, create document in 'fraudAlerts' collection and set fraudeSuspect: true on car doc

4. CLIENT-SIDE HOOKS
   Create src/hooks/useAIDescription.ts:
   - Returns { generate(formData, fotosUrls?), description, loading, error }
   - Uses httpsCallable from firebase/functions to call 'generateDescription'
   - Handles loading state and errors

   Create src/hooks/useAIPriceSuggestion.ts:
   - Returns { suggest(formData, precoMediano?), suggestion, loading, error }
   - Uses httpsCallable to call 'suggestPrice'

   Create src/hooks/useDamageDetection.ts:
   - Returns { analyze(fotos), results, loading, error }
   - Uses httpsCallable to call 'analyzeDamage'
   - Caches results per carroId

   Create src/hooks/useChatbot.ts:
   - Manages conversation state (messages array)
   - Returns { messages, sendMessage(text), loading, clearHistory }
   - Uses httpsCallable to call 'chatbotResponse'
   - Persists session in sessionStorage

   Create src/hooks/useFraudDetection.ts (admin only):
   - Returns { alerts: FraudAlert[], loading, resolveAlert(id, status), stats }
   - Queries 'fraudAlerts' collection, ordered by score desc

5. UI COMPONENTS
   Create src/components/anunciar/AIDescriptionButton.tsx:
   - Sparkle/wand icon button with text "Gerar Descricao com IA"
   - Props: formData, fotosUrls, onGenerated callback, disabled
   - Shows loading spinner during generation
   - On success, calls onGenerated with the description text
   - Shows error toast on failure
   - Disabled state when required fields (marca, modelo, ano) are empty

   Create src/components/anunciar/AIPriceSuggestion.tsx:
   - Section below price input: "Sugestao de Preco com IA"
   - Button "Obter Sugestao" that triggers price suggestion
   - Shows result card: suggested price (large), range (min-max), explanation text
   - "Usar este preco" button that fills the price input

   Create src/components/detalhes/DamageAnalysisButton.tsx:
   - Only visible when estadoVeiculo === 'manutencao'
   - Button "Analisar Danos com IA"
   - Triggers analysis, manages loading state
   - On complete, activates DamageOverlay

   Create src/components/detalhes/DamageOverlay.tsx:
   - Absolute positioned overlay on top of a photo
   - Renders semi-transparent colored bounding boxes for each DamageArea
   - Color by type: red for amassado, orange for risco, brown for ferrugem, etc.
   - Label with tipo + confianca percentage
   - Toggle visibility button

   Create src/components/chat/ChatbotBubble.tsx:
   - Fixed position floating button (bottom-right, above BottomNav)
   - Robot/chat icon
   - Pulse animation when there's an initial greeting available
   - onClick opens Chatbot component

   Create src/components/chat/Chatbot.tsx:
   - Slide-up panel (mobile) or side panel (desktop)
   - Chat interface: message list (scrollable), input field, send button
   - Assistant messages styled differently from user messages
   - Initial greeting message: "Ola! Sou o assistente do ReparAuto. Como posso ajudar?"
   - Loading indicator (typing dots) while waiting for response
   - Uses existing chat UI patterns from src/components/chat/ChatModal.tsx as reference

   Create src/components/chat/ChatbotMessage.tsx:
   - Individual message bubble
   - Different styling for user (right-aligned, blue) vs assistant (left-aligned, gray)
   - Timestamp display
   - Markdown-lite rendering (bold, lists)

   Create src/components/admin/FraudAlerts.tsx:
   - Table of fraud alerts sorted by score
   - Columns: Score (color-coded), Anuncio (link), Criador, Motivos (expandable), Data, Acoes
   - Actions: "Confirmar Fraude" (remove listing + notify), "Falso Positivo" (dismiss)
   - Stats summary: total alertas, confirmados, taxa de falsos positivos

6. INTEGRATION
   Modify src/components/anunciar/StepDados.tsx:
   - After the descricao textarea, add <AIDescriptionButton>
   - When description is generated, update the textarea value
   - Add small badge "Gerada com IA" if descricaoGeradaIA is true

   Modify src/components/anunciar/StepPreco.tsx:
   - Below the price input field, add <AIPriceSuggestion>
   - Pass current formData as props
   - "Usar preco" button fills the price input

   Modify src/pages/DetalhesCarro.tsx:
   - If estadoVeiculo === 'manutencao', show <DamageAnalysisButton> near the photo gallery
   - When analysis complete, wrap gallery images with <DamageOverlay>

   Modify src/components/detalhes/GalleryModal.tsx:
   - Accept optional damageResults prop
   - If provided and toggle is on, render DamageOverlay on each photo

   Modify src/pages/Admin.tsx:
   - Add new tab "Fraude" with <FraudAlerts>
   - Show badge with count of pending alerts

   Modify src/components/admin/ListingsTable.tsx:
   - Add warning icon (exclamation triangle, amber) on rows where fraudeSuspect is true
   - Tooltip showing fraud score and motivos

   Modify src/App.tsx:
   - Add <ChatbotBubble> as a global component (rendered alongside ChatModal)
   - Chatbot state managed locally in ChatbotBubble/Chatbot

DESIGN GUIDELINES:
- AI buttons: use a sparkle/wand icon (SVG), gradient background (purple-to-blue or similar), slightly different from standard buttons to signify "AI-powered"
- Loading states for AI: use animated dots or shimmer effect, not plain spinners
- Damage overlay: semi-transparent colored rectangles with rounded corners, label positioned outside the box
- Chatbot bubble: round button, size 56px, shadow-lg, positioned bottom-right with 16px margin, z-50
- Chatbot panel: max-width 400px, max-height 600px on desktop; full-width slide-up on mobile
- Fraud alerts: color-code scores (0-30 green, 30-60 yellow, 60-100 red)
- All AI features should have clear disclaimers: "Resultado gerado por IA — verifique antes de utilizar"
- Handle API errors gracefully: show user-friendly message in Portuguese, never expose raw error
```

---

*Documento gerado em 2026-05-27. Recomenda-se iniciar pela geracao de descricao (maior impacto imediato na qualidade dos anuncios) e pelo setup de Cloud Functions que sera reutilizado por todas as sub-funcionalidades.*
