# Plano: Confianca e Seguranca

**Status:** ✅ IMPLEMENTADO (PR #3)
**Prioridade:** ALTA
**Estimativa Total:** 18-24 dias de desenvolvimento
**Impacto Principal:** Confianca do utilizador, retencao e reducao de fraude

---

## 1. Visao Geral

### O Que Resolve

O ReparAuto e um marketplace de veiculos usados e pecas, um setor onde a confianca e o fator decisivo para concretizar transacoes. Atualmente, a plataforma nao oferece mecanismos para distinguir vendedores confiaveis de potenciais fraudulentos, nao permite que compradores partilhem experiencias com outros utilizadores, e nao dispoe de ferramentas para validar o historico de um veiculo. Este plano implementa uma camada completa de confianca e seguranca que abrange verificacao de vendedores, avaliacoes, consulta de historico VIN, sistema de denuncias e badges de confianca.

### Benchmark Competitivo

| Plataforma | Verificacao Vendedor | Avaliacoes | Consulta VIN | Denuncias | Badges |
|---|---|---|---|---|---|
| **OLX Portugal** | Parcial (telefone) | Nao | Nao | Sim | Nao |
| **Standvirtual** | Sim (stands) | Nao | Parcial | Sim | Sim (Pro) |
| **AutoScout24** | Sim (dealers) | Sim | Sim (parceiro) | Sim | Sim |
| **Carros.net** | Nao | Nao | Nao | Basico | Nao |
| **ReparAuto (atual)** | Nao | Nao | Nao | Nao | Nao |
| **ReparAuto (proposto)** | Sim | Sim | Sim (API) | Sim | Sim |

### Historias de Utilizador

1. **Como comprador**, quero ver se um vendedor e verificado e qual a sua avaliacao media, para que possa decidir se confio nele antes de me deslocar para ver o veiculo.
2. **Como vendedor profissional**, quero solicitar a verificacao da minha conta e exibir um badge de confianca nos meus anuncios, para que os compradores me prefiram em relacao a vendedores nao verificados.
3. **Como utilizador**, quero poder denunciar um anuncio suspeito (preco irrealista, fotos roubadas, descricao enganosa) para que a equipa de moderacao possa agir rapidamente e proteger a comunidade.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

#### 2.1 Verificacao de Vendedores
Fluxo de solicitacao de verificacao para contas profissionais. O vendedor submete documentacao (NIF empresarial, alvara ou equivalente), o admin revisa e aprova/rejeita. Uma vez aprovado, o vendedor recebe um badge "Verificado" visivel em todos os seus anuncios e no perfil.

#### 2.2 Sistema de Avaliacoes e Reviews
Os utilizadores autenticados podem deixar avaliacoes (1-5 estrelas) e comentarios textuais sobre vendedores com quem interagiram. A media de avaliacoes e denormalizada no documento do utilizador para consulta rapida. Reviews podem ser reportadas se inapropriadas.

#### 2.3 Consulta VIN / Historico do Veiculo
Integracao com API externa (Car Vertical, focada no mercado europeu) para permitir que compradores consultem o historico de um veiculo a partir do numero VIN. Inclui historico de sinistros, quilometragem real, registos de propriedade e situacao legal.

#### 2.4 Denuncia de Anuncios
Botao "Reportar" em cada anuncio e perfil de vendedor. O utilizador seleciona o motivo (fraude, informacao falsa, fotos roubadas, conteudo inapropriado, outro) e pode adicionar uma descricao. As denuncias ficam disponiveis numa fila de moderacao no painel admin.

#### 2.5 Badges de Confianca
Sistema visual de badges exibidos nos cartoes de anuncios e paginas de detalhes: "Vendedor Verificado", "Perfil Completo", "Membro desde [ano]", "X avaliacoes positivas". Os badges sao calculados automaticamente com base nos dados do perfil.

### Fluxos de Utilizador

**Fluxo de Verificacao:**
1. Vendedor acede ao perfil → clica "Solicitar Verificacao"
2. Preenche formulario com dados empresariais (NIF, nome empresa)
3. Faz upload de documento comprovativo (ate 2 ficheiros PDF/imagem)
4. Sistema cria pedido com status `pendente` na colecao `verifications`
5. Admin recebe notificacao → acede ao painel admin → aba "Verificacoes"
6. Admin revisa documentos → aprova ou rejeita (com motivo)
7. Sistema atualiza `verified: true` no documento do utilizador e cria notificacao

**Fluxo de Avaliacao:**
1. Comprador acede ao perfil de um vendedor ou pagina de detalhes de um anuncio
2. Clica "Avaliar Vendedor" (so disponivel se autenticado e nao for o proprio)
3. Seleciona estrelas (1-5) e escreve comentario opcional
4. Review e guardada na colecao `reviews`
5. Cloud Function (ou trigger no cliente) recalcula media e total no documento do utilizador

**Fluxo de Denuncia:**
1. Utilizador clica no icone de bandeira/reportar no anuncio
2. Modal abre com opcoes de motivo pre-definidas + campo de texto livre
3. Denuncia e criada na colecao `reports` com status `pendente`
4. Admin ve a fila de denuncias no painel → pode resolver, remover anuncio ou ignorar

### Requisitos de UI/UX

- Badges devem ser visualmente distintos (icones + cores) e consistentes em todo o site (cartoes, detalhes, perfil)
- Estrelas de avaliacao devem usar o padrao de 5 estrelas com meia-estrela (0.5 incrementos na exibicao)
- Botao de denuncia deve ser discreto mas acessivel (icone de bandeira no canto do anuncio)
- Modal de verificacao deve guiar o utilizador passo a passo com indicadores de progresso
- Resultados VIN devem ser apresentados em formato de relatorio visual com iconografia clara (check verde, alerta amarelo, perigo vermelho)

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Caminho | Finalidade |
|---|---|
| `src/types/review.ts` | Interface `Review` e tipos relacionados |
| `src/types/report.ts` | Interface `Report` e tipos de motivo |
| `src/types/verification.ts` | Interface `VerificationRequest` e status |
| `src/hooks/useReviews.ts` | Hook para CRUD de avaliacoes de um vendedor |
| `src/hooks/useReports.ts` | Hook para criar denuncias (utilizador) |
| `src/hooks/useVerification.ts` | Hook para solicitar e consultar estado de verificacao |
| `src/hooks/useVinCheck.ts` | Hook para consulta VIN via API externa |
| `src/components/perfil/SellerBadges.tsx` | Componente de badges de confianca |
| `src/components/perfil/ReviewsList.tsx` | Lista de avaliacoes de um vendedor |
| `src/components/perfil/ReviewForm.tsx` | Formulario para deixar avaliacao |
| `src/components/perfil/VerificationRequest.tsx` | Formulario de solicitacao de verificacao |
| `src/components/detalhes/ReportButton.tsx` | Botao + modal de denuncia |
| `src/components/detalhes/ReportModal.tsx` | Modal com formulario de denuncia |
| `src/components/detalhes/VinCheckPanel.tsx` | Painel de consulta VIN nos detalhes do carro |
| `src/components/admin/VerificationsQueue.tsx` | Fila de verificacoes pendentes (admin) |
| `src/components/admin/ReportsQueue.tsx` | Fila de denuncias pendentes (admin) |
| `src/components/home/TrustBadge.tsx` | Badge individual reutilizavel |

### Modificacoes em Arquivos Existentes

| Caminho | Alteracoes |
|---|---|
| `src/types/usuario.ts` | Adicionar campos `verified`, `verifiedAt`, `averageRating`, `totalReviews`, `memberSince` a `Usuario` |
| `src/lib/db.ts` | Adicionar funcoes CRUD para colecoes `reviews`, `reports`, `verifications`; funcao para recalcular media de avaliacoes |
| `src/lib/constants.ts` | Adicionar `MOTIVOS_DENUNCIA` e `BADGES_CONFIANCA` |
| `src/components/home/CarCard.tsx` | Renderizar badges de confianca do vendedor no cartao |
| `src/components/detalhes/ContactSection.tsx` | Adicionar badges + link para avaliacoes + botao reportar |
| `src/components/perfil/ProfileLoggedIn.tsx` | Adicionar seccao de verificacao, badges e avaliacoes recebidas |
| `src/pages/Admin.tsx` | Adicionar abas "Verificacoes" e "Denuncias" |
| `src/pages/DetalhesCarro.tsx` | Integrar `VinCheckPanel` e `ReportButton` |
| `src/providers/AppProvider.tsx` | Nao necessita alteracao significativa (hooks sao locais a cada pagina) |
| `firestore.rules` | Adicionar regras para `reviews`, `reports`, `verifications` |

### Colecoes Firestore

#### Colecao `reviews`
```typescript
interface Review {
  id: string;
  reviewerUid: string;      // UID de quem avalia
  reviewerNome: string;     // Nome de quem avalia (denormalizado)
  reviewerFoto: string | null;
  targetUid: string;        // UID do vendedor avaliado
  rating: number;           // 1-5
  comentario: string;       // Texto livre (max 500 chars)
  dataCriacao: Timestamp;
  reportado: boolean;       // Se esta review foi denunciada
}
```

#### Colecao `reports`
```typescript
interface Report {
  id: string;
  reporterUid: string;      // Quem reportou
  targetType: 'car' | 'part' | 'user' | 'review';
  targetId: string;          // ID do anuncio/utilizador/review
  motivo: MotivoReport;     // 'fraude' | 'info_falsa' | 'fotos_roubadas' | 'conteudo_inapropriado' | 'outro'
  descricao: string;
  status: 'pendente' | 'resolvido' | 'ignorado';
  resolvidoPor?: string;     // UID do admin
  resolucao?: string;        // Nota do admin
  dataCriacao: Timestamp;
  dataResolucao?: Timestamp;
}
```

#### Colecao `verifications`
```typescript
interface VerificationRequest {
  id: string;
  uid: string;               // UID do solicitante
  nomeEmpresa: string;
  nif: string;
  documentos: string[];      // URLs dos ficheiros no Storage
  status: 'pendente' | 'aprovado' | 'rejeitado';
  motivoRejeicao?: string;
  analisadoPor?: string;     // UID do admin
  dataCriacao: Timestamp;
  dataAnalise?: Timestamp;
}
```

#### Atualizacao na colecao `users`
```typescript
// Campos adicionais no documento do utilizador
{
  verified: boolean;          // default false
  verifiedAt: Timestamp | null;
  averageRating: number;      // default 0
  totalReviews: number;       // default 0
}
```

### Regras de Seguranca Firestore

```
match /reviews/{reviewId} {
  allow read: if true;
  allow create: if isAuthenticated()
    && request.resource.data.reviewerUid == request.auth.uid
    && request.resource.data.targetUid != request.auth.uid;
  allow update: if isAuthenticated()
    && resource.data.reviewerUid == request.auth.uid
    || isAdmin();
  allow delete: if isAdmin();
}

match /reports/{reportId} {
  allow read: if isAdmin();
  allow create: if isAuthenticated()
    && request.resource.data.reporterUid == request.auth.uid;
  allow update: if isAdmin();
  allow delete: if isAdmin();
}

match /verifications/{verificationId} {
  allow read: if isAuthenticated()
    && (resource.data.uid == request.auth.uid || isAdmin());
  allow create: if isAuthenticated()
    && request.resource.data.uid == request.auth.uid;
  allow update: if isAdmin();
  allow delete: if isAdmin();
}
```

### APIs / Servicos Externos

#### Car Vertical API (Consulta VIN)
- **URL:** `https://api.carvertical.com/v1/`
- **Preco:** ~15-30 EUR por consulta (modelo pay-per-report)
- **Cobertura:** Europa (Portugal incluido), historico de sinistros, quilometragem, furtos, dados tecnicos
- **Integracao:** Necessita proxy via Firebase Cloud Function (para ocultar API key do cliente)
- **Alternativas consideradas:** CARFAX EU (menos cobertura em Portugal), base propria (inviavel a curto prazo)

### Componentes React Principais

```typescript
// src/components/perfil/SellerBadges.tsx
interface SellerBadgesProps {
  verified: boolean;
  profileCompleted: boolean;
  memberSince?: Timestamp;
  averageRating: number;
  totalReviews: number;
  compact?: boolean; // Para uso nos cartoes (versao pequena)
}

// src/components/perfil/ReviewForm.tsx
interface ReviewFormProps {
  targetUid: string;
  targetNome: string;
  onSubmit: () => void;
  onCancel: () => void;
}

// src/components/detalhes/ReportModal.tsx
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'car' | 'part' | 'user' | 'review';
  targetId: string;
}

// src/components/detalhes/VinCheckPanel.tsx
interface VinCheckPanelProps {
  marca: string;
  modelo: string;
  ano: number;
}

// src/components/admin/ReportsQueue.tsx
interface ReportsQueueProps {
  reports: Report[];
  onResolve: (id: string, resolucao: string) => Promise<void>;
  onIgnore: (id: string) => Promise<void>;
  onRemoveTarget: (report: Report) => Promise<void>;
}

// src/components/admin/VerificationsQueue.tsx
interface VerificationsQueueProps {
  requests: VerificationRequest[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, motivo: string) => Promise<void>;
}
```

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Tarefa | Esforco (dias) | Competencias |
|---|---|---|
| Tipos TypeScript e interfaces (review, report, verification) | 0.5 | TypeScript |
| Funcoes CRUD em `db.ts` para as 3 colecoes | 2 | Firestore |
| Regras Firestore para as 3 colecoes | 1 | Firestore Rules |
| Hook `useReviews` + logica de media denormalizada | 1.5 | React, Firestore |
| Hook `useReports` | 0.5 | React, Firestore |
| Hook `useVerification` | 1 | React, Firestore, Storage |
| Componentes de badges (`SellerBadges`, `TrustBadge`) | 1 | React, Tailwind |
| Componentes de avaliacoes (`ReviewForm`, `ReviewsList`) | 2 | React, Tailwind |
| Modal de denuncia (`ReportButton`, `ReportModal`) | 1 | React, Tailwind |
| Fila de verificacoes no admin (`VerificationsQueue`) | 2 | React, Tailwind |
| Fila de denuncias no admin (`ReportsQueue`) | 1.5 | React, Tailwind |
| Integracao nos componentes existentes (CarCard, ContactSection, Perfil) | 2 | React |
| Firebase Cloud Function para proxy VIN API | 2 | Firebase Functions, Node.js |
| Componente `VinCheckPanel` | 1.5 | React, API externa |
| Testes manuais e ajustes | 2 | QA |
| **Total** | **~20 dias** | |

### Avaliacao de Valor

| Dimensao | Impacto | Justificacao |
|---|---|---|
| **Aquisicao** | Alto | Badges de confianca e avaliacoes sao fatores diferenciadores face a concorrencia (OLX, Carros.net) |
| **Retencao** | Muito Alto | Utilizadores que confiam na plataforma regressam; reviews criam efeito de rede |
| **Receita** | Medio | Consulta VIN pode ser monetizada (taxa por consulta); verificacao profissional pode ser servico premium futuro |
| **Seguranca** | Muito Alto | Sistema de denuncias reduz fraude e cumpre obrigacoes do DSA (Digital Services Act) ja mencionado nos termos |

### Posicao na Matriz

**ESTRATEGICO** — Esforco medio-alto (20 dias), valor muito alto. A confianca e fundamental para um marketplace de veiculos usados, especialmente um focado em carros com necessidade de reparacao (segmento com maior risco de fraude). A implementacao do sistema de denuncias tambem e uma obrigacao legal pelo DSA.

---

## 5. Decisoes de Arquitetura

### Decisao 1: API de Consulta VIN

**Contexto:** Necessitamos de uma fonte de dados para historico de veiculos europeus (sinistros, quilometragem, furtos). Tres opcoes foram avaliadas.

| Opcao | Pros | Contras |
|---|---|---|
| **Car Vertical** | Excelente cobertura europeia; API bem documentada; suporte a Portugal; pay-per-report | Custo por consulta (~15-30 EUR); requer Cloud Function como proxy |
| **CARFAX EU** | Marca reconhecida; dados extensos | Cobertura em Portugal mais limitada; custo mais elevado; API menos acessivel para startups |
| **Base propria** | Sem custo por consulta; controlo total | Inviavel a curto prazo; sem acesso a bases de dados governamentais; enorme esforco de construcao e manutencao |

**Recomendacao:** **Car Vertical**. Melhor relacao cobertura/custo para o mercado portugues. A integracao e feita via Firebase Cloud Function que serve como proxy seguro para a API key. O custo pode ser repassado ao utilizador (modelo pay-per-check) ou absorvido como diferencial competitivo numa fase inicial.

### Decisao 2: Reviews — Anonimas vs. Apenas Compradores Verificados

**Contexto:** Necessitamos definir quem pode deixar avaliacoes sobre vendedores. Duas abordagens foram avaliadas.

| Opcao | Pros | Contras |
|---|---|---|
| **Reviews de qualquer utilizador autenticado** | Mais volume de reviews; menor barreira de entrada; mais rapido atingir massa critica | Risco de reviews falsas; vendedor pode criar contas para se auto-avaliar; compradores sem transacao podem avaliar |
| **Apenas compradores verificados (via chat ou transacao)** | Reviews mais fidedignas; menor risco de manipulacao | Muito menos volume; dificil verificar "compra" sem sistema de pagamento integrado; complexidade adicional |

**Recomendacao:** **Qualquer utilizador autenticado**, com as seguintes salvaguardas: (1) nao e possivel avaliar a si proprio; (2) apenas 1 review por par reviewer-target; (3) reviews podem ser denunciadas e removidas pelo admin; (4) flag visual "Comprador Confirmado" se houve troca de mensagens no chat entre os dois utilizadores (consultando a colecao `messages`). Esta abordagem prioriza volume e simplicidade, essenciais numa plataforma em fase de crescimento.

---

## 6. Prompt de Implementacao

```
You are implementing the "Trust & Safety" feature set for ReparAuto, a Portuguese used-car and parts marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase.

IMPORTANT CONTEXT:
- All UI text must be in Portuguese (PT-PT). Code, comments, variable names, and commit messages in English.
- Import alias: @/ maps to src/. NEVER use relative imports.
- Styling: Tailwind utility classes only. Theme is in src/index.css.
- State: Context API + custom hooks. No Redux/Zustand.
- Firestore real-time: use onSnapshot() for live data. Clean up subscriptions on unmount.
- New listings default to status: 'pendente' (admin approves).
- Auth: Firebase Auth (email/password + Google). Roles: 'user' | 'admin'.

EXISTING FILES TO REFERENCE:
- src/types/usuario.ts — Usuario interface (uid, nome, email, telefone, tipoConta, role, etc.)
- src/types/carro.ts — Carro interface (marca, modelo, preco, fotos[], criador, status, etc.)
- src/types/peca.ts — Peca interface (tipo, titulo, categoria, criador, status, etc.)
- src/types/notificacao.ts — Notificacao interface and TipoNotificacao type
- src/lib/db.ts — All Firestore CRUD (getCarros, addCarro, getUserProfile, criarNotificacao, etc.). Collection names: 'cars', 'parts', 'users', 'notifications', 'messages'
- src/lib/constants.ts — CONCELHOS, TIPOS_COMBUSTIVEL, etc.
- src/hooks/useAuth.ts — Returns user, isLoggedIn, isAdmin, updateProfile, etc.
- src/hooks/useCarros.ts — Car listing with client-side filtering
- src/hooks/useFavoritos.ts — Favorites with Firestore/localStorage fallback
- src/hooks/useNotificacoes.ts — Polling-based notification hook
- src/components/home/CarCard.tsx — Car card component used in grid
- src/components/detalhes/ContactSection.tsx — Contact section on car detail page
- src/components/perfil/ProfileLoggedIn.tsx — Logged-in profile page
- src/pages/Admin.tsx — Admin panel with tabs
- src/pages/DetalhesCarro.tsx — Car detail page
- src/providers/AppProvider.tsx — Global context composition
- firestore.rules — Current security rules with isAuthenticated(), isOwner(), isAdmin(), isOwnerByEmail() helpers

TASKS — Implement in this order:

1. TYPE DEFINITIONS
   Create src/types/review.ts:
   - Export type MotivoReport = 'fraude' | 'info_falsa' | 'fotos_roubadas' | 'conteudo_inapropriado' | 'outro'
   - Export interface Review { id: string; reviewerUid: string; reviewerNome: string; reviewerFoto: string | null; targetUid: string; rating: number; comentario: string; dataCriacao: Timestamp; reportado: boolean; }
   
   Create src/types/report.ts:
   - Export interface Report { id: string; reporterUid: string; targetType: 'car' | 'part' | 'user' | 'review'; targetId: string; motivo: MotivoReport; descricao: string; status: 'pendente' | 'resolvido' | 'ignorado'; resolvidoPor?: string; resolucao?: string; dataCriacao: Timestamp; dataResolucao?: Timestamp; }
   
   Create src/types/verification.ts:
   - Export interface VerificationRequest { id: string; uid: string; nomeEmpresa: string; nif: string; documentos: string[]; status: 'pendente' | 'aprovado' | 'rejeitado'; motivoRejeicao?: string; analisadoPor?: string; dataCriacao: Timestamp; dataAnalise?: Timestamp; }

   Modify src/types/usuario.ts:
   - Add to Usuario interface: verified: boolean; verifiedAt?: Timestamp; averageRating: number; totalReviews: number;

2. CONSTANTS
   In src/lib/constants.ts, add:
   - MOTIVOS_DENUNCIA array with label/value pairs for report reasons
   - BADGES_CONFIANCA array defining badge types, icons, and conditions

3. DATABASE LAYER
   In src/lib/db.ts, add functions:
   - Reviews: addReview(), getReviewsByTarget(targetUid), getReviewByReviewerAndTarget(), deleteReview(), recalculateUserRating(targetUid) — this last one queries all reviews for that user, computes average, and updates the user doc
   - Reports: addReport(), getReportsPendentes(), updateReportStatus()
   - Verifications: addVerificationRequest(), getVerificationRequests(), updateVerificationStatus(), getUserVerification(uid)
   Use the same patterns as existing functions (try/catch, console.error, Timestamp.now()).

4. FIRESTORE RULES
   Update firestore.rules to add match blocks for /reviews/{reviewId}, /reports/{reportId}, /verifications/{verificationId} with the rules specified in the plan.

5. HOOKS
   Create src/hooks/useReviews.ts — takes targetUid, returns reviews[], loading, addReview(), averageRating, totalReviews. Use onSnapshot for real-time.
   Create src/hooks/useReports.ts — returns submitReport() function. Simple hook, no subscription needed.
   Create src/hooks/useVerification.ts — takes uid, returns verificationStatus, requestVerification(), loading.

6. UI COMPONENTS
   Create src/components/perfil/SellerBadges.tsx — Receives verified, profileCompleted, memberSince, averageRating, totalReviews props. Renders a row of visual badges using Tailwind. Compact mode for card usage.
   Create src/components/perfil/ReviewForm.tsx — Star rating input (1-5, clickable stars), textarea for comment (max 500 chars), submit button. Portuguese labels.
   Create src/components/perfil/ReviewsList.tsx — Maps over reviews array, shows reviewer avatar/name, stars, comment, date. Includes "Reportar" link on each review.
   Create src/components/detalhes/ReportButton.tsx — Small flag icon button that opens ReportModal.
   Create src/components/detalhes/ReportModal.tsx — Modal (use existing src/components/ui/Modal.tsx) with radio buttons for motivo, textarea for descricao, submit button.
   Create src/components/perfil/VerificationRequest.tsx — Form with nomeEmpresa, nif inputs, file upload (max 2 files), submit button.
   Create src/components/admin/ReportsQueue.tsx — Table listing pending reports with resolve/ignore/remove actions.
   Create src/components/admin/VerificationsQueue.tsx — Table listing pending verification requests with approve/reject actions.

7. INTEGRATION
   Modify src/components/home/CarCard.tsx — Below the seller name, render <SellerBadges compact /> if the seller data includes verified/rating info. You'll need to look up seller data from the vendedorEmail or criador field.
   Modify src/components/detalhes/ContactSection.tsx — Add <SellerBadges /> above contact info, <ReportButton /> in the corner, link to reviews section.
   Modify src/components/perfil/ProfileLoggedIn.tsx — Add verification request section (if tipoConta === 'profissional' and not yet verified), badges display, and reviews list.
   Modify src/pages/Admin.tsx — Add new tabs "Verificacoes" and "Denuncias" using VerificationsQueue and ReportsQueue components.
   Modify src/pages/DetalhesCarro.tsx — Add ReportButton in the page header area.

8. VIN CHECK (separate phase, requires Cloud Function)
   Create a Firebase Cloud Function in functions/src/vinCheck.ts that:
   - Accepts a VIN string via HTTPS callable
   - Calls Car Vertical API with the server-side API key
   - Returns the report data
   Create src/hooks/useVinCheck.ts — calls the Cloud Function, manages loading/error/data states.
   Create src/components/detalhes/VinCheckPanel.tsx — Input field for VIN, "Consultar" button, results display with color-coded sections.

DESIGN GUIDELINES:
- Use the existing color scheme from src/index.css theme
- Stars should be filled/empty SVG icons in amber/yellow color
- Verified badge: shield icon with checkmark, green color
- Report button: flag icon, neutral gray, turns red on hover
- Keep all modals consistent with the existing Modal component pattern
- Mobile-first responsive design matching existing components
```

---

*Documento gerado em 2026-05-27. Proximo passo: validar com stakeholders e priorizar sub-funcionalidades para sprints.*
