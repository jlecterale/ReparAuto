# Plano 11 — Logistica e Servicos

> **Prioridade:** BAIXA
> **Estimativa total:** 12-16 dias de desenvolvimento
> **Dependencias:** Sistema de autenticacao (useAuth), dados de localizacao (CONCELHOS em src/lib/constants.ts), sistema de notificacoes (useNotificacoes)

---

## 1. Visao Geral

### O Que Resolve

Atualmente, o ReparAuto facilita apenas a descoberta e o contacto inicial entre compradores e vendedores. Apos o primeiro contacto, todo o processo logistico — transporte do veiculo, agendamento de visitas, inspecao mecanica, transferencia de documentos — acontece fora da plataforma, sem qualquer orientacao. Isso gera atrito, inseguranca e abandono de transacoes, especialmente para compradores de primeira viagem ou compradores a distancia (ex: alguem de Faro que encontra um carro em Braga).

Este plano adiciona servicos de valor acrescentado que acompanham o usuario apos o contacto inicial: estimativa de custo de entrega, agendamento de test drives, guia de transferencia, inspecao pre-compra e conexao com oficinas parceiras. O objetivo e fechar o ciclo completo da transacao dentro do ecossistema ReparAuto.

### Benchmark Competitivo

| Plataforma | Estimativa Entrega | Test Drive | Garantia | Oficinas | Checklist Transfer. | Inspecao |
|---|---|---|---|---|---|---|
| **Standvirtual** | Nao | Nao | Parcial (dealer) | Nao | Nao | Nao |
| **OLX** | Nao | Nao | Nao | Nao | Nao | Nao |
| **Carvana (EUA)** | Sim | Sim (7 dias) | Sim | Sim | Sim | Sim |
| **AutoScout24** | Nao | Nao | Parcial | Parcial | Nao | Nao |
| **ReparAuto (atual)** | Nao | Nao | Nao | Nao | Nao | Nao |
| **ReparAuto (proposto)** | Sim | Sim | Sim (parceria) | Sim | Sim | Sim |

### Historias de Usuario

1. **Como comprador a distancia**, quero saber quanto custaria transportar o carro de Porto para Faro antes de decidir se vale a pena contactar o vendedor.
2. **Como comprador interessado**, quero agendar um test drive com o vendedor atraves da plataforma, sem precisar trocar 10 mensagens para combinar horario.
3. **Como comprador de primeira viagem**, quero um checklist passo a passo dos documentos necessarios para transferir o veiculo para o meu nome.
4. **Como comprador cauteloso**, quero contratar uma inspecao pre-compra por um mecanico profissional antes de fechar negocio.
5. **Como dono de um carro recem-comprado**, quero encontrar oficinas parceiras proximas para fazer a manutencao necessaria.
6. **Como comprador preocupado**, quero saber se existe algum plano de garantia estendida para proteger a minha compra de carros com mais de 10 anos.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

| # | Funcionalidade | Descricao | Complexidade |
|---|---|---|---|
| F1 | Estimativa de custo de entrega | Calculo de distancia entre concelhos e estimativa de preco de transporte | Media |
| F2 | Agendamento de test drive | Sistema de reserva de horario com confirmacao por ambas as partes | Alta |
| F3 | Programa de garantia estendida | Informacao sobre planos de garantia de parceiros, sem transacao na plataforma | Baixa |
| F4 | Marketplace de servicos mecanicos | Listagem de oficinas parceiras por regiao e especialidade | Media |
| F5 | Checklist de transferencia | Guia interativo passo a passo com checklist de documentos | Baixa |
| F6 | Inspecao pre-compra | Rede de inspetores parceiros, pedido e agendamento via plataforma | Alta |

### Fluxos de Usuario

**Fluxo 1 — Estimativa de Entrega:**
1. Na pagina de detalhes do carro (DetalhesCarro), comprador ve "Estimar custo de entrega"
2. Seleciona o seu concelho de destino (dropdown com CONCELHOS)
3. Sistema calcula distancia entre o concelho do vendedor (campo `local` do Carro) e o destino
4. Exibe estimativa: distancia (km), custo estimado (baseado em tabela preco/km), tempo estimado
5. Inclui disclaimer: "Valor estimado. O custo final depende do transportador."
6. Opcao de "Solicitar orcamento de transporte" → abre chat com mensagem pre-preenchida

**Fluxo 2 — Agendamento de Test Drive:**
1. Na pagina de detalhes do carro, comprador clica "Agendar Test Drive"
2. Ve calendario com dias disponiveis (vendedor define disponibilidade)
3. Seleciona dia e hora preferidos → envia solicitacao
4. Vendedor recebe notificacao → aceita, recusa, ou propoe alternativa
5. Comprador recebe confirmacao com detalhes (morada, hora, contacto)
6. Lembretes automaticos 24h e 1h antes para ambos
7. Apos o test drive, comprador pode avaliar a experiencia

**Fluxo 3 — Checklist de Transferencia:**
1. Comprador acessa "Guia de Transferencia" (link no menu ou na pagina do carro)
2. Ve checklist interativo com passos numerados:
   - Documentos do vendedor (DUA, titulo de registo, declaracao de venda)
   - Documentos do comprador (CC/BI, NIF, comprovativo de morada)
   - Passos no IMT (Registo Online ou balcao)
   - Seguro automovel (obrigatorio antes da transferencia)
   - Inspecao periodica (IPO) — validade
3. Cada item pode ser marcado como "feito" (estado salvo em localStorage)
4. Links uteis para sites oficiais (IMT, ASF, etc.)

**Fluxo 4 — Marketplace de Oficinas:**
1. Usuario acessa "Oficinas" no menu ou via banner na pagina de detalhes
2. Ve lista de oficinas parceiras filtradas por concelho e especialidade
3. Cada oficina mostra: nome, endereco, especialidades, rating, contacto
4. Pode clicar para ver detalhes e enviar mensagem diretamente
5. Apos visita, pode deixar avaliacao (1-5 estrelas + comentario)

**Fluxo 5 — Inspecao Pre-Compra:**
1. Na pagina de detalhes do carro, comprador clica "Solicitar Inspecao"
2. Formulario: dados do carro (auto-preenchidos), disponibilidade do comprador, notas
3. Plataforma notifica inspetores parceiros na regiao do carro
4. Inspetor aceita e agenda data com vendedor
5. Apos inspecao, relatorio e enviado ao comprador (PDF ou seccao no app)
6. Custo da inspecao: pagamento externo (transferencia/MBWay) — plataforma so intermedia

### Requisitos de UI/UX

- **Estimativa de entrega:** widget discreto na sidebar de detalhes. Dropdown de concelho + botao "Calcular". Resultado em card com icone de camiao, distancia, custo e tempo. Cores neutras (brand-100 background).
- **Agendamento:** modal com calendario simplificado (sem dependencia pesada — construir com grid de dias). Slots de horario em botoes selecionaveis. Confirmacao em card verde.
- **Checklist:** pagina dedicada com design de progresso (barra de progresso no topo). Cada item com checkbox, titulo, descricao expandivel, link externo. Estilo checklist de paper/notepad.
- **Oficinas:** cards no estilo dos CarCards existentes. Mapa opcional (se geocoding disponivel). Filtros por especialidade (Mecanica, Eletrica, Pintura, etc.) e concelho.
- **Inspecao:** formulario em steps (wizard) com 3 etapas: dados do carro, disponibilidade, confirmacao. Status tracking: Solicitado → Atribuido → Agendado → Concluido.

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Arquivo | Descricao |
|---|---|
| `src/pages/Oficinas.tsx` | Listagem de oficinas parceiras com filtros |
| `src/pages/OficinaDetalhes.tsx` | Pagina de detalhes de uma oficina |
| `src/pages/Transferencia.tsx` | Guia/checklist de transferencia de veiculo |
| `src/pages/InspecaoSolicitar.tsx` | Formulario wizard para solicitar inspecao |
| `src/components/logistica/EstimativaEntrega.tsx` | Widget de estimativa de custo de entrega |
| `src/components/logistica/AgendamentoTestDrive.tsx` | Modal de agendamento de test drive |
| `src/components/logistica/CalendarioSimples.tsx` | Componente de calendario leve (sem deps) |
| `src/components/logistica/SlotHorario.tsx` | Botao de slot de horario selecionavel |
| `src/components/logistica/StatusInspecao.tsx` | Timeline visual do status da inspecao |
| `src/components/oficinas/OficinaCard.tsx` | Card de oficina parceira |
| `src/components/oficinas/AvaliacaoOficina.tsx` | Formulario de avaliacao (estrelas + texto) |
| `src/components/transferencia/ChecklistItem.tsx` | Item individual do checklist com checkbox |
| `src/components/transferencia/ProgressBar.tsx` | Barra de progresso do checklist |
| `src/hooks/useOficinas.ts` | Hook para fetch e filtro de oficinas |
| `src/hooks/useTestDrive.ts` | Hook para agendamento e gestao de test drives |
| `src/hooks/useInspecao.ts` | Hook para solicitacoes de inspecao |
| `src/hooks/useTransferencia.ts` | Hook para estado do checklist (localStorage) |
| `src/types/oficina.ts` | Interfaces: Oficina, AvaliacaoOficina |
| `src/types/testdrive.ts` | Interfaces: TestDrive, SlotDisponivel |
| `src/types/inspecao.ts` | Interfaces: InspecaoSolicitacao, RelatorioInspecao |
| `src/lib/distancia.ts` | Logica de calculo de distancia e custo de entrega |

### Modificacoes em Arquivos Existentes

| Arquivo | Modificacao |
|---|---|
| `src/App.tsx` | Adicionar rotas: /oficinas, /oficinas/:id, /transferencia, /inspecao/:carroId |
| `src/components/layout/Header.tsx` | Adicionar link "Servicos" no menu (dropdown com Oficinas, Transferencia) |
| `src/components/layout/BottomNav.tsx` | Adicionar item no submenu "Mais" |
| `src/pages/DetalhesCarro.tsx` | Adicionar EstimativaEntrega na sidebar, botao "Agendar Test Drive", link "Solicitar Inspecao" |
| `src/lib/db.ts` | Funcoes CRUD para oficinas, test_drives, inspections, oficina_reviews |
| `src/lib/constants.ts` | Adicionar ESPECIALIDADES_OFICINA, COORDENADAS_CONCELHOS (lat/lng), CUSTO_POR_KM, DOCUMENTOS_TRANSFERENCIA |
| `src/providers/AppProvider.tsx` | Considerar providers separados para nao sobrecarregar o contexto principal |
| `firestore.rules` | Regras para novas colecoes |

### Colecoes Firestore

**Colecao `workshops`** (oficinas):
```typescript
interface Oficina {
  id: string;
  nome: string;
  descricao: string;
  especialidades: string[];  // ['Mecanica', 'Eletrica', 'Pintura', 'Ar-condicionado']
  concelho: string;          // referencia a CONCELHOS
  morada: string;
  codigoPostal: string;
  telefone: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  horarioFuncionamento: string; // ex: "Seg-Sex 9h-18h, Sab 9h-13h"
  fotos: string[];
  rating: number;            // media agregada (denormalizada)
  totalAvaliacoes: number;
  parceiro: boolean;         // oficina parceira verificada pelo ReparAuto
  ativo: boolean;
  criador: string;           // uid de quem registou
  dataCriacao: Timestamp;
}
```

**Colecao `workshop_reviews`:**
```typescript
interface AvaliacaoOficina {
  id: string;
  oficinaId: string;
  autorUid: string;
  autorNome: string;
  rating: number;           // 1-5
  comentario: string;
  servico: string;          // tipo de servico realizado
  dataCriacao: Timestamp;
}
```

**Colecao `test_drives`:**
```typescript
interface TestDrive {
  id: string;
  carroId: string;
  carroTitulo: string;     // denormalizado: "Renault Clio 1.5 dCi 2007"
  compradorUid: string;
  compradorNome: string;
  vendedorUid: string;
  vendedorNome: string;
  dataPropostas: Timestamp[]; // datas propostas pelo comprador
  dataConfirmada?: Timestamp; // data aceite pelo vendedor
  horaConfirmada?: string;    // ex: "14:30"
  localEncontro?: string;     // morada ou ponto de referencia
  status: 'solicitado' | 'confirmado' | 'reagendado' | 'cancelado' | 'concluido';
  notas?: string;
  dataCriacao: Timestamp;
  dataAtualizacao: Timestamp;
}
```

**Colecao `inspections`:**
```typescript
interface InspecaoSolicitacao {
  id: string;
  carroId: string;
  carroTitulo: string;
  solicitanteUid: string;
  solicitanteNome: string;
  vendedorUid: string;
  inspetorUid?: string;      // atribuido depois
  inspetorNome?: string;
  dataPreferida?: Timestamp;
  notas: string;
  status: 'solicitado' | 'atribuido' | 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  relatorio?: RelatorioInspecao;
  dataCriacao: Timestamp;
  dataAtualizacao: Timestamp;
}

interface RelatorioInspecao {
  estado_geral: 'bom' | 'razoavel' | 'mau';
  motor: string;
  transmissao: string;
  suspensao: string;
  carrocaria: string;
  interior: string;
  eletrica: string;
  fotos: string[];
  observacoes: string;
  custoEstimadoReparos: number;
  recomendacao: 'comprar' | 'negociar' | 'evitar';
}
```

### Regras de Seguranca Firestore

```
// Oficinas — qualquer autenticado pode ler, admin e criador podem gerenciar
match /workshops/{workshopId} {
  allow read: if true;
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && (
    request.auth.uid == resource.data.criador || isAdmin()
  );
  allow delete: if isAdmin();
}

// Avaliacoes de oficinas
match /workshop_reviews/{reviewId} {
  allow read: if true;
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && request.auth.uid == resource.data.autorUid;
  allow delete: if isAdmin();
}

// Test drives — apenas participantes podem ler e atualizar
match /test_drives/{testDriveId} {
  allow read: if isAuthenticated() && (
    request.auth.uid == resource.data.compradorUid ||
    request.auth.uid == resource.data.vendedorUid
  );
  allow create: if isAuthenticated() &&
    request.resource.data.compradorUid == request.auth.uid;
  allow update: if isAuthenticated() && (
    request.auth.uid == resource.data.compradorUid ||
    request.auth.uid == resource.data.vendedorUid
  );
  allow delete: if isAdmin();
}

// Inspecoes — solicitante, vendedor e inspetor podem acessar
match /inspections/{inspectionId} {
  allow read: if isAuthenticated() && (
    request.auth.uid == resource.data.solicitanteUid ||
    request.auth.uid == resource.data.vendedorUid ||
    request.auth.uid == resource.data.inspetorUid ||
    isAdmin()
  );
  allow create: if isAuthenticated() &&
    request.resource.data.solicitanteUid == request.auth.uid;
  allow update: if isAuthenticated() && (
    request.auth.uid == resource.data.solicitanteUid ||
    request.auth.uid == resource.data.inspetorUid ||
    isAdmin()
  );
  allow delete: if isAdmin();
}
```

### APIs/Servicos Externos

| Servico | Uso | Custo |
|---|---|---|
| **Nominatim (OpenStreetMap)** | Geocoding de concelhos para calcular distancias | Gratuito (rate limit: 1 req/s) |
| **Haversine formula (local)** | Calculo de distancia direta entre coordenadas | Gratuito (calculo local, sem API) |
| **Firebase Cloud Functions** | Lembretes de test drive, notificacoes de inspecao | Gratuito (Spark plan) |

### Componentes React Principais

**EstimativaEntrega.tsx:**
- Props: `localVendedor: string` (concelho do carro)
- Dropdown com CONCELHOS para selecionar destino
- Botao "Calcular" → usa funcao de distancia local (coordenadas pre-definidas dos concelhos)
- Resultado: card com icone Truck (lucide-react), distancia em km, custo estimado (CUSTO_POR_KM * distancia), tempo estimado
- Formula de custo: base de 50EUR + 0.80EUR/km (valores configuraveis em constants.ts)

**CalendarioSimples.tsx:**
- Componente de calendario construido com CSS Grid (7 colunas para dias da semana)
- Sem dependencias externas. Usa Date nativo do JavaScript.
- Props: `datasDisponiveis?: Date[]`, `onSelectDate: (date: Date) => void`, `minDate?: Date`
- Navegacao de mes (anterior/proximo). Dias passados desabilitados.
- Estilo: bordas brand-200, dia selecionado bg-accent, dia indisponivel opacity-50

**ChecklistItem.tsx:**
- Props: `titulo: string`, `descricao: string`, `linkExterno?: string`, `concluido: boolean`, `onToggle: () => void`
- Checkbox customizado com Tailwind. Titulo e descricao expandivel (accordion).
- Quando concluido: linha riscada no titulo, fundo brand-50
- Link externo abre em nova aba com icone ExternalLink (lucide-react)

**StatusInspecao.tsx:**
- Props: `status: InspecaoSolicitacao['status']`
- Timeline vertical com circulos conectados por linha
- Status atual destacado com bg-accent. Futuros em brand-200. Concluidos com check verde.
- Labels em portugues para cada etapa

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Funcionalidade | Esforco (dias) | Complexidade | Risco |
|---|---|---|---|
| Estimativa de custo de entrega | 1.5 | Media | Baixo |
| Agendamento de test drive | 3 | Alta | Medio |
| Programa de garantia estendida | 1 | Baixa | Baixo |
| Marketplace de oficinas | 3 | Media | Medio |
| Checklist de transferencia | 1.5 | Baixa | Baixo |
| Inspecao pre-compra | 3.5 | Alta | Alto |
| **Total** | **13.5** | | |

### Avaliacao de Valor

- **Impacto no usuario:** Alto. Estas funcionalidades resolvem dores reais e diferenciadas do processo de compra/venda de carros usados. O checklist de transferencia e a estimativa de entrega sao quick wins de alto impacto.
- **Diferencial competitivo:** Muito alto. Nenhum concorrente portugues oferece este nivel de servico integrado. Aproxima o ReparAuto do modelo Carvana/Cazoo europeu.
- **Retorno de investimento:** Variavel. Checklist e estimativa sao baratos e muito uteis. Marketplace de oficinas e inspecao pre-compra requerem parcerias offline e sao mais arriscados.
- **Risco tecnico:** Medio a alto. As funcionalidades core (estimativa, checklist) sao simples. Porem, agendamento e inspecao envolvem coordenacao entre multiplos usuarios e dependem de confiabilidade do processo.

### Posicao na Matriz

```
         ALTO VALOR
              |
   Quick Win  |  ★ Logistica/Servicos
  (checklist, |  (test drive, inspecao,
   estimativa)|   oficinas)
  BAIXO ------+------ ALTO ESFORCO
              |
  Descartavel |  Projeto Grande
              |
         BAIXO VALOR
```

**Posicao: Espalhado pela matriz.** Recomenda-se dividir em duas fases:
- **Fase 1 (Quick Wins):** Checklist de transferencia + Estimativa de entrega + Garantia (info) = 4 dias
- **Fase 2 (Projetos Maiores):** Agendamento + Oficinas + Inspecao = 9.5 dias

---

## 5. Decisoes de Arquitetura

### Decisao 1: Nominatim (Gratuito) vs Google Geocoding API (Pago) vs MapBox

**Contexto:** Para calcular a distancia entre o vendedor e o comprador, o sistema precisa de coordenadas geograficas dos concelhos. As opcoes sao usar uma API de geocoding ou pré-definir as coordenadas localmente.

| Opcao | Pros | Contras |
|---|---|---|
| **Nominatim (OSM)** | Gratuito; sem chave de API; dados abertos; boa cobertura de Portugal | Rate limit severo (1 req/s); sem SLA; pode ficar offline; latencia variavel |
| **Google Geocoding API** | Rapido e fiavel; cobertura excelente; SLA garantido | Pago ($5/1000 requests); requer billing account; overkill para 6 concelhos |
| **MapBox Geocoding** | Generoso plano gratuito (100k req/mes); boa qualidade | Ainda requer chave de API; dependencia externa |
| **Coordenadas pre-definidas (local)** | Zero dependencia; instantaneo; sem custos; sem rate limit; funciona offline | Limitado aos concelhos da lista CONCELHOS; nao funciona para moradas exatas |

**Recomendacao:** **Coordenadas pre-definidas localmente.** O ReparAuto atualmente trabalha com apenas 6 concelhos (Braga, Porto, Lisboa, Coimbra, Faro, Leiria) definidos em `src/lib/constants.ts`. E trivial adicionar latitude/longitude para cada um e calcular a distancia com a formula de Haversine no client-side. Nenhuma API externa e necessaria. Se no futuro o numero de localidades crescer, migrar para Nominatim sera simples.

### Decisao 2: Google Calendar API vs Sistema Proprio Firestore

**Contexto:** O agendamento de test drives precisa de um sistema de selecao de datas/horarios com confirmacao bilateral. Pode-se integrar com o Google Calendar do usuario ou construir um sistema proprio no Firestore.

| Opcao | Pros | Contras |
|---|---|---|
| **Google Calendar API** | Sincroniza com calendario do usuario; lembretes automaticos; conflitos detectados automaticamente; convites por email | Requer OAuth adicional (alem do Firebase Auth); complexidade de integracao; nem todos usam Google Calendar; dependencia de API externa |
| **Sistema proprio (Firestore)** | Controle total; sem dependencias; integrado com notificacoes existentes (useNotificacoes); funciona para qualquer usuario; dados no Firestore | Precisa construir UI de calendario; precisa implementar lembretes via Cloud Functions; sem sincronizacao com calendarios externos |

**Recomendacao:** **Sistema proprio Firestore.** A integracao com Google Calendar adicionaria complexidade significativa (OAuth scopes, UI de autorizacao, tratamento de erros de API) para um beneficio limitado — nem todos os usuarios do ReparAuto usam Google Calendar. Um sistema simples no Firestore com calendario customizado (CalendarioSimples.tsx) e lembretes via notificacoes in-app (que o projeto ja suporta via useNotificacoes) e mais pragmatico. Os lembretes podem usar Cloud Functions com Firestore scheduled triggers.

---

## 6. Prompt de Implementacao

```
You are implementing logistics and services features for ReparAuto, a Portuguese used-car
and parts marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase.

PROJECT CONTEXT:
- Vite 8 bundler with config at vite.config.ts (uses @tailwindcss/vite plugin, @/ alias)
- React Router 7 with HashRouter in src/App.tsx — all routes in <Routes> block
- Firebase SDK configured in src/lib/firebase.ts (exports: auth, db, storage)
- Firestore CRUD operations in src/lib/db.ts — collections: 'cars' (CARROS_COLLECTION),
  'parts' (PECAS_COLLECTION), 'users', 'messages', 'notifications', 'services'
- Firestore security rules in firestore.rules — uses helper functions: isAuthenticated(),
  isOwner(userId), isAdmin(), isOwnerByEmail(), isCreatorByEmail()
- Global state via Context API in src/providers/AppProvider.tsx
- Types: Carro (src/types/carro.ts) has fields: id, marca, modelo, preco, km, local (concelho),
  criador (email), vendedorNome, vendedorTelefone, vendedorWhatsApp, fotos[], status
- Usuario (src/types/usuario.ts): uid, nome, email, telefone, localidade, role
- Constants at src/lib/constants.ts: CONCELHOS = ['Braga', 'Porto', 'Lisboa', 'Coimbra', 'Faro', 'Leiria']
- Hooks: useAuth.ts, useCarros.ts, useNotificacoes.ts, useChat.ts (in src/hooks/)
- UI components: Button.tsx, Modal.tsx, Toast.tsx, Badge.tsx (in src/components/ui/)
- Car detail page: src/pages/DetalhesCarro.tsx — shows full car info with gallery
- Detail sub-components: GalleryModal.tsx, ContactSection.tsx, StatusPanel.tsx,
  TechnicalSheet.tsx (in src/components/detalhes/)
- All UI text must be in Portuguese (PT-PT). Code/comments/variables in English.
- Import alias: always use @/ (maps to src/). No relative imports.
- Styling: Tailwind utility classes only. Brand colors: brand-50 to brand-900. Accent: #e55b2b.
- Icons: lucide-react and Font Awesome (via CDN)

TASK 1 — Distance Calculation & Delivery Estimate (Pure Client-Side):
1. Update src/lib/constants.ts: add COORDENADAS_CONCELHOS object mapping each concelho
   to its latitude/longitude:
   - Braga: { lat: 41.5503, lng: -8.4200 }
   - Porto: { lat: 41.1579, lng: -8.6291 }
   - Lisboa: { lat: 38.7223, lng: -9.1393 }
   - Coimbra: { lat: 40.2033, lng: -8.4103 }
   - Faro: { lat: 37.0194, lng: -7.9322 }
   - Leiria: { lat: 39.7437, lng: -8.8071 }
   Also add: CUSTO_BASE_ENTREGA = 50 (EUR), CUSTO_POR_KM = 0.80 (EUR/km),
   VELOCIDADE_MEDIA_TRANSPORTE = 60 (km/h)
2. Create src/lib/distancia.ts:
   - haversineDistance(lat1, lng1, lat2, lng2): number — returns distance in km
   - calcularEstimativaEntrega(concelhoOrigem: string, concelhoDestino: string):
     { distanciaKm: number, custoEstimado: number, tempoEstimadoHoras: number } | null
   - Uses COORDENADAS_CONCELHOS from constants. Returns null if concelho not found.
3. Create src/components/logistica/EstimativaEntrega.tsx:
   - Props: { localVendedor: string }
   - State: concelhoDestino (dropdown), resultado (from calcularEstimativaEntrega)
   - UI: select dropdown with CONCELHOS, "Calcular" button (accent color)
   - Result card: Truck icon (lucide-react), distance, cost (formatted €), estimated time
   - If localVendedor === concelhoDestino, show "Recolha local — sem custo de transporte"
   - Disclaimer text in small gray text below
4. Add EstimativaEntrega to src/pages/DetalhesCarro.tsx: render below ContactSection,
   passing carro.local as localVendedor prop

TASK 2 — Transfer Checklist (localStorage-based):
1. Update src/lib/constants.ts: add DOCUMENTOS_TRANSFERENCIA array:
   [
     { id: 'dua', titulo: 'Documento Unico Automovel (DUA)', descricao: 'Certificado de
       matricula do veiculo. O vendedor deve entregar o original.', link: 'https://www.imt-ip.pt' },
     { id: 'titulo', titulo: 'Titulo de Registo de Propriedade', descricao: 'Documento que
       comprova a propriedade. Verificar se nao tem onus ou penhoras.', link: null },
     { id: 'declaracao_venda', titulo: 'Declaracao de Venda', descricao: 'Modelo disponivel
       no site do IMT. Deve ser assinada por vendedor e comprador.', link: 'https://www.imt-ip.pt' },
     { id: 'cc', titulo: 'Cartao de Cidadao (Comprador)', descricao: 'Documento de
       identificacao valido do comprador.', link: null },
     { id: 'nif', titulo: 'NIF do Comprador', descricao: 'Numero de identificacao fiscal.
       Necessario para o registo.', link: null },
     { id: 'seguro', titulo: 'Seguro Automovel', descricao: 'Obrigatorio antes de circular.
       Contratar seguro minimo de responsabilidade civil.', link: 'https://www.asf.com.pt' },
     { id: 'ipo', titulo: 'Inspecao Periodica Obrigatoria (IPO)', descricao: 'Verificar
       validade. Se expirada, agendar nova inspecao antes da transferencia.',
       link: 'https://www.imt-ip.pt' },
     { id: 'registo_imt', titulo: 'Registo no IMT', descricao: 'Apos reunir documentos,
       fazer o pedido de registo de propriedade no IMT Online ou num balcao.',
       link: 'https://servicos.imt-ip.pt' },
   ]
2. Create src/hooks/useTransferencia.ts:
   - Manages checklist state in localStorage (key: 'reparauto_checklist_transfer')
   - Returns: { items: ChecklistState[], toggleItem(id), resetAll(), progresso: number (0-100) }
   - ChecklistState: { id: string, concluido: boolean }
3. Create src/components/transferencia/ChecklistItem.tsx:
   - Props: titulo, descricao, linkExterno?, concluido, onToggle
   - Expandable accordion: click titulo to show/hide descricao
   - Custom checkbox styled with Tailwind (accent color when checked)
   - External link opens in new tab with ExternalLink icon
4. Create src/components/transferencia/ProgressBar.tsx:
   - Props: progresso: number (0-100)
   - Animated bar: bg-brand-200 track, accent fill, percentage label
5. Create src/pages/Transferencia.tsx:
   - Hero section with title "Guia de Transferencia de Veiculo"
   - ProgressBar at top
   - List of ChecklistItem components
   - "Limpar tudo" button at bottom
   - Informative footer with disclaimers
6. Add route to src/App.tsx: <Route path="/transferencia" element={<Transferencia />} />
7. Add link in src/components/layout/Footer.tsx: "Guia de Transferencia" link

TASK 3 — Test Drive Scheduling:
1. Create src/types/testdrive.ts:
   - interface TestDrive { id, carroId, carroTitulo, compradorUid, compradorNome,
     vendedorUid, vendedorNome, dataPropostas: Timestamp[], dataConfirmada?: Timestamp,
     horaConfirmada?: string, localEncontro?: string,
     status: 'solicitado'|'confirmado'|'reagendado'|'cancelado'|'concluido',
     notas?: string, dataCriacao: Timestamp, dataAtualizacao: Timestamp }
2. Create src/components/logistica/CalendarioSimples.tsx:
   - Pure React+Tailwind calendar, no external deps
   - CSS grid: 7 columns (Dom, Seg, Ter, Qua, Qui, Sex, Sab)
   - Navigation: ChevronLeft/ChevronRight for month, month name (Portuguese) + year
   - Props: onSelectDate, selectedDates: Date[], minDate (default: tomorrow), maxSelectableDates (default: 3)
   - Past days disabled (opacity-50, pointer-events-none)
   - Selected days: bg-accent text-white rounded-full
   - Portuguese month names and day abbreviations
3. Create src/components/logistica/AgendamentoTestDrive.tsx:
   - Uses Modal from src/components/ui/Modal.tsx
   - Step 1: CalendarioSimples — select up to 3 preferred dates
   - Step 2: Select preferred time slots for each date (morning/afternoon/evening buttons)
   - Step 3: Optional notes textarea
   - Step 4: Confirmation summary and "Enviar Solicitacao" button
   - Creates TestDrive document in Firestore and notification for seller
4. Create src/hooks/useTestDrive.ts:
   - Functions: solicitarTestDrive(data), getTestDrivesPorCarro(carroId),
     getTestDrivesPorUsuario(uid), atualizarStatus(id, status, extras?)
   - Real-time listener for user's test drives
5. Update src/lib/db.ts: add CRUD functions for 'test_drives' collection
6. Update src/pages/DetalhesCarro.tsx: add "Agendar Test Drive" button that opens
   AgendamentoTestDrive modal. Only visible to authenticated users who are NOT the car owner.
7. Update firestore.rules: add test_drives rules

TASK 4 — Workshops Marketplace:
1. Create src/types/oficina.ts:
   - interface Oficina { id, nome, descricao, especialidades: string[], concelho, morada,
     codigoPostal, telefone, whatsapp?, email?, website?, horarioFuncionamento, fotos: string[],
     rating: number, totalAvaliacoes: number, parceiro: boolean, ativo: boolean,
     criador: string, dataCriacao: Timestamp }
   - interface AvaliacaoOficina { id, oficinaId, autorUid, autorNome, rating: number,
     comentario, servico, dataCriacao: Timestamp }
2. Update src/lib/constants.ts: add ESPECIALIDADES_OFICINA = ['Mecanica Geral',
   'Eletrica e Eletronica', 'Pintura e Funilaria', 'Ar-condicionado', 'Pneus e Alinhamento',
   'Diagnostico', 'Inspecao']
3. Create src/hooks/useOficinas.ts:
   - Fetch from 'workshops' collection, filter by concelho and especialidade
   - Return: { oficinas, loading, filtroConcelho, setFiltroConcelho,
     filtroEspecialidade, setFiltroEspecialidade }
4. Create src/components/oficinas/OficinaCard.tsx:
   - Card layout similar to CarCard: image, nome, concelho, especialidades as badges,
     rating stars, phone/whatsapp buttons
5. Create src/pages/Oficinas.tsx:
   - Filter bar: concelho dropdown (CONCELHOS), especialidade dropdown
   - Grid of OficinaCard components
   - "Registar a sua oficina" CTA for authenticated users
6. Create src/pages/OficinaDetalhes.tsx:
   - Full details, photos, map placeholder, reviews list, review form
7. Add routes to src/App.tsx: /oficinas, /oficinas/:id
8. Update firestore.rules: add workshops and workshop_reviews rules

TASK 5 — Pre-Purchase Inspection:
1. Create src/types/inspecao.ts with InspecaoSolicitacao and RelatorioInspecao interfaces
2. Create src/components/logistica/StatusInspecao.tsx:
   - Vertical timeline with steps: Solicitado → Atribuido → Agendado → Em andamento → Concluido
   - Active step highlighted with accent color, completed steps with green check
3. Create src/hooks/useInspecao.ts: CRUD for 'inspections' collection
4. Create src/pages/InspecaoSolicitar.tsx: wizard form (3 steps)
5. Add route to src/App.tsx: /inspecao/:carroId
6. Add "Solicitar Inspecao" button to DetalhesCarro.tsx

IMPORTANT CONSTRAINTS:
- Do NOT use any external calendar library (react-datepicker, etc.). Build CalendarioSimples
  from scratch with CSS Grid and native Date.
- Do NOT use Google Maps or any map SDK. For now, locations are text-based (concelhos only).
- Distance calculation is purely local using hardcoded coordinates + Haversine formula.
  No external API calls needed.
- The CalendarioSimples component must use Portuguese day/month names.
- Test drive creation must also create a notification in the 'notifications' collection
  (reuse the existing createNotificacao function pattern from src/lib/db.ts).
- All new Firestore collections need corresponding security rules in firestore.rules.
- Keep the inspection feature as an MVP: request → admin/inspector assigns → status updates.
  No payment processing within the platform.
```
