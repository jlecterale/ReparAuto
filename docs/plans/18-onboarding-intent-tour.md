# Plano 18 — Tour de Onboarding (Roteador de Intenção)

**Estado:** ✅ Implementado · **Prioridade:** ALTA · **Esforço:** ~1-2 dias · **Valor:** Muito Alto · **Quadrante:** Quick Win

> Nota: o dashboard `docs/plans/index.html` está congelado no plano 12 (os planos
> 13-17 também só existem como `.md`). Este plano segue esse precedente e não
> altera o JS do dashboard.

## O Que Resolve

A ReparAuto não tinha **nenhum** onboarding: o visitante caía na home e tinha de
descobrir sozinho o que a plataforma faz e o que a diferencia. O fluxo era
puramente transacional (entrar → completar perfil → navegar), e nada empurrava o
visitante anónimo para o passo que realmente importa para um marketplace de dois
lados: **criar uma conta** e gerar oferta/procura.

Este plano adiciona um **roteador de intenção anónimo-primeiro**: uma tela de
boas-vindas que pergunta *"O que o traz aqui hoje?"* e encaminha cada pessoa
diretamente para a ação que veio fazer, usando essa escolha como gatilho de
cadastro. O **critério de sucesso é a criação de conta nova**.

## Benchmark Competitivo

| Plataforma | Onboarding por intenção | Cadastro contextual | Procura inversa (comprador posta o que quer) |
|---|---|---|---|
| OLX Portugal / Brasil | Não — cai no feed | Não | Não |
| Standvirtual | Não | Não | Não |
| Webmotors / iCarros | Parcial (filtros) | Não | Não |
| **ReparAuto (este plano)** | **Sim (4 portas)** | **Sim** | **Sim (Intenção de Compra)** |

A grande maioria dos concorrentes deixa o visitante num feed e só pede conta
quando ele tenta agir. A ReparAuto inverte: pergunta a intenção primeiro e
transforma o cadastro num passo *com objetivo*. A porta "Quero comprar" expõe a
**Intenção de Compra** — recurso que os clássicos não têm — logo no primeiro
contacto.

## Histórias de Utilizador

1. **Como visitante que quer vender**, vejo "Vender o meu carro" no primeiro
   acesso, crio conta com esse objetivo e caio direto no formulário de anúncio.
2. **Como visitante que quer comprar**, escolho "Quero comprar" e descubro que
   posso dizer o que procuro e deixar os vendedores virem até mim.
3. **Como mecânico**, vejo "Tenho uma oficina" e vou direto ao registo da oficina.
4. **Como visitante indeciso**, clico em "Só quero ver os anúncios" e navego sem
   fricção — e, se mais tarde tentar favoritar/contactar, recebo o mesmo convite
   contextual para criar conta.

## Escopo

### Tipos (`src/types/app.ts`)
- `OpenLoginOptions { modoInicial?: 'login' | 'registar'; contexto?: string }`.
- `LoginModalContextValue.openLoginModal` passa a aceitar `options`.

### Novos ficheiros
- `src/lib/onboarding.ts` — persistência em localStorage: `hasSeenOnboarding` /
  `markOnboardingSeen` (mostrar uma vez) e `getPendingIntent` / `setPendingIntent`
  / `clearPendingIntent` (retomar a intenção após o cadastro; TTL de 24 h).
- `src/components/onboarding/OnboardingTour.tsx` — tela full-screen com as 4
  portas (ícone + microcópia do diferencial) e o escape "Só quero ver".

### UI / wiring
- `AppProvider` — guarda `loginOptions`; efeito de **retoma**: quando
  `isLoggedIn && profileCompleted`, encaminha para a intenção pendente e limpa-a;
  o convite de favoritos anónimos passa a abrir o modal em modo "registar" com
  contexto.
- `LoginModal` — props `modoInicial` + `contexto` (banner no topo); sincroniza a
  aba ao abrir.
- `SetupPerfil` — adia a navegação para `/perfil` quando há intenção pendente
  (a retoma no `AppProvider` assume o encaminhamento).
- `Anunciar` + `app/anunciar/page.tsx` — lê `?tipo=carro|peca` (via
  `useSearchParams`, dentro de `<Suspense>`) para saltar o passo de categoria.
- `LayoutShell` — monta a tour e dispara o gatilho (anónimo + 1ª visita à home,
  sempre pulável, uma vez por visitante).

### Regras Firestore
- Nenhuma alteração. A feature é 100% client-side + reaproveita os fluxos de
  cadastro/criação existentes (que já têm as suas regras).

## Sequência de Commits

1. `feat: add onboarding intent-router welcome tour` — `onboarding.ts`,
   `OnboardingTour.tsx`, wiring (`AppProvider`, `LoginModal`, `SetupPerfil`,
   `Anunciar`, `app/anunciar/page.tsx`, `LayoutShell`, `types/app.ts`).
2. `docs: add plan 18 (onboarding intent tour)` — este documento + one-pager.

## Casos Extremos

- **Conta nova é forçada a `/setup-perfil`** antes de criar o anúncio: a intenção
  fica guardada e é retomada quando `profileCompleted` vira `true` (efeito de
  retoma no `AppProvider`). Ordem de efeitos (filho antes do pai) garante que o
  `SetupPerfil` cede a navegação ao `AppProvider`.
- **Conta existente** que faz login pela tela: a retoma dispara logo após o login
  (perfil já completo).
- **Intenção abandonada**: expira em 24 h, evitando sequestrar um cadastro futuro
  não relacionado.
- **localStorage indisponível** (privado/bloqueado): tudo em `try/catch`; na pior
  hipótese a tour reaparece ou não persiste — nunca quebra.
- **Reduced motion / acessibilidade**: `role="dialog"`, `aria-modal`, foco ao
  abrir, `Esc` fecha, scroll do body bloqueado (paridade com `Modal`).
- **Rotas admin**: nunca recebem a tour (gatilho exclui `isAdminRoute`).

## Verificação

- `npx tsc --noEmit` → sem erros.
- `npm run build` → sucesso; `/anunciar` permanece estático (a fronteira
  `<Suspense>` evita o deopt do `useSearchParams`).
- Manual: visitante anónimo na home vê a tela após ~600 ms; cada porta abre o
  cadastro contextual; após criar conta + perfil, cai no fluxo certo; "Só quero
  ver" fecha e não reaparece; favoritar anónimo mostra o convite contextual.
