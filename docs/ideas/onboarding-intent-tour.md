# Tour de Onboarding — Roteador de Intenção

> One-pager gerado com a skill `idea-refine`. O plano de implementação detalhado
> vive em `docs/plans/18-onboarding-intent-tour.md`.

## Problema (How Might We)

Como transformar o primeiro acesso num **roteador de intenção** que, em segundos,
leva cada visitante direto à ação que veio fazer — comprar, vender carro/peça ou
oferecer serviços de oficina — **sem parecer um tutorial cansativo**, e usando
essa escolha como gatilho para a **criação de conta**?

## Direção Recomendada

Em vez de um walkthrough passivo ("olhe estas funcionalidades"), o primeiro
acesso de um visitante **anónimo** mostra uma tela de boas-vindas com a pergunta
*"O que o traz aqui hoje?"* e quatro portas:

1. **Vender o meu carro** → `/anunciar?tipo=carro`
2. **Vender peças** → `/anunciar?tipo=peca`
3. **Tenho uma oficina** → `/oficinas/registar`
4. **Quero comprar** → `/comprar` (criar Intenção de Compra)

Escolher uma porta abre o **cadastro contextual** ("Crie a sua conta para
anunciar o seu carro") — a conversão de conta acontece *com um objetivo na mão*,
não como um formulário burocrático. Depois do cadastro (+ perfil mínimo), o
utilizador cai **direto no fluxo de criação certo**. Há sempre uma saída de baixo
compromisso: **"Só quero ver os anúncios"**.

A porta **"Quero comprar"** é a estrela: a **Intenção de Compra** (o comprador
diz o que procura e os vendedores vêm até ele) é o maior diferencial vs.
OLX/Standvirtual, então o roteador de intenção e o showcase do diferencial são a
*mesma tela*.

## Suposições a Validar

- [ ] **Critério de sucesso = criação de conta nova.** Medir a taxa de
  `welcome → conta criada` (a tela só faz sentido se converte). Testar via
  Analytics nos eventos de seleção de intenção e signup.
- [ ] **Anónimo-primeiro converte mais que pós-login.** A tela tem de aparecer
  *antes* da conta existir — caso contrário não há o que converter.
- [ ] **Quatro portas não paralisam.** Se a taxa de "Só quero ver" for alta
  demais, reduzir/reordenar opções (lente de liquidez: destacar a oferta).

## Escopo do MVP

**Dentro:** tela de boas-vindas full-screen (4 portas + escape), persistência
"visto uma vez" e "intenção pendente" em localStorage, cadastro contextual
(modo "registar" + linha de contexto no modal), retoma da intenção após o
desvio obrigatório por `/setup-perfil`, deep-link `?tipo` em `/anunciar`,
e alinhamento do escape-hatch (favoritar/contactar anónimo → mesmo cadastro
contextual).

**Fora (fast-follows):** personalização por contexto de entrada (reordenar
portas se a pessoa chegou por um anúncio), prova social / lente de liquidez,
e re-execução da tour a partir de um botão de ajuda.

## O Que NÃO Vamos Fazer (e porquê)

- **Tour gamificada de N passos / mascote / barra de progresso** — é exatamente
  o "cansativo e enfadonho" que se quer evitar.
- **Mostrar a tour a utilizadores já autenticados** — o objetivo é criar conta;
  quem já tem conta não é o público.
- **Biblioteca externa de tour (Shepherd/Joyride/driver.js)** — desnecessário;
  o overlay é construído com os tokens e componentes existentes.

## Perguntas em Aberto

- Vale medir A/B entre 4 portas vs. 3 (juntando carro+peça em "Vender")?
- O escape "Só quero ver" deve levar a `/comprar` (vitrine) ou ficar na home?
  (MVP: fica na home — a home já é o feed de anúncios.)
