# Arquitetura Tecnológica e Segurança - ReparAuto

Para garantir que a ReparAuto está ao nível de plataformas líderes globais (como Bring a Trailer, AutoScout24), a nossa stack tecnológica e de segurança é projetada em torno de princípios de *Zero Trust*, proteção *Privacy by Design* e conformidade europeia.

---

## 1. Stack Tecnológica e Segurança Perimetral

### 1.1 Protocolos Seguros
- **HTTPS e HSTS Estrito:** Todo o tráfego da plataforma, sem exceção, é servido via TLS 1.3 (encriptação em trânsito) e forçado utilizando *HTTP Strict Transport Security (HSTS)* com a diretiva `includeSubDomains` e `preload`.

### 1.2 Proteção Contra Vulnerabilidades Web (OWASP Top 10)
- **SQL Injection (SQLi):** Uso de ORM (Object-Relational Mapping) parametrizado nativo para todas as queries de base de dados, prevenindo qualquer execução de SQL arbitrária (ex: Prisma, TypeORM, ou Firestore SDK).
- **Cross-Site Scripting (XSS):** Validação e sanitização de todos os inputs do lado do servidor (ex: bibliotecas como DOMPurify) e uso estrito de *Content Security Policy (CSP)* moderna. Os componentes visuais (React/Vue/Vanilla HTML) escapam por padrão a renderização de texto.
- **Cross-Site Request Forgery (CSRF):** Todos os formulários e mutações de estado exigem Tokens Anti-CSRF (sincronizados com cookies `SameSite=Strict` ou `Lax`).
- **Clickjacking:** Implementação dos headers HTTP `X-Frame-Options: DENY` e `Content-Security-Policy: frame-ancestors 'none'`.

### 1.3 Limitação de Tráfego e Bots (Rate Limiting)
- Implementação de Rate Limiting por IP e por conta de utilizador nas APIs críticas (ex: login, criação de anúncios, envio de mensagens) para impedir *Brute Force* e *Scraping* abusivo (ex: máximo de 5 tentativas de login a cada 15 minutos).

---

## 2. Autenticação e Autorização (IAM)

A gestão de identidades é projetada para ser sem fricção (aumentando a conversão) e altamente segura.

### 2.1 Autenticação Moderna e Segura
- **OAuth 2.0 / OIDC:** Integração com *Google Sign-In* e *Sign in with Apple* para criação rápida de contas, aproveitando a segurança robusta destas plataformas.
- **Autenticação Sem Palavra-passe (Passwordless):** Eliminação de problemas de passwords fracas através do uso de *Magic Links* enviados por email ou códigos OTP (One-Time Password) via SMS para utilizadores mobile-first.

### 2.2 Gestão de Sessão (JWT & Tokens)
- **Role-Based Access Control (RBAC):** Os perfis são divididos de forma estrita em: `comprador_anonimo`, `utilizador_registado` (anunciante particular) e `vendedor_profissional` (stands de automóveis). As APIs avaliam o "role" presente no token antes da execução de *endpoints*.
- **Arquitetura JWT:** Utilização de *Access Tokens* (JWT) de curta duração (ex: 15 minutos) armazenados apenas em memória do lado do cliente (ou numa variável segura) e *Refresh Tokens* opacos com rotação ativada (Rotation) armazenados num cookie `HttpOnly`, `Secure` e `SameSite=Strict`.

---

## 3. Privacidade e Proteção de Dados (Privacy by Design)

### 3.1 Conformidade Técnica com o RGPD
- **Minimização de Dados:** O sistema apenas pede o contacto do vendedor para os compradores interessados de acordo com as escolhas de privacidade do anunciante.
- **Localização Limitada:** Para proteger o utilizador, o sistema backend armazena apenas a informação do Concelho para efeitos de localização da viatura, nunca coordenadas GPS exatas de residência.
- **Eliminação Automática (Data Lifecycle):** Jobs agendados executam a purga irrevogável de anúncios eliminados e mensagens após 30 dias (Soft Delete -> Hard Delete).

### 3.2 Criptografia de Dados Sensíveis
- **Em Repouso:** Os discos da base de dados e backups utilizam encriptação AES-256 no nível do bloco de armazenamento (fornecido por default por *Cloud Providers* como AWS KMS ou Google Cloud KMS).
- **Dados Pessoais Sensíveis:** Em caso de necessidade de guardar documentos de identificação comercial (para Vendedores Profissionais / Stands), os ficheiros serão encriptados de ponta-a-ponta na aplicação (*Application-Layer Encryption*) antes de serem guardados no Storage.

---

## 4. Conformidade Regulatória (NIS2 & Gestão de Consentimento)

### 4.1 Conformidade com a Diretiva NIS2 (Cibersegurança)
Embora a NIS2 afete primeiramente infraestruturas críticas e grandes empresas, as melhores práticas são seguidas:
- Monitorização de segurança contínua (SIEM/Logs de acesso).
- Plano estabelecido de notificação de incidentes à CNCS (Centro Nacional de Cibersegurança) e aos titulares dos dados em menos de 24h caso seja detetada uma quebra de dados pessoais.

### 4.2 Plataforma de Gestão de Consentimento (CMP)
- **Integração IAB TCF 2.2:** Para garantir total legalidade em publicidade e cookies, a ReparAuto integrará uma solução SaaS leve, robusta e certificada pela IAB.
- **Recomendação:** **Cookiebot** ou **Ketch** (versão base). O SDK injetado bloqueará todos os scripts de rastreamento (como Google Analytics) *antes* do consentimento explícito, garantindo a configuração *Privacy by Default*.
