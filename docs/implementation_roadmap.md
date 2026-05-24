# Roadmap de Implementação e QA Checklist - ReparAuto

Para transformar as especificações tecnológicas e de design num produto de software vivo, propõe-se um cronograma faseado de engenharia de software e validação, focado em trazer retorno o mais rapidamente possível ao mesmo tempo que mantém a excelência.

---

## 1. Roadmap Faseado

### Fase 1: MVP (Minimum Viable Product) - Mês 1 a 2
O objetivo é provar o modelo de negócio base (venda de viaturas low-cost e registo simples) através de um protótipo hiper-otimizado.
- **Tech Stack Inicial:**
  - **Frontend:** Next.js ou Vite/React + Tailwind CSS.
  - **Backend/Base de Dados:** Firebase Cloud Firestore (NoSQL, realtime e altamente escalável para os classificados iniciais).
  - **Autenticação:** Firebase Auth (Email/Google).
  - **Hospedagem (Hosting):** Vercel (Next.js) ou Firebase Hosting (Single Page App).
- **Features Chave:**
  - Registo de Utilizador e Área de Perfil simples.
  - Publicação de Anúncio em 3 passos com upload de fotos (Firebase Storage) e dados técnicos detalhados (marca, modelo, anos, combustível, câmbio, portas, cor, preço).
  - Filtros principais (Low-cost, Preço, Km, Combustível) e a secção clara de "Estado do veículo" (Pronto vs Precisa de reparação).
  - Detalhe do Carro e botão para envio direto de mensagem de interesse ao WhatsApp do vendedor.

### Fase 2: Versão 1.0 (Comunidade & Histórico) - Mês 3 a 4
Expansão das funcionalidades do lado de classificados e segurança.
- **Features Chave:**
  - Sistema de Contas Especiais: "Vendedor Profissional / Stand" (com validação de empresa e onboarding manual do lado do Admin).
  - Relatório de Manutenção e Orçamentos: Integração de orçamentos e relatórios mecânicos detalhados diretamente nos anúncios de veículos com avarias, permitindo total transparência.
  - Chat Interno Seguro: Substituir o WhatsApp por um sistema de chat In-App para reter o tráfego na plataforma, protegendo dados e contactos pessoais dos utilizadores.
  - Alertas de Preço e Pesquisa Guardada: Notificar utilizadores quando um veículo com certas especificações é publicado.

### Fase 3: Escala & IA - Mês 5 a 6+
Foco em automatização, conversão massiva e inteligência de dados.
- **Features Chave:**
  - Integração de CMP Robusto (Cookiebot / OneTrust).
  - Notificações Push e Emails automatizados de novidades na plataforma.
  - IA: Classificador visual de danos (ao subir a foto, a inteligência artificial analisa e ajuda a sugerir áreas que precisam de manutenção).
  - Monetização: Funcionalidade "Destacar Anúncio" via Stripe (pagamento seguro).

---

## 2. Checklist de Aceitação e Garantia de Qualidade (QA)

Antes de lançar a plataforma para o público geral (Go-Live da Versão 1.0), a equipa deve validar rigorosamente os seguintes critérios para assegurar o estatuto "World-Class".

### Usabilidade e Funcionalidade
- [ ] **Tempo de Publicação:** Um utilizador consegue concluir o registo de um novo carro em menos de **30 segundos** ou 3 passos visuais (sem contar com o upload de imagens pesadas).
- [ ] **Formulários à prova de erro:** Campos numéricos (Preço, Km) bloqueiam letras; uploads limitam tamanho máximo por ficheiro (ex: 5MB) com redimensionamento nativo no frontend antes do envio ao servidor.
- [ ] **Filtros Resilientes:** Ao cruzar 3 ou mais filtros nulos (ex: "Peugeot" + "Até 100€" + "Lisboa"), a UI não parte, mostrando de forma simpática um ecrã "Zero Resultados (Empty State)" com recomendações.
- [ ] **Estado do Veículo:** Validar se a seleção de "Precisa de manutenção/reparos" expande corretamente a checklist de áreas afetadas e os campos opcionais de orçamento e contacto de mecânico.

### Acessibilidade (a11y)
- [ ] Navegação integral por tecla `TAB` verificada. Os modais (ex: Galeria de Fotos, Modais de Login e Políticas) implementam *Focus Trap* (o utilizador não consegue focar os elementos por trás do modal).
- [ ] Todas as imagens vitais possuem atributos `alt` preenchidos (seja por IA ao analisar a foto do carro, ou texto padrão descritivo).
- [ ] *Contrast Checker* validado em todas as paletas e fundos com ferramentas automatizadas (Axe DevTools).

### Performance e SEO Técnico
- [ ] Google Lighthouse (Mobile) consistentemente aponta Nota > 95 em Performance e > 95 em Best Practices.
- [ ] Meta Tags e Tags Open Graph/Twitter Cards preenchidas de forma dinâmica por viatura. Ao colar o link de um anúncio no WhatsApp ou Facebook, tem de surgir o Título Correto, Preço, e Fotografia do Carro.
- [ ] Validação JSON-LD via Google Schema Validator Tools: Sem erros nas entidades `Vehicle` (Carro) e `Review`.

### Segurança
- [ ] Ferramenta de scan de vulnerabilidades (ex: OWASP ZAP) executa sem falhas graves/críticas.
- [ ] CORS (Cross-Origin Resource Sharing) rigorosamente fechado no Backend para aceitar apenas os domínios do ReparAuto.
- [ ] Banner de Consentimento bloqueia estritamente scripts (Google Analytics / Pixel Meta) até à interação do botão "Aceitar".
