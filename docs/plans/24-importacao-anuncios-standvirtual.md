# Plano: Importação de Anúncios do Standvirtual para Perfis Profissionais

**Prioridade:** ALTA | **Estimativa Total:** ~12-18 dias de desenvolvimento (MVP em ~5-7 dias)

> Este documento é o resultado de uma investigação (não de implementação). Reúne a análise técnica, legal, competitiva e de UX necessária para decidir *como* construir a funcionalidade "importar os meus anúncios do Standvirtual" para stands/revendedores no RecarGarage. A implementação só deve começar depois de validadas as decisões da secção 9 (Decisões em aberto) e de obtidas as credenciais de API (secção 3).

---

## 1. Visão Geral

### O Que Resolve

O maior atrito para atrair stands profissionais para uma plataforma nova não é o preço — é o **custo de migração**. Um stand com 30-80 viaturas já as tem publicadas no Standvirtual (o portal dominante em Portugal), com fotos tratadas, descrições escritas e ficha técnica preenchida. Pedir-lhe que volte a preencher tudo, viatura a viatura, no formulário do RecarGarage (`app/anunciar`, fluxo de 4 passos) é a barreira que faz o stand desistir antes de experimentar.

A funcionalidade proposta elimina esse atrito: o profissional liga a sua conta Standvirtual (ou cola o URL do seu stand/anúncio), o RecarGarage lê os anúncios que são **dele**, mapeia-os para o schema `Carro` e cria rascunhos prontos a rever e publicar. É o mesmo movimento que os *crosslisters* (Vendoo, Crosslist) e os agregadores de stands portugueses (Auto Connect) já provaram funcionar.

O campo `tipoConta: 'particular' | 'profissional'` já existe em `src/types/usuario.ts` — esta funcionalidade é uma ferramenta **exclusiva de contas profissionais**, alinhada com o plano 07 (Ferramentas Profissionais) e a monetização B2B do plano 17.

### Porque é ALTA prioridade

- **Aquisição de oferta (supply side).** Num marketplace de classificados, a oferta puxa a procura. Importar o inventário de um único stand médio adiciona 30-80 anúncios de qualidade num clique — o inverso de crescer anúncio a anúncio.
- **Diferenciador imediato.** Nenhum portal concorrente português oferece "importa os teus anúncios do Standvirtual" como funcionalidade self-serve nativa; só uma ferramenta de gestão de stands (Auto Connect) o faz, e como plugin de onboarding pago.
- **Baixo risco técnico.** Existe uma API oficial e documentada (secção 3) que devolve exatamente os dados de que precisamos. Não é um projeto de scraping frágil.

### Historias de Utilizador

1. **Como stand**, quero ligar a minha conta Standvirtual uma vez e ver a lista dos meus anúncios, para escolher quais importar sem os reescrever.
2. **Como stand**, quero que a importação preencha marca, modelo, ano, km, combustível, caixa, potência, cor, preço, descrição e fotos automaticamente, para só ter de rever e publicar.
3. **Como stand**, quero importar em lote (todos de uma vez) com uma barra de progresso e ver que anúncios foram criados e quais falharam, para não perder tempo.
4. **Como stand com um único carro**, quero colar o URL de um anúncio do Standvirtual e ver o formulário `anunciar` pré-preenchido, para publicar em segundos.
5. **Como stand**, quero que os anúncios importados fiquem como **rascunho/pendente** (nunca publicados automaticamente noutro sítio), para manter o controlo do que fica visível e não gastar créditos em lado nenhum.
6. **Como administrador do RecarGarage**, quero que os anúncios importados passem pela mesma fila de aprovação (`status: 'pendente'`) e tragam um marcador de origem ("Importado do Standvirtual"), para moderação e rastreabilidade.

---

## 2. Benchmark Competitivo (resultado da investigação)

### 2.1 O portal de origem — Standvirtual (Grupo OLX / FixeAds)

- **Planos profissionais** cobrados **por anúncio por ciclo de 15 dias**: Start €19.99, Standard €23.49, Advanced €32.49, Expert €44.99. O tier Expert inclui **exportação automática para o OLX.pt** ("Partilha no OLX") — o cross-posting entre as duas propriedades do Grupo OLX é o caminho oficial de saída de dados.
- O próprio Standvirtual já faz **pré-preenchimento por identificador**: introduzir **matrícula ou VIN** gera os detalhes do anúncio via IA, e há um "AI Seller Agent" anunciado para **criação em massa de anúncios** para profissionais. Sinal de que o pré-preenchimento por identificador é um padrão validado no próprio mercado.

### 2.2 Precedente direto em Portugal

- **Auto Connect (autoconnect.pt)** — ferramenta de gestão de stands (publica para Standvirtual, OLX, AutoSapo, PiscaPisca, CustoJusto, HelloCar, Facebook). Anuncia explicitamente: *"temos plugins de importação para todas as plataformas e, se tiver as viaturas no Standvirtual, importamos diretamente dessa plataforma"*. Desde ~€0.65/dia. **É a prova de conceito mais próxima do que queremos construir.**
- **MyStand, 4Stand, OfficeGest "Stand Auto", INOVEONLINE, BETACODE** — o ecossistema português é *hub-and-spoke*: a ferramenta empurra o stock para os portais via API, com o Standvirtual como hub pago. Nenhuma (exceto Auto Connect) oferece importação *a partir de* concorrentes como funcionalidade de consumidor.
- **CustoJusto PRO / MotorJusto** — integra o mesmo ecossistema de integradores ("mais de 20 parceiros que exportam anúncios com um clique"), não importa de rivais.

### 2.3 Brasil (mercado de lançamento — plano 20)

- **OLX Brasil** tem a **Autoupload API** pública (`developers.olx.com.br`): JSON via `PUT /autoupload/import`, OAuth2, insert/edit/delete por `id` do cliente, **imagens obrigatórias (máx. 20, a primeira é a principal)**, códigos de estado por anúncio. Restrita a planos empresa.
- **Webmotors** (Cockpit + APIs Sensedia "Estoque Site"/"Gestor de Estoque Terceiro"), **Mercado Livre Veículos** (APIs de publicação + pacotes), **iCarros/Mobiauto** (via integradores; Mobiauto tem o MobiGestor).
- Ecossistema de integradores muito maduro: **Revenda Mais, Altimus, AutoConf, Boom Sistemas, Auto Adm, Integrador de Anúncios** — a lógica que os stands brasileiros conhecem é *ligar o meu gestor de stock*, não *raspar a minha página da Webmotors*.

### 2.4 Formatos de feed padrão (outros mercados, para inspiração)

- **mobile.de CSV Upload** — CSV com `;`, ISO-8859-15, **212 campos em ordem estrita**, nomes de imagem `[imageID]_01.jpg`, reenvio do dataset completo para alterar fotos. **Aresta perigosa: um CSV vazio apaga todo o inventário.**
- **AutoScout24 Listing Creation API** — REST/JSON, Basic Auth, endpoints de taxonomia para marca/modelo.
- **Facebook/Meta** — descontinuou os anúncios grátis de viaturas no Marketplace (2023-01-30) e empurrou para os Automotive Inventory Ads pagos com feed CSV/TSV/XML. **Aviso: canais de importação/agregação grátis acabam monetizados ou fechados.**
- **CarGurus** — aceita CSV/TSV/XML por FTP com **nomes de coluna flexíveis** e uma equipa humana de mapeamento. Ingestão tolerante + onboarding assistido é o padrão dos EUA.

### 2.5 Padrões de UX de importação (por ordem de "provado")

1. **Ligar conta → detetar → selecionar → importar em lote** com barra de progresso e estado por item (Vendoo "Bulk Importer"; channel managers de alojamento como OwnerRez/Guesty). Inclui frequentemente um **modo só-leitura / dry-run** para experimentar sem risco.
2. **Marketplace que endossa importação de rivais** — a Whatnot documenta importar do eBay/Poshmark via Vendoo. Baixar o custo de mudança é estratégia, não vergonha.
3. **Colar um URL → prefill de um anúncio** (Crosslist "cola o URL"). Em automóvel, o primitivo mais forte é o **lookup por matrícula/VIN**.
4. **Sincronização agendada por feed** (FTP/HTTP CSV/XML, modo *replace* diário) — a norma profissional (Facebook AIA, CarGurus, mobile.de).

### 2.6 Sentimento dos utilizadores (o que odeiam)

- **Curva de setup** das ferramentas de crosslisting (List Perfectly) e falhas de sincronização.
- **Carros vendidos que ficam ativos dias a fio** geram leads frustrados e prejudicam a imagem do stand (dor central que os integradores BR usam como pitch).
- **Duplicação de anúncios, anúncios órfãos de stock vendido, e atingir o limite de anúncios ativos do plano** a meio da sincronização (BETACODE).

**Conclusão do benchmark:** o padrão mais provado é **ligar conta → selecionar → importar como rascunho, com progresso por item e mapeamento de erros visível**, com o *paste-URL* de um único anúncio como caminho leve complementar. Importar sempre para **rascunho/pendente**, nunca republicar em lado nenhum, e tratar a **licença das fotos** com cuidado.

---

## 3. Vias Técnicas de Importação (comparação)

Existem três vias reais. A recomendação é **construir para a API oficial (Via A)** e usar o *paste-URL* via `__NEXT_DATA__` (Via B) apenas como conveniência de baixo volume para um único anúncio. A Via C (parceria com integrador) é uma jogada de negócio paralela, não de engenharia.

### Via A — API oficial OLX Group / Standvirtual (RECOMENDADA)

Existe uma API REST de primeira parte, **documentada e ativamente mantida** (a referência `api_data.json` foi regenerada em 2026-07-03, versão 2.0.0). É a mesma base de código FixeAds/OLX do Otomoto.

| Item | Valor |
|---|---|
| Base de produção | `https://www.standvirtual.com/api/open` |
| Referência da API | `https://www.standvirtual.com/api/doc/` (dados crus em `.../api/doc/api_data.json`) |
| Guia de onboarding | Postman: `documenter.getpostman.com/view/6459062/TVRq1QzJ` |
| Hub do Grupo OLX | `https://developer.olxgroup.com/` → produto **"Motors API"** (cobre Otomoto/Autovit/Standvirtual) |
| Registo | `https://developer.olxgroup.com/register?market=motors` |
| Contacto | `api@standvirtual.com` |
| Custo | **A API é gratuita** (o utilizador final paga as taxas normais do marketplace); aprovação é discricionária |
| Pré-requisito | Conta **profissional** Standvirtual do lado do stand |

**Autenticação — OAuth2** (`POST {base}/oauth/token/`, form-encoded):

- **`password` grant** — `client_id` + `client_secret` (do RecarGarage como integrador) + `username` + `password` (do stand). Age **em nome do stand** — é exatamente o nosso caso de uso.
- **`partner` grant** — `client_id` + `client_secret` + `partner_code` + `partner_secret`. Reservado a parceiros DMS/CRM; desbloqueia o grupo `/adverts` por ID externo.
- Resposta: `access_token` (bearer), `expires_in: 43200` (12 h), `refresh_token`, `scope: "adverts-write read"`.
- **Header obrigatório** `User-Agent` (email da conta) desde 2022-08-01, senão o pedido é bloqueado.

**Endpoints de leitura (o caminho de importação), todos confirmados na doc e por probes live** (`GET /account/adverts/` devolveu `401 invalid_token` — existe, só falta token):

- `GET /account/adverts?page=&limit=` — **lista todos os anúncios do utilizador**, paginado (`results[]`, `is_last_page`, `current_page`, `total_pages`, `total_elements`).
- `GET /account/adverts/:id` — **anúncio completo**: `id`, `status` (`new`/`active`/`unpaid`/…), `title`, `url`, `created_at`, `valid_to`, `description`, `category_id`, `region_id`/`city`/`municipality`, `coordinates`, `advertiser_type: "business"`, `contact`, um objeto `params` rico (`make`, `model`, `version`, `fuel_type`, `first_registration_year`, `mileage`, `engine_capacity`, `power`, `price {value, currency}`, `gearbox_type`, `color`, `number_doors`, matrícula, dezenas de flags de equipamento) e `photos` com **URLs CDN prontas em vários tamanhos** (`1080x720`, `732x488`, `148x110` em `ireland.apollo.olxcdn.com`).
- `GET /account/adverts/:id/stats` — estatísticas de visualizações.
- `GET /imageCollections/:id` — coleções de imagens.
- `GET /stands/getStandsByUserId/:userId` — dados das filiais ("stands").
- **Taxonomia de catálogo:** `GET /categories`, `/categories/:id/makes`, `/models/:brand_code`, encadeando `fuel_types`, `gearboxes`, `door_counts`, `versions` — essencial para traduzir os slugs do Standvirtual para os enums do RecarGarage. Localizações: `GET /regions`, `/districts`, `/cities`.

**Veredito:** a API oficial cobre 100% do objetivo. Com o consentimento do stand (o seu username/password via `password` grant), `GET /account/adverts` + `GET /account/adverts/:id` devolvem tudo o que é preciso, fotos incluídas, pelo canal contratualmente sancionado.

### Via B — Parsing do `__NEXT_DATA__` por URL colado (conveniência, baixo volume)

O Standvirtual é Next.js server-rendered. **Cada página de anúncio traz o objeto completo em `__NEXT_DATA__`** no caminho `props.pageProps.advert` — não é preciso raspar HTML nem reverter GraphQL.

- Padrão de URL: `https://www.standvirtual.com/carros/anuncio/<slug>-ID<shortId>.html`.
- `advert.parametersDict` é o campo mais rico: `make`, `model`, `fuel_type`, `first_registration_month/year`, `mileage`, `engine_power`, `gearbox`, `transmission`, `body_type`, `color`, `door_count`, `nr_seats`, **`vin`**, `is_imported_car`, `inspection_valid_until`, e ~60 flags de equipamento.
- `advert.images.photos[]` traz URLs de fotos em resolução total; `advert.seller` traz nome, tipo, website e subdomínio do stand.
- Página de stand: `https://<slug>.standvirtual.com/inventory` embute todos os IDs de anúncio + `total` no `__NEXT_DATA__`/cache urql; paginação por offset (limite 30). Permite "colar o URL do meu stand" → enumerar tudo.

**Limitações e riscos:**
- **Telefone do vendedor tokenizado/encriptado** no blob (precisa de chamada de reveal) — irrelevante, usamos o telefone que o stand dá ao RecarGarage.
- **Anti-bot DataDome** presente (passivo em tráfego leve; agressivo em bulk). CloudFront WAF à frente. `robots.txt` proíbe `/api/`, `/ajax/`, `/rss/`.
- **ToS** restringe acesso automatizado (ver secção 4). Mantém-se por isso como conveniência **iniciada pelo utilizador, um anúncio de cada vez, baixo volume**, e o caminho canónico de lote é a Via A.
- Existem actors Apify prontos (ex.: `ecomscrape/standvirtual-cars-details-scraper`, ~$15/mês + uso) se quisermos externalizar o fetch/anti-bot — mas construir o parser de `__NEXT_DATA__` é trabalho de poucas horas.

### Via C — Parceria com integrador de stands (jogada de negócio)

Adicionar o RecarGarage como **destino de exportação** dentro do MyStand / Auto Connect / 4Stand / OfficeGest (PT) e Revenda Mais / Altimus / AutoConf (BR). Os stands já empurram stock para todo o lado a partir destas ferramentas, que já normalizam os dados. É provavelmente **a via mais rápida para stock multi-stand sem tocar em passwords de terceiros** — mas depende de acordos comerciais, não de código. Requer publicarmos um spec de ingestão simples (uma API JSON à la OLX BR autoupload + um CSV tolerante à la CarGurus).

### Tabela comparativa

| Critério | Via A — API oficial | Via B — `__NEXT_DATA__` por URL | Via C — Integrador |
|---|---|---|---|
| Legalidade / ToS | ✅ Canal sancionado | ⚠️ Tolerado em baixo volume | ✅ Via parceiro |
| Cobertura de dados | ✅ Completa + taxonomia | ✅ Completa (menos telefone) | Depende do parceiro |
| Lote (stand inteiro) | ✅ Nativo, paginado | ⚠️ Possível, sujeito a anti-bot | ✅ Nativo |
| Custódia de credenciais | ⚠️ Password do stand (grant) ou partner keys | ✅ Nenhuma | ✅ Nenhuma |
| Esforço de engenharia | Médio (OAuth + mapeamento) | Baixo (parser + mapeamento) | Baixo (só ingestão) + negócio |
| Dependência externa | Aprovação OLX (grátis, discricionária) | Anti-bot DataDome | Acordos comerciais |
| Fragilidade | Baixa (contrato + versão 2.0.0) | Média (blob pode mudar) | Baixa |

---

## 4. Considerações Legais e de Confiança

- **ToS do Standvirtual (Profissionais, Maio 2025):** proíbe acesso não autorizado a servidores/base de dados; uso comercial de parte do site requer autorização expressa; extração da base de dados só é tolerada para uma parte "não substancial" e sem "download, agregação ou processamento" (enquadramento de direito *sui generis* da Diretiva de Bases de Dados da UE). **Rever o texto integral (login em `ajuda.standvirtual.com`) antes de construir.**
- **CJEU *Ryanair v PR Aviation* (C-30/14):** mesmo quando os dados não têm proteção de copyright nem direito *sui generis*, o operador do site **pode proibir scraping por contrato (ToS)** e executá-lo como incumprimento. → O padrão certo é **iniciado pelo stand, autenticado, apenas os seus próprios anúncios, baixo volume**.
- **Direito de base de dados (96/9/CE):** importar os ~30-80 anúncios de *um* stand não é uma "parte substancial" da base do Standvirtual; raspar o catálogo inteiro é que aumenta a exposição.
- **RGPD:** o telefone do vendedor é dado pessoal. O Standvirtual tokeniza-o de propósito. **Não reconstruir o telefone tokenizado** — usar o número que o próprio stand fornece ao RecarGarage (é o titular do dado). Para o conteúdo próprio do stand (descrição, fotos), a base é limpa.
- **Direitos de imagem (o maior risco).** *CarGurus v. Trader Corp* (Ontário, 2017): copiar fotos de anúncios sem direitos gerou remoção obrigatória. As fotos têm copyright do autor independentemente de quem é dono do carro.
  - Mitigação: importar só anúncios que o stand **atesta serem seus** (checkbox de consentimento + verificação de conta), preferir originais a imagens com watermark do portal, guardar **trilho de auditoria** (URL de origem + atestação + timestamp), e oferecer "importar só os dados, voltar a carregar as fotos" como alternativa.
- **A distinção-chave (conteúdo próprio + consentimento):** um stand a importar os **seus próprios** anúncios, por sua iniciativa e autorização, é material e eticamente distinto de raspar dados de concorrentes. É este o padrão a construir — nunca oferecer "importa os anúncios do stand X".
- **Nunca republicar automaticamente.** Importar sempre para **rascunho/pendente** no RecarGarage; não tocar em nada no Standvirtual (não gastar créditos, não editar, não desativar).

---

## 5. Arquitetura Proposta (MVP → completo)

### 5.1 Onde vive o código

O fetch ao Standvirtual **tem de ser server-side** (a API OAuth e o parsing de `__NEXT_DATA__` não podem correr no browser: CORS, custódia do `client_secret`, e o `User-Agent` obrigatório). O projeto ainda não tem `app/api/` — esta funcionalidade introduz a **primeira Route Handler** do App Router.

```
app/api/import/standvirtual/
├── connect/route.ts     # POST — troca credenciais do stand por token (password grant), guarda refresh_token cifrado
├── adverts/route.ts     # GET  — lista os anúncios do stand (proxy paginado de /account/adverts)
├── advert/[id]/route.ts # GET  — devolve UM anúncio já mapeado para CarroFormData (preview)
└── import/route.ts      # POST — importa uma seleção: cria docs cars (status pendente) + copia fotos p/ Storage

src/lib/importers/
├── standvirtual.client.ts   # cliente da API oficial (OAuth, refresh, User-Agent, paginação) — server-only
├── standvirtual.nextdata.ts # Via B: fetch + extração de __NEXT_DATA__ a partir de um URL de anúncio/stand
├── standvirtual.map.ts       # mapeamento params/parametersDict → CarroInput (+ testes TDD)
└── types.ts                  # StandvirtualAdvert, ImportResult, etc.
```

- `standvirtual.map.ts` é **lógica pura e testável** → alvo TDD prioritário (ver secção 8). Sem I/O; recebe o objeto do Standvirtual, devolve `Partial<CarroFormData>` + lista de campos não mapeados.
- As Route Handlers autenticam via Firebase (o utilizador tem de ser `tipoConta === 'profissional'`) antes de qualquer fetch externo.

### 5.2 Custódia de credenciais (decisão sensível)

O `password` grant exige a password do stand no Standvirtual. **Nunca guardar a password.** Opções, por ordem de preferência:

1. **Não persistir nada além do `refresh_token` cifrado.** O stand introduz as credenciais uma vez → trocamos por `access_token` + `refresh_token` → guardamos só o `refresh_token` (cifrado com KMS/segredo do App Hosting) num doc server-only (ex.: `integrations/{uid}`), descartamos a password. Renovamos o token de 12 h com o refresh.
2. **Sessão efémera** — não guardar nada; a importação corre toda dentro de uma sessão (obtém token, importa, esquece). Mais seguro, obriga a reintroduzir credenciais a cada importação.
3. **Partner grant** (se conseguirmos `partner_code`/`partner_secret` do Grupo OLX) — evita totalmente lidar com passwords de stands. **É o alvo desejável a médio prazo**; começar com (1) ou (2) para o MVP.

Regra de ouro: os documentos de integração ficam em coleções **não legíveis por regras de cliente** (só Admin SDK server-side); acrescentar a `firestore.rules` um `match /integrations/{uid} { allow read, write: if false; }` (fecho total ao cliente).

### 5.3 Fluxo de dados (Via A, lote)

```
Stand liga conta ──▶ POST /api/import/standvirtual/connect
                     (password grant → guarda refresh_token cifrado)
        │
        ▼
GET /api/import/standvirtual/adverts  ──▶  lista anúncios (título, foto, preço, estado)
        │  stand seleciona quais importar (default: todos os "active")
        ▼
POST /api/import/standvirtual/import { ids: [...] }
        │  para cada id:
        │    GET /account/adverts/:id
        │    map params → CarroInput
        │    copiar photos[] (ireland.apollo.olxcdn.com) → Firebase Storage
        │    addCarro({ ..., status:'pendente', origem:'standvirtual', origemId, origemUrl })
        ▼
Resposta stream/polling: { criados:[...], falhados:[{id,motivo}] }  ──▶ UI com progresso por item
```

Fotos: descarregar server-side e **re-hospedar no Firebase Storage** (o CDN da OLX pode expirar/variar e queremos as imagens sob o nosso domínio para o `next/image`, cujos `remotePatterns` em `next.config.ts` só permitem `firebasestorage.googleapis.com` e Google). Alternativa MVP: guardar os URLs externos como estão (o projeto já suporta "fotos como URLs https externos" — ver `CLAUDE.md` / `FotosEditor`), mas isso obrigaria a acrescentar `ireland.apollo.olxcdn.com` aos `remotePatterns`, o que é frágil e cede controlo — **preferir re-hospedagem**.

### 5.4 Fluxo leve (Via B, um anúncio por URL)

Reaproveita o formulário existente: o stand cola o URL na página `anunciar` → `GET /api/import/standvirtual/advert/[id]?url=...` devolve `CarroFormData` → o formulário abre pré-preenchido (o `Anunciar.tsx` já suporta rascunhos/restauro via `useAdDraft`/`saveAdDraft`, portanto o pré-preenchimento encaixa no fluxo de rascunho existente). O stand revê fotos e publica. Zero credenciais.

---

## 6. Mapeamento de Campos (Standvirtual → `Carro`)

Núcleo do trabalho de engenharia. `Carro` está em `src/types/carro.ts`; os enums de UI estão em `src/screens/Anunciar.tsx` (`initialDados`) e `src/lib/constants.ts`.

| Campo RecarGarage (`Carro` / `CarroFormData`) | Origem API oficial (`params.*`) | Origem `__NEXT_DATA__` (`parametersDict.*`) | Notas de mapeamento |
|---|---|---|---|
| `marca` | `make` | `make` | Traduzir slug→label via `GET /categories/:id/makes`; casar com `src/data/marcas-modelos.json` |
| `modelo` | `model` | `model` | Idem, via `/models/:brand_code` |
| `anoFabricacao` | `first_registration_year` | `first_registration_year` | Inteiro |
| `anoModelo` | `first_registration_year`/`year` | idem | Opcional; pode não existir |
| `km` | `mileage` | `mileage` | Inteiro (remover separadores) |
| `combustivel` | `fuel_type` | `fuel_type` | **Tabela de tradução** → enum `Combustivel` (`Gasolina`/`Diesel`/`Elétrico`/`Híbrido`/…). SV usa `petrol`/`diesel`/`electric`/`hybrid`/`lpg`/`cng` |
| `cambio` | `gearbox_type` | `gearbox` | `manual`→`Manual`, `automatic`→`Automático`; CVT se aplicável |
| `cor` | `color` | `color` | Traduzir para PT |
| `portas` | `number_doors` | `door_count` | Inteiro |
| `seats` | `nr_seats` | `nr_seats` | Opcional |
| `bodyType` | `body_type` | `body_type` | Traduzir → enum `BodyType` (`SUV`/`Sedan`/`Carrinha`/…) |
| `power` | `power` | `engine_power` | cv (inteiro) |
| `displacement` | `engine_capacity` | `engine_capacity` | cm³ |
| `traction` | (se presente) | (se presente) | Mapear para `Dianteira`/`Traseira`/`Integral (4x4)` |
| `features` | flags de equipamento em `params` | `equipment[]` | Filtrar/traduzir o subconjunto que existe no RecarGarage |
| `preco` | `price.value` | `price.value` | Assumir EUR; guardar em `preco` |
| `descricao` | `description` | `description` | Texto livre; sanitizar HTML/links |
| `local` / `distrito` | `city`/`municipality`/`region_id` | localização no blob | Casar com `CONCELHOS`/distritos (`src/lib/constants.ts`) |
| `fotos` | `photos[].{1080x720}` | `images.photos[].url` | Descarregar + re-hospedar no Storage |
| `condition` | (novo? SV distingue novo/usado) | `is_imported_car`/estado | Default `Usado` |
| `vendedorTelefone`/`Email`/`WhatsApp` | do perfil RecarGarage do stand | idem | **Não** vir do Standvirtual (telefone tokenizado); usar dados do perfil |
| `status` | — | — | Forçado a `pendente` |
| `criador`/`criadorUid`/`vendedorNome` | do utilizador autenticado | idem | Do Firebase Auth/perfil |

**Novos campos em `Carro` (rastreabilidade da importação):**

```ts
// src/types/carro.ts — acrescentar (opcionais, não-breaking)
origem?: 'manual' | 'standvirtual';   // default undefined = manual
origemId?: string;                    // id do anúncio no Standvirtual
origemUrl?: string;                   // URL público de origem (auditoria)
importadoEm?: Timestamp;              // quando foi importado
```

As tabelas de tradução (`fuel_type`, `gearbox`, `color`, `body_type`, marca/modelo) vivem em `standvirtual.map.ts` como constantes, com um **fallback registado**: qualquer valor não mapeado não bloqueia a importação — o campo fica vazio e é sinalizado ao stand para preencher na revisão ("3 campos precisam da tua atenção").

---

## 7. Alterações por Camada (scope)

### Types (`src/types/`)
- `carro.ts`: acrescentar `origem`, `origemId`, `origemUrl`, `importadoEm` (opcionais).
- Novo `src/lib/importers/types.ts`: `StandvirtualAdvert`, `StandvirtualAdvertSummary`, `ImportPreview`, `ImportResult`, `ImportItemStatus`.

### Server (Route Handlers — nova superfície `app/api/`)
- `app/api/import/standvirtual/connect/route.ts`
- `app/api/import/standvirtual/adverts/route.ts`
- `app/api/import/standvirtual/advert/[id]/route.ts`
- `app/api/import/standvirtual/import/route.ts`
- Todas: guard `tipoConta === 'profissional'` + verificação de sessão Firebase (Admin SDK).

### Lib (`src/lib/`)
- `importers/standvirtual.client.ts` (OAuth + paginação + refresh).
- `importers/standvirtual.nextdata.ts` (Via B).
- `importers/standvirtual.map.ts` (**TDD** — mapeamento puro).
- `importers/photos.ts` (descarregar do CDN OLX + `uploadFileToStorage`, reutilizando `src/lib/upload.ts`).
- Reutilizar `addCarro` (`src/lib/db.ts`) — **não duplicar** a criação de anúncios.

### UI (`src/screens/` + `src/components/`)
- Nova secção no dashboard profissional (plano 07/17): **"Importar do Standvirtual"**.
- `src/components/import/StandvirtualConnect.tsx` — formulário de ligação (credenciais ou "colar URL do stand").
- `src/components/import/ImportPreviewList.tsx` — lista selecionável de anúncios com foto/título/preço/estado + checkbox de consentimento de fotos.
- `src/components/import/ImportProgress.tsx` — barra de progresso + estado por item (criado/falhou/motivo) + link para rever.
- Integração leve no `Anunciar.tsx`: campo "Colar URL do Standvirtual" no Passo 1 (Via B) que aciona o pré-preenchimento via rascunho existente.
- Usar primitivos de `src/components/ui/` (frontend-design skill); estados de loading/empty/error; badge "Importado" no `CarCard`/ficha quando `origem === 'standvirtual'`.

### Firestore Rules (`firestore.rules`)
- `match /integrations/{uid} { allow read, write: if false; }` — coleção server-only para `refresh_token` cifrado.
- Os `cars` importados seguem as regras existentes (`status: 'pendente'`, dono = `criadorUid`) — sem alterações de query pública.

### Config
- `next.config.ts`: **não** adicionar `ireland.apollo.olxcdn.com` a `remotePatterns` se re-hospedarmos as fotos (preferido). Se optarmos por URLs externos no MVP, aí sim seria necessário.
- `apphosting.yaml` / segredos: `STANDVIRTUAL_CLIENT_ID`, `STANDVIRTUAL_CLIENT_SECRET`, chave de cifra do refresh token — como **segredos** (nunca `NEXT_PUBLIC_`).

---

## 8. Sequência de Commits (TDD-first)

Seguindo o protocolo TDD do `CLAUDE.md` (red → green → refactor em fatias verticais). O mapeamento é o coração testável; a API/rede é mockada no limite.

1. **`test(import): mapeamento de fuel_type/gearbox/body_type do Standvirtual`** — testes RED em `standvirtual.map.test.ts` para as tabelas de tradução (incl. valores desconhecidos → fallback sinalizado).
2. **`feat(import): mapeador standvirtual → CarroInput`** — GREEN: `standvirtual.map.ts` com as tabelas e o cálculo de campos-não-mapeados.
3. **`test(import): parser de __NEXT_DATA__ (Via B)`** + **`feat(import): extração de advert a partir de URL`** — com uma fixture HTML real anonimizada.
4. **`feat(import): cliente OAuth da API oficial`** — `standvirtual.client.ts` (token, refresh, User-Agent, paginação); testes com `fetch` mockado.
5. **`feat(import): route handlers connect/adverts/advert`** — server-side, guard profissional. (Exceção TDD: Route Handlers/rede — verificar com `build` + manual.)
6. **`feat(import): copiar fotos do CDN para Storage`** — `importers/photos.ts`.
7. **`feat(import): route handler de importação em lote`** — cria `cars` pendentes + resultado por item.
8. **`feat(import): UI de ligação, seleção e progresso`** — componentes + secção no dashboard profissional (frontend-design).
9. **`feat(import): prefill por URL colado no formulário anunciar`** — Via B ligada ao fluxo de rascunho.
10. **`feat(import): campos de origem em Carro + badge "Importado"`** — rastreabilidade.
11. **`feat(security): regra integrations server-only + segredos`** — `firestore.rules` + doc de segredos.
12. **`docs: marcar plano 24 (importação Standvirtual) no roadmap`** — registar em `docs/plans/index.html`.

MVP mínimo entregável = commits 1-5 + 9 (paste-URL prefill de um anúncio, sem custódia de credenciais) → valor imediato com risco mínimo. Lote completo = restantes.

---

## 9. Decisões em Aberto (precisam de validação antes de construir)

1. **Credenciais de API.** Registar em `developer.olxgroup.com/register?market=motors` e/ou emailar `api@standvirtual.com` — aprovação é discricionária e pode demorar. **Bloqueia a Via A.** Enquanto não chega, a Via B (paste-URL) pode ser construída e entregue.
2. **`password` grant vs. `partner` grant.** Começar com `password` (custódia de refresh token cifrado) ou perseguir desde já o `partner_code`/`partner_secret` (sem passwords de stands)? Recomendação: MVP com sessão efémera (opção 2 da secção 5.2), migrar para partner grant.
3. **Fotos: re-hospedar no Storage vs. URLs externos.** Recomendação: re-hospedar (controlo + `next/image`), aceitando o custo de storage/banda.
4. **Revisão do texto integral dos ToS de Maio 2025** (login em `ajuda.standvirtual.com`) — validação jurídica do caminho "conteúdo próprio + consentimento" antes do lançamento.
5. **Via C (integradores).** Abordar Auto Connect/MyStand como parceria de exportação é uma decisão de negócio paralela — fora do âmbito de engenharia deste plano, mas registada como a via mais escalável para stock multi-stand.

---

## 10. Casos de Borda

- **Anúncio já importado** (mesmo `origemId`): não duplicar — detetar e oferecer "atualizar" ou saltar (dor #1 dos integradores: anúncios duplicados).
- **Stand com >30 viaturas:** paginação por offset (Via B) / `page`+`limit` (Via A). Testar `is_last_page`/`total_pages`.
- **Valor não mapeável** (marca/combustível/cor desconhecidos): não bloquear — importar com o campo vazio e sinalizar ("precisa de revisão").
- **Foto que falha download** (CDN 404/expira): importar o anúncio na mesma, marcar as fotos em falta, permitir re-upload manual.
- **Token expirado a meio do lote:** refrescar transparentemente (refresh_token) e continuar; se o refresh falhar, parar com estado parcial claro.
- **DataDome desafia (Via B):** degradar graciosamente — mensagem "não foi possível ler agora, tenta mais tarde ou liga a tua conta" (empurra para a Via A).
- **Carro já vendido no Standvirtual** (`status !== 'active'`): por defeito importar só `active`; permitir opt-in para os restantes.
- **Preço "sob consulta"/ausente:** validar; se não houver preço, o anúncio fica pendente com aviso.
- **Descrição com telefones/links/watermark textual:** sanitizar (remover contactos externos que violem as regras do RecarGarage).
- **Stand não-profissional a tentar aceder:** bloquear na Route Handler (guard `tipoConta`).
- **Fotos com watermark do portal:** preferir originais; oferecer "importar só dados".

---

## 11. Passos de Verificação

- `npm test` — cobertura TDD do `standvirtual.map.ts` (tabelas de tradução, fallback de não-mapeados) e do parser de `__NEXT_DATA__`.
- `npx tsc --noEmit` — tipos estritos (novos campos `Carro`, tipos de importação).
- `npm run build` — Route Handlers `app/api/` compilam e não quebram o build ISR/SSR existente.
- Manual (com credenciais de sandbox/produção aprovadas):
  1. Ligar conta profissional → ver lista de anúncios.
  2. Importar 1 anúncio → confirmar `car` criado com `status: 'pendente'`, `origem: 'standvirtual'`, fotos no Storage, campos corretos.
  3. Importar em lote → barra de progresso, estado por item, sem duplicados numa 2.ª tentativa.
  4. Via B: colar URL → formulário `anunciar` pré-preenchido → publicar.
  5. Confirmar que nada foi alterado do lado do Standvirtual.
  6. Regras: confirmar que `integrations/{uid}` é ilegível pelo cliente.

---

## 12. Avaliação Final

- **Valor:** MUITO ALTO — ataca diretamente o custo de migração, o maior travão à aquisição de stands.
- **Diferenciação:** ALTA — funcionalidade self-serve inédita entre os portais PT.
- **Risco técnico:** BAIXO-MÉDIO — existe API oficial documentada e mantida; a Via B é um fallback simples.
- **Risco legal:** MÉDIO, mitigável — conteúdo próprio + consentimento + baixo volume + canal oficial; requer revisão dos ToS e cuidado com direitos de imagem.
- **Dependência externa:** aprovação de credenciais do Grupo OLX (grátis, discricionária) — o único bloqueador de calendário, contornável começando pela Via B.

**Recomendação:** avançar em duas ondas — **Onda 1 (MVP, ~5-7 dias):** paste-URL prefill de um anúncio (Via B) + campos de origem, sem custódia de credenciais, valor imediato. **Onda 2 (~7-11 dias):** ligação de conta + importação em lote via API oficial (Via A), assim que as credenciais forem aprovadas. Explorar a Via C (parceria com integradores) em paralelo, como jogada de negócio para stock multi-stand.
