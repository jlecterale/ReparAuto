// ============ CONSTANTES REPARAUTO ============

// Limites
export const MAX_FOTOS_CARRO = 6;
export const MAX_FOTO_SIZE_MB = 2;
export const MAX_FOTO_SIZE_BYTES = MAX_FOTO_SIZE_MB * 1024 * 1024;
export const DB_VERSION = '2.2';
export const DB_VERSION_KEY = 'reparauto_db_version';
export const STORAGE_KEY_CARROS = 'carros_reparauto';
export const STORAGE_KEY_PECAS = 'pecas_reparauto';
export const STORAGE_KEY_FAVORITOS = 'favs_reparauto';
export const STORAGE_KEY_USER = 'loggedUser_reparauto';

// Listas
export const CONCELHOS = ['Braga', 'Porto', 'Lisboa', 'Coimbra', 'Faro', 'Leiria'];

export const TIPOS_COMBUSTIVEL = [
  'Gasolina', 'Etanol', 'Flex', 'Diesel', 'Elétrico', 'Híbrido',
];

export const TIPOS_CAMBIO = ['Manual', 'Automático', 'CVT'];

export const CATEGORIAS_PECAS = [
  'Motor e Transmissão',
  'Carroçaria e Chaparia',
  'Iluminação e Óticas',
  'Interior e Bancos',
  'Suspensão e Travões',
  'Eletrónica e Sensores',
  'Carro Completo p/ Desmonte',
  'Outros',
];

export const ESTADOS_PECA = [
  'Usado (Segunda Mão)',
  'Novo (Em caixa)',
  'Reconstruído / Recondicionado',
  'Indiferente (Procura)',
];

export const TIPOS_MANUTENCAO = [
  'Mecânica',
  'Elétrica',
  'Eletrônica',
  'Pintura e funilaria',
  'Lataria / amassados',
  'Estofamento / interno',
  'Ar-condicionado',
  'Outro',
];

export const EMOJIS_CARRO = ['🚗', '🚙', '🚐', '🚘', '🏎️', '🚜', '🏍️', '🛞', '⚙️', '🧰'];

export const MOTIVOS_DENUNCIA = [
  { value: 'fraude' as const, label: 'Fraude / Burla' },
  { value: 'informacao_falsa' as const, label: 'Informação falsa ou enganosa' },
  { value: 'conteudo_ofensivo' as const, label: 'Conteúdo ofensivo ou inadequado' },
  { value: 'spam' as const, label: 'Spam ou publicidade indevida' },
  { value: 'veiculo_roubado' as const, label: 'Veículo / Peça roubado(a)' },
  { value: 'outro' as const, label: 'Outro motivo' },
];

export const BADGES_CONFIANCA = [
  { key: 'verificado', label: 'Verificado', icon: 'fa-solid fa-circle-check', cor: 'text-blue-500' },
  { key: 'profissional', label: 'Profissional', icon: 'fa-solid fa-store', cor: 'text-purple-500' },
  { key: 'top_vendedor', label: 'Top Vendedor', icon: 'fa-solid fa-star', cor: 'text-yellow-500' },
  { key: 'respostas_rapidas', label: 'Respostas Rápidas', icon: 'fa-solid fa-bolt', cor: 'text-green-500' },
];

// ============ TEXTOS DAS POLÍTICAS ============
export const TEXTOS_POLITICAS = {
  termos: {
    titulo: 'Termos de Utilização - ReparAuto',
    corpo: `
      <p class='font-bold text-slate-800 mb-2'>1. Identificação do Responsável</p>
      <p class='mb-4'>A ReparAuto é uma plataforma online de marketplace para anúncios de veículos e peças automóveis, operada a título individual. Para qualquer comunicação relacionada com os presentes Termos, incluindo questões ao abrigo do Regulamento (UE) 2022/2065 (Digital Services Act), o ponto de contacto é o email: <strong>reparauto.contacto@gmail.com</strong>.</p>

      <p class='font-bold text-slate-800 mb-2'>2. Objeto e Natureza do Serviço</p>
      <p class='mb-4'>A ReparAuto é um marketplace que atua exclusivamente como intermediário tecnológico. Disponibilizamos uma plataforma online para que Vendedores e Compradores possam interagir com vista à compra e venda de veículos e peças automóveis em território português. A ReparAuto não é proprietária dos itens anunciados, não intervém nas negociações nem nas transações celebradas entre as partes, e não assume qualquer responsabilidade pela qualidade, segurança ou legalidade dos itens anunciados ou das transações deles decorrentes.</p>

      <p class='font-bold text-slate-800 mb-2'>3. Condições de Acesso e Registo</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li>A plataforma destina-se a maiores de 18 anos ou a menores de 16 anos com autorização do representante legal, nos termos do art. 8.º do RGPD e da Lei n.º 58/2019.</li>
        <li>O registo é gratuito e obrigatório para publicar anúncios. O utilizador é responsável pela confidencialidade das suas credenciais de acesso (Firebase Authentication).</li>
        <li>A ReparAuto reserva-se o direito de suspender ou cancelar contas que violem estes Termos, que publiquem conteúdo ilegal ou que suspeitem ter sido objeto de utilização abusiva ou fraudulenta.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>4. Regras de Utilização e Conteúdo Proibido</p>
      <p class='mb-4'>O utilizador compromete-se a não utilizar a plataforma para:</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li>Publicar anúncios de veículos ou peças roubados, sinistrados com omissão dessa informação, ou cuja venda seja ilícita nos termos da lei portuguesa.</li>
        <li>Publicar conteúdo difamatório, fraudulento, enganoso ou que viole direitos de terceiros.</li>
        <li>Realizar atividades de scraping, mineração de dados ou qualquer acesso automatizado não autorizado à plataforma.</li>
        <li>Disponibilizar informações de contacto falsas ou induzir outros utilizadores em erro quanto à identidade ou localização do item.</li>
        <li>Utilizar a plataforma para fins que não sejam a compra e venda legítima de veículos e peças automóveis.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>5. Direitos e Deveres do Vendedor</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Veracidade das Informações:</strong> O Vendedor compromete-se a fornecer informações rigorosas, completas e atualizadas sobre o veículo ou peça, incluindo o estado real de conservação, quilometragem, avarias conhecidas e historial de acidentes sempre que solicitado.</li>
        <li><strong>Legitimidade:</strong> O Vendedor garante ter a titularidade ou legitimidade para a venda do item anunciado.</li>
        <li><strong>Transparência em Viaturas com Avarias:</strong> Nos casos de veículos com necessidade de reparação, o Vendedor deve explicitar as deficiências conhecidas e, quando aplicável, os custos estimados de reparação.</li>
        <li><strong>Responsabilidade Fiscal:</strong> O Vendedor é o único responsável pelo cumprimento das obrigações fiscais e legais decorrentes da transação, incluindo o Imposto Municipal sobre Transmissões Onerosas de Veículos (IMT) e o Imposto sobre o Rendimento (IRS/IRC) aplicável.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>6. Direitos e Deveres do Comprador</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Due Diligence:</strong> É da inteira responsabilidade do Comprador verificar o estado do veículo ou peça presencialmente antes de realizar qualquer pagamento, bem como verificar a documentação (livrete, DUC, inspeção periódica).</li>
        <li><strong>Consciência do Risco:</strong> O Comprador reconhece que veículos ou peças de baixo custo (low-cost) acarretam um risco inerente superior de anomalias adicionais não detetadas.</li>
        <li><strong>Direito de Livre Resolução:</strong> O direito de livre resolução previsto no Decreto-Lei n.º 24/2014 não se aplica a transações entre particulares através de marketplace. As transações realizadas na plataforma são consideradas de particular para particular, não assistindo ao Comprador o direito de arrependimento de 14 dias aplicável às relações Business-to-Consumer (B2C).</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>7. Transações e Pagamentos</p>
      <p class='mb-4'>A ReparAuto não processa pagamentos, não cobra comissões sobre transações e não atua como intermediária financeira. Todas as condições de pagamento e entrega são acordadas diretamente entre Vendedor e Comprador. A ReparAuto não se responsabiliza por quaisquer perdas financeiras, disputas de pagamento ou incumprimentos contratuais entre as partes.</p>

      <p class='font-bold text-slate-800 mb-2'>8. Propriedade Intelectual</p>
      <p class='mb-4'>O nome, logótipo e design da ReparAuto são propriedade exclusiva do operador da plataforma. O conteúdo dos anúncios (texto, fotografias e dados) é da exclusiva responsabilidade do utilizador que o publica, que garante ter os direitos necessários sobre esse conteúdo. A reprodução ou distribuição não autorizada de qualquer conteúdo da plataforma é expressamente proibida.</p>

      <p class='font-bold text-slate-800 mb-2'>9. Limitação de Responsabilidade</p>
      <p class='mb-4'>A ReparAuto atua como mero intermediário tecnológico, nos termos do Regulamento (UE) 2022/2065 (Digital Services Act). Não nos responsabilizamos por:</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li>Conteúdos publicados por utilizadores que violem a lei ou direitos de terceiros;</li>
        <li>Danos diretos ou indiretos decorrentes de transações entre utilizadores;</li>
        <li>Indisponibilidade temporária da plataforma por razões de manutenção, falhas técnicas ou caso de força maior;</li>
        <li>Perda de dados ou interrupção do serviço causada por terceiros.</li>
      </ul>
      <p class='mb-4'>A presente limitação não exclui a responsabilidade da ReparAuto nos casos em que a lei portuguesa ou da União Europeia imperativamente a imponha, nomeadamente por dolo ou culpa grave.</p>

      <p class='font-bold text-slate-800 mb-2'>10. Moderação de Conteúdo e DSA</p>
      <p class='mb-4'>Nos termos do Regulamento (UE) 2022/2065 (Digital Services Act):</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li>Os utilizadores podem comunicar à ReparAuto a existência de conteúdos ilegais ou que violem estes Termos através do email <strong>reparauto.contacto@gmail.com</strong>.</li>
        <li>Comprometemo-nos a analisar as comunicações num prazo razoável e a remover ou desativar o acesso a conteúdos ilegais ou que violem estes Termos.</li>
        <li>Os utilizadores cujo conteúdo seja removido ou cuja conta seja suspensa têm direito a contestar essa decisão através do mesmo email, sendo a decisão revista por um ser humano.</li>
        <li>A ReparAuto publica anualmente um relatório de transparência com informação sobre as medidas de moderação de conteúdo adotadas.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>11. Cancelamento de Conta e Remoção de Anúncios</p>
      <p class='mb-4'>O utilizador pode cancelar a sua conta e remover os seus anúncios em qualquer momento. A ReparAuto pode remover anúncios ou suspender contas que violem estes Termos, a lei aplicável, ou mediante solicitação fundamentada de autoridades competentes. Os dados pessoais associados à conta serão tratados de acordo com a Política de Privacidade.</p>

      <p class='font-bold text-slate-800 mb-2'>12. Lei Aplicável e Foro Competente</p>
      <p class='mb-4'>Estes Termos regem-se pela lei portuguesa, em conformidade com o direito da União Europeia. Para litígios não resolvidos por via extrajudicial, é competente o tribunal da comarca da área de residência do consumidor, nos termos do art. 14.º do Regulamento (UE) n.º 1215/2012. A ReparAuto não adere atualmente a nenhum mecanismo de resolução alternativa de litígios de consumo, mas está disponível para recorrer ao CNIACC (Centro Nacional de Informação e Arbitragem de Conflitos de Consumo) sempre que aplicável.</p>

      <p class='font-bold text-slate-800 mb-2'>13. Alterações aos Termos</p>
      <p class='mb-4'>A ReparAuto reserva-se o direito de alterar estes Termos a qualquer momento. As alterações serão comunicadas aos utilizadores registados com uma antecedência mínima de 30 dias. A utilização continuada da plataforma após a entrada em vigor das alterações implica a aceitação das mesmas.</p>

      <p class='font-bold text-slate-800 mb-2'>14. Contactos</p>
      <p class='mb-4'>Para qualquer questão relacionada com estes Termos, incluindo comunicações ao abrigo do DSA, contacte-nos através do email: <strong>reparauto.contacto@gmail.com</strong>.</p>
    `,
  },
  privacidade: {
    titulo: 'Política de Privacidade (RGPD) - ReparAuto',
    corpo: `
      <p class='font-bold text-slate-800 mb-2'>1. Enquadramento e Responsável pelo Tratamento</p>
      <p class='mb-4'>No estrito cumprimento do Regulamento (UE) 2016/679 (Regulamento Geral sobre a Proteção de Dados — RGPD) e da Lei n.º 58/2019, de 8 de agosto (Lei de Execução do RGPD em Portugal), a ReparAuto compromete-se a proteger a privacidade dos seus utilizadores. O responsável pelo tratamento é o operador da plataforma. Contacto: <strong>reparauto.contacto@gmail.com</strong>. Não existe obrigação legal de nomear um Encarregado de Proteção de Dados (DPO) nos termos do art. 37.º do RGPD; no entanto, todas as questões relacionadas com dados pessoais podem ser dirigidas ao contacto acima indicado.</p>

      <p class='font-bold text-slate-800 mb-2'>2. Categorias de Dados Pessoais Recolhidos</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Dados de Identificação e Contacto:</strong> Nome, endereço de email, número de telefone (quando fornecido pelo utilizador).</li>
        <li><strong>Dados de Localização:</strong> Indicação geográfica geral (concelho) fornecida pelo utilizador para associar aos anúncios. Não são recolhidas coordenadas GPS exatas.</li>
        <li><strong>Dados de Navegação e Dispositivo:</strong> Endereço IP, tipo e versão do browser, sistema operativo, páginas visitadas e timestamps. Estes dados são tratados de forma anonimizada para fins de segurança e diagnóstico.</li>
        <li><strong>Dados de Autenticação:</strong> UID (identificador único) gerado pelo Firebase Authentication, método de autenticação selecionado (email/password ou Google OAuth), fotografia de perfil do Google (apenas se o utilizador autenticar via Google).</li>
        <li><strong>Dados de Anúncios:</strong> Informações sobre veículos ou peças publicadas, incluindo fotografias, descrições, preços e estado de conservação.</li>
        <li><strong>Favoritos:</strong> Lista de anúncios favoritos, armazenada no Firestore para utilizadores autenticados ou em localStorage para visitantes não autenticados.</li>
      </ul>
      <p class='mb-4'><em>Não são recolhidos dados sensíveis (categoria especial do art. 9.º do RGPD), como origem racial ou étnica, opiniões políticas, crenças religiosas, dados biométricos ou de saúde.</em></p>

      <p class='font-bold text-slate-800 mb-2'>3. Finalidades do Tratamento e Bases Jurídicas</p>
      <table class='w-full mb-4 text-sm border-collapse border border-slate-300'>
        <thead><tr class='bg-slate-100'><th class='border border-slate-300 p-2 text-left'>Finalidade</th><th class='border border-slate-300 p-2 text-left'>Base Jurídica (RGPD)</th><th class='border border-slate-300 p-2 text-left'>Dados Utilizados</th></tr></thead>
        <tbody>
          <tr><td class='border border-slate-300 p-2'>Criação e gestão de conta</td><td class='border border-slate-300 p-2'>Art. 6.º, n.º 1, al. b) — Execução de contrato</td><td class='border border-slate-300 p-2'>Email, nome, UID</td></tr>
          <tr><td class='border border-slate-300 p-2'>Publicação e gestão de anúncios</td><td class='border border-slate-300 p-2'>Art. 6.º, n.º 1, al. b) — Execução de contrato</td><td class='border border-slate-300 p-2'>Dados do anúncio, localização, contacto</td></tr>
          <tr><td class='border border-slate-300 p-2'>Facilitação do contacto entre utilizadores</td><td class='border border-slate-300 p-2'>Art. 6.º, n.º 1, al. b) — Execução de contrato</td><td class='border border-slate-300 p-2'>Nome, email/telefone (conforme anúncio)</td></tr>
          <tr><td class='border border-slate-300 p-2'>Segurança e integridade da plataforma</td><td class='border border-slate-300 p-2'>Art. 6.º, n.º 1, al. f) — Interesse legítimo</td><td class='border border-slate-300 p-2'>IP, logs de acesso, UID</td></tr>
          <tr><td class='border border-slate-300 p-2'>Gestão de favoritos (autenticados)</td><td class='border border-slate-300 p-2'>Art. 6.º, n.º 1, al. b) — Execução de contrato</td><td class='border border-slate-300 p-2'>UID, IDs dos anúncios</td></tr>
          <tr><td class='border border-slate-300 p-2'>Favoritos (não autenticados)</td><td class='border border-slate-300 p-2'>Art. 6.º, n.º 1, al. a) — Consentimento (implícito pelo uso)</td><td class='border border-slate-300 p-2'>localStorage (dados locais)</td></tr>
          <tr><td class='border border-slate-300 p-2'>Comunicação de alterações aos Termos</td><td class='border border-slate-300 p-2'>Art. 6.º, n.º 1, al. c) — Obrigação legal</td><td class='border border-slate-300 p-2'>Email</td></tr>
        </tbody>
      </table>

      <p class='font-bold text-slate-800 mb-2'>4. Subprocessadores e Transferências Internacionais de Dados</p>
      <p class='mb-4'>A ReparAuto utiliza como subprocessadores os seguintes serviços, todos do Google Cloud / Firebase (Google LLC):</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Firebase Authentication</strong> — gestão de autenticação (email/password, Google OAuth).</li>
        <li><strong>Firestore (Cloud Firestore)</strong> — base de dados NoSQL para armazenamento de anúncios, perfis, notificações e favoritos.</li>
        <li><strong>Firebase Storage</strong> — armazenamento de fotografias dos anúncios.</li>
        <li><strong>Firebase Hosting</strong> — alojamento da aplicação estática (SPA).</li>
      </ul>
      <p class='mb-4'>Os dados são armazenados em servidores localizados na <strong>União Europeia</strong> (europe-west1 ou europe-west3, consoante o serviço). O Google LLC dispõe de Certified SCCs (Standard Contractual Clauses) aprovadas pela Comissão Europeia (Decisão de Execução (UE) 2021/914) como garantia adequada para transferências internacionais de dados para os Estados Unidos, nos termos do art. 46.º do RGPD.</p>

      <p class='font-bold text-slate-800 mb-2'>5. Prazos de Conservação dos Dados</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Dados de conta e anúncios ativos:</strong> Conservados durante a vigência da conta. Após eliminação da conta ou remoção do anúncio, os dados são apagados no prazo máximo de 30 dias.</li>
        <li><strong>Logs de acesso e dados de navegação:</strong> 6 meses, exceto se necessário para investigação de incidentes de segurança.</li>
        <li><strong>Dados de favoritos (Firestore):</strong> Até remoção pelo utilizador ou eliminação da conta.</li>
        <li><strong>Favoritos (localStorage):</strong> Permanecem no dispositivo do utilizador até remoção manual ou limpeza dos dados de navegação.</li>
        <li><strong>Dados de faturação fiscal:</strong> Caso aplicável, 10 anos por imposição legal (art. 40.º do Código do IRC e art. 123.º do CIVA).</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>6. Partilha de Dados com Terceiros</p>
      <p class='mb-4'>A ReparAuto <strong>não vende, não aluga nem partilha dados pessoais</strong> com terceiros para fins de marketing. Os únicos destinatários dos dados são os subprocessadores referidos no ponto 4 e, quando aplicável, as autoridades judiciais ou administrativas competentes no cumprimento de obrigações legais. Os dados de contacto do vendedor (email e/ou telefone) são disponibilizados aos compradores interessados através da plataforma, conforme a visibilidade definida pelo vendedor no momento da publicação do anúncio.</p>

      <p class='font-bold text-slate-800 mb-2'>7. Direitos dos Titulares dos Dados</p>
      <p class='mb-4'>Nos termos dos artigos 15.º a 22.º do RGPD, o titular dos dados tem direito a:</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Acesso (art. 15.º):</strong> Confirmar se os seus dados são tratados e obter cópia dos mesmos.</li>
        <li><strong>Retificação (art. 16.º):</strong> Solicitar a correção de dados inexatos ou incompletos.</li>
        <li><strong>Apagamento / Direito ao Esquecimento (art. 17.º):</strong> Solicitar a eliminação dos seus dados, exceto quando o tratamento seja necessário para o cumprimento de obrigações legais.</li>
        <li><strong>Limitação do Tratamento (art. 18.º):</strong> Solicitar a restrição do tratamento em determinadas circunstâncias.</li>
        <li><strong>Portabilidade (art. 20.º):</strong> Receber os dados fornecidos num formato estruturado, de uso corrente e leitura mecânica (ex.: JSON) e solicitar a transmissão direta a outro responsável pelo tratamento, quando tecnicamente possível.</li>
        <li><strong>Oposição (art. 21.º):</strong> Opor-se ao tratamento baseado em interesse legítimo, incluindo para fins de marketing direto.</li>
        <li><strong>Decisões Automatizadas (art. 22.º):</strong> Não ser sujeito a decisões baseadas exclusivamente em tratamento automatizado que produzam efeitos jurídicos ou significativos. A ReparAuto <strong>não realiza qualquer tipo de decisão automatizada ou profiling</strong>.</li>
      </ul>
      <p class='mb-4'>Para exercer qualquer um destes direitos, contacte-nos através do email: <strong>reparauto.contacto@gmail.com</strong>. As solicitações serão respondidas no prazo máximo de 30 dias, sem custos, exceto nos casos de pedidos manifestamente infundados ou excessivos (art. 12.º, n.º 5 do RGPD). Poderá ser solicitada prova de identidade antes de processar o pedido.</p>

      <p class='font-bold text-slate-800 mb-2'>8. Direito de Reclamação à Autoridade de Controlo</p>
      <p class='mb-4'>Sem prejuízo de qualquer outra via de recurso administrativo ou judicial, o titular dos dados tem o direito de apresentar uma reclamação à autoridade de controlo portuguesa, a <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong>, se considerar que o tratamento dos seus dados viola o RGPD ou a Lei n.º 58/2019:</p>
      <ul class='list-disc pl-5 mb-4'>
        <li>Morada: Av. D. Carlos I, 134, 1.º, 1200-651 Lisboa, Portugal</li>
        <li>Telefone: +351 213 928 400</li>
        <li>Email: <strong>geral@cnpd.pt</strong></li>
        <li>Website: <strong>www.cnpd.pt</strong></li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>9. Consentimento e Menores</p>
      <p class='mb-4'>Nos casos em que o tratamento se baseia no consentimento (art. 6.º, n.º 1, al. a) do RGPD), o utilizador tem o direito de retirar o consentimento em qualquer momento, sem comprometer a licitude do tratamento efetuado até essa data. Em Portugal, a idade mínima para consentir no tratamento de dados pessoais no contexto dos serviços da sociedade de informação é de 16 anos (art. 16.º da Lei n.º 58/2019). Abaixo dessa idade, o consentimento deve ser dado ou autorizado pelo titular das responsabilidades parentais.</p>

      <p class='font-bold text-slate-800 mb-2'>10. Obrigação de Fornecimento de Dados</p>
      <p class='mb-4'>O fornecimento dos dados de identificação e contacto é necessário para a criação de conta e publicação de anúncios (exigência contratual). Sem esses dados, não é possível prestar o serviço. Os restantes dados (telefone, localização) são facultativos.</p>

      <p class='font-bold text-slate-800 mb-2'>11. Segurança no Tratamento</p>
      <p class='mb-4'>A ReparAuto implementa as medidas técnicas e organizativas adequadas para proteger os dados pessoais contra a destruição acidental ou ilícita, a perda, a alteração, a divulgação ou o acesso não autorizado, nos termos do art. 32.º do RGPD. Consulte a Política de Segurança para mais detalhes.</p>

      <p class='font-bold text-slate-800 mb-2'>12. Alterações à Política de Privacidade</p>
      <p class='mb-4'>A presente Política de Privacidade pode ser atualizada periodicamente. As alterações serão comunicadas aos utilizadores registados com antecedência mínima de 15 dias, e a versão mais recente estará sempre disponível na plataforma.</p>
    `,
  },
  cookies: {
    titulo: 'Política de Cookies e Armazenamento Local - ReparAuto',
    corpo: `
      <p class='font-bold text-slate-800 mb-2'>1. O que são Cookies e Tecnologias Semelhantes?</p>
      <p class='mb-4'>Cookies são pequenos ficheiros de texto armazenados no seu navegador quando visita um website. A ReparAuto utiliza também o <strong>localStorage</strong> (armazenamento local do navegador) para persistir preferências e dados localmente. Esta Política abrange ambas as tecnologias, em conformidade com a <strong>Diretiva 2002/58/CE</strong> (ePrivacy), o <strong>RGPD</strong> e a <strong>Lei n.º 46/2012</strong>, de 29 de agosto, que a transpõe para o ordenamento jurídico português.</p>

      <p class='font-bold text-slate-800 mb-2'>2. Cookies e Tecnologias Utilizadas</p>
      <p class='mb-4'>A ReparAuto utiliza exclusivamente tecnologias estritamente necessárias ao funcionamento da plataforma. <strong>Não são utilizados cookies de marketing ou de publicidade.</strong></p>

      <table class='w-full mb-4 text-sm border-collapse border border-slate-300'>
        <thead><tr class='bg-slate-100'><th class='border border-slate-300 p-2 text-left'>Tipo</th><th class='border border-slate-300 p-2 text-left'>Nome / Origem</th><th class='border border-slate-300 p-2 text-left'>Finalidade</th><th class='border border-slate-300 p-2 text-left'>Duração</th></tr></thead>
        <tbody>
          <tr><td class='border border-slate-300 p-2'>Autenticação (Cookie HTTP)</td><td class='border border-slate-300 p-2'>Firebase Auth — gerido pelo SDK Firebase</td><td>Token de sessão do utilizador autenticado. Permite manter a sessão ativa entre páginas.</td><td class='border border-slate-300 p-2'>Sessão / persistente (configuração Firebase)</td></tr>
          <tr><td class='border border-slate-300 p-2'>Autenticação (localStorage)</td><td class='border border-slate-300 p-2'>firebase:authUser:*</td><td>Cache local do token de autenticação para reabrir sessão automaticamente.</td><td class='border border-slate-300 p-2'>Até à renovação do token</td></tr>
          <tr><td class='border border-slate-300 p-2'>Armazenamento Local</td><td class='border border-slate-300 p-2'>favs_reparauto</td><td>Lista de IDs de anúncios favoritos (apenas para utilizadores não autenticados).</td><td class='border border-slate-300 p-2'>Persistente até remoção manual pelo utilizador</td></tr>
          <tr><td class='border border-slate-300 p-2'>Armazenamento Local</td><td class='border border-slate-300 p-2'>reparauto_db_version</td><td>Versão da base de dados local para controlo de migrações e seeding.</td><td class='border border-slate-300 p-2'>Persistente</td></tr>
        </tbody>
      </table>

      <p class='font-bold text-slate-800 mb-2'>3. Serviços de Terceiros</p>
      <p class='mb-4'>A ReparAuto utiliza o <strong>Firebase</strong> (Google LLC) como plataforma de backend. O Firebase pode definir cookies de sessão estritamente necessários para a autenticação e segurança. A Google dispõe de Certified SCCs (Standard Contractual Clauses) para transferências internacionais de dados, e os seus data centers na União Europeia garantem a conformidade com o RGPD.</p>

      <p class='font-bold text-slate-800 mb-2'>4. Base Jurídica e Consentimento</p>
      <p class='mb-4'>Nos termos do art. 5.º, n.º 3, da Diretiva 2002/58/CE (transposta pela Lei n.º 46/2012), os cookies e tecnologias de armazenamento local <strong>estritamente necessários</strong> ao funcionamento da plataforma estão isentos de consentimento prévio. As restantes tecnologias serão sujeitas a consentimento prévio antes da sua instalação. Ao continuar a navegar na ReparAuto após a exibição do banner de cookies, está a consentir a utilização das tecnologias analíticas opcionais, se aplicável.</p>

      <p class='font-bold text-slate-800 mb-2'>5. Como Gerir e Remover Cookies</p>
      <p class='mb-4'>Pode configurar o seu navegador para bloquear ou eliminar cookies a qualquer momento. Abaixo encontram-se as instruções para os navegadores mais comuns:</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Google Chrome:</strong> Configurações → Privacidade e segurança → Cookies e outros dados de sites</li>
        <li><strong>Mozilla Firefox:</strong> Opções → Privacidade e Segurança → Cookies e dados de sites</li>
        <li><strong>Safari:</strong> Preferências → Privacidade → Gerir dados de websites</li>
        <li><strong>Microsoft Edge:</strong> Configurações → Cookies e permissões de site → Cookies</li>
        <li><strong>Opera:</strong> Configurações → Privacidade e segurança → Cookies</li>
      </ul>
      <p class='mb-4'>Para remover manualmente dados de localStorage (incluindo favoritos), pode limpar os dados de navegação no seu navegador ou utilizar as ferramentas de desenvolvimento (F12 → Application → Local Storage → Eliminar).</p>

      <p class='font-bold text-slate-800 mb-2'>6. Consequências da Desativação</p>
      <p class='mb-4'>A desativação dos cookies de autenticação impedirá o acesso a funcionalidades que requerem sessão iniciada (publicar anúncios, gerir favoritos na cloud). As funcionalidades básicas de navegação e visualização de anúncios não serão afetadas.</p>

      <p class='font-bold text-slate-800 mb-2'>7. Contacto e Alterações</p>
      <p class='mb-4'>Para questões relacionadas com esta Política de Cookies, contacte-nos através do email: <strong>reparauto.contacto@gmail.com</strong>. Reservamo-nos o direito de atualizar esta Política; as alterações serão comunicadas com antecedência mínima de 15 dias e estarão sempre disponíveis na plataforma.</p>
    `,
  },
  seguranca: {
    titulo: 'Política de Segurança da Plataforma - ReparAuto',
    corpo: `
      <p class='font-bold text-slate-800 mb-2'>1. Arquitetura e Stack Tecnológica</p>
      <p class='mb-4'>A ReparAuto é uma aplicação web de página única (SPA) construída com <strong>React 19</strong> e <strong>Vite 8</strong>, alojada no <strong>Firebase Hosting</strong>. O backend é inteiramente gerido pelo ecossistema <strong>Firebase / Google Cloud</strong> (plataforma como serviço — PaaS), não existindo servidores próprios ou APIs personalizadas. Esta arquitetura minimiza a superfície de ataque e transfere grande parte das responsabilidades de segurança de infraestrutura para a Google, que dispõe de certificações ISO 27001, SOC 1/2/3 e está em conformidade com o RGPD.</p>

      <p class='font-bold text-slate-800 mb-2'>2. Segurança da Rede e Transporte</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>HTTPS Obrigatório:</strong> Todo o tráfego entre o navegador e o Firebase Hosting é encriptado com TLS 1.2+ (TLS 1.3 sempre que suportado pelo cliente).</li>
        <li><strong>Certificados SSL/TLS:</strong> Geridos automaticamente pelo Firebase Hosting através da infraestrutura Google (certificados renovados automaticamente).</li>
        <li><strong>Content Security Policy (CSP):</strong> A aplicação implementa headers CSP restritivos para mitigar ataques de Cross-Site Scripting (XSS) e de injeção de conteúdo, permitindo apenas a execução de scripts das origens confiáveis (firebaseapp.com, gstatic.com, apis.google.com, e o próprio domínio).</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>3. Autenticação e Controlo de Acesso</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Firebase Authentication:</strong> O sistema de autenticação gerido pelo Firebase suporta <strong>email/password</strong> (com hash bcrypt do lado do servidor Firebase) e <strong>Google OAuth 2.0</strong> (via popup, com tokens de acesso JWT).</li>
        <li><strong>Tokens de Sessão:</strong> As sessões são geridas através de tokens JWT (ID Tokens) emitidos pelo Firebase, com renovação automática e expiração configurada para segurança máxima.</li>
        <li><strong>Atualização de Password:</strong> A alteração de password é tratada diretamente pelo Firebase Auth, que exige reautenticação para operações sensíveis e notifica o utilizador por email em caso de alteração.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>4. Segurança na Base de Dados (Firestore)</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Firebase Security Rules:</strong> O acesso à base de dados Firestore é protegido por regras de segurança declarativas. Apenas utilizadores autenticados podem ler e escrever nas coleções, com validações específicas (ex.: apenas o criador pode editar ou eliminar o seu anúncio).</li>
        <li><strong>Validação no Servidor:</strong> As regras de segurança do Firestore incluem validação de tipos de dados, tamanhos e estrutura dos documentos, impedindo a inserção de dados malformados ou não conformes.</li>
        <li><strong>Auditoria:</strong> O Firebase dispõe de logs de auditoria (Cloud Audit Logs) para operações de administração e acesso aos dados.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>5. Segurança no Armazenamento de Ficheiros (Storage)</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Firebase Security Rules:</strong> O acesso ao Firebase Storage é protegido por regras que restringem a leitura a utilizadores autenticados e a escrita apenas ao proprietário do ficheiro.</li>
        <li><strong>Validação de Upload:</strong> As regras do Storage verificam o tipo MIME e o tamanho máximo dos ficheiros (2 MB por imagem), impedindo o upload de ficheiros executáveis ou maliciosos.</li>
        <li><strong>Encriptação:</strong> Todos os ficheiros armazenados no Firebase Storage são encriptados em repouso com AES-256, gerido pela Google Cloud.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>6. Proteção contra Vulnerabilidades Comuns (OWASP Top 10)</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>XSS (Cross-Site Scripting):</strong> Mitigado através de CSP (Content Security Policy), sanitização de input no cliente (React escapa automaticamente conteúdo JSX) e validação no servidor via Firestore Security Rules. O conteúdo gerado pelos utilizadores (descrições de anúncios) é processado com renderização segura que restringe HTML a tags seguras.</li>
        <li><strong>Injection:</strong> O Firestore é uma base de dados NoSQL que utiliza consultas parametrizadas, eliminando o risco de SQL Injection. Não existem consultas SQL nem ORM na stack.</li>
        <li><strong>Cross-Site Request Forgery (CSRF):</strong> O Firebase Authentication utiliza tokens de ID JWT que são verificados em cada operação. Como não existem cookies de autenticação tradicionais nem formulários HTML submetidos a servidor próprio, o risco de CSRF é inerentemente baixo. Para operações sensíveis (eliminar conta, alterar email), o Firebase exige reautenticação recente.</li>
        <li><strong>Broken Authentication:</strong> Gerido pelo Firebase Authentication, que implementa boas práticas de segurança (rate limiting automático, proteção contra brute force, bloqueio de contas após múltiplas tentativas falhadas).</li>
        <li><strong>Sensitive Data Exposure:</strong> Não são armazenados dados de cartões de crédito, passwords em texto limpo ou dados biométricos. As passwords são geridas exclusivamente pelo Firebase Auth.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>7. Minimização de Dados</p>
      <p class='mb-4'>A ReparAuto aplica o princípio da minimização de dados (art. 5.º, n.º 1, al. c) do RGPD): apenas são recolhidos os dados estritamente necessários ao funcionamento da plataforma. Não é solicitada documentação pessoal (CC, NIF), morada completa, dados bancários ou de pagamento.</p>

      <p class='font-bold text-slate-800 mb-2'>8. Plano de Resposta a Incidentes</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Deteção e Notificação:</strong> Na eventualidade de uma violação de dados pessoais, a ReparAuto notificará a CNPD no prazo máximo de 72 horas (art. 33.º do RGPD) e os titulares dos dados afetados sempre que a violação represente um risco elevado para os seus direitos e liberdades (art. 34.º do RGPD).</li>
        <li><strong>Correção:</strong> As equipas da Google Cloud / Firebase são responsáveis pela segurança da infraestrutura subjacente. Em caso de vulnerabilidade ao nível da aplicação, a ReparAuto compromete-se a corrigi-la num prazo razoável.</li>
        <li><strong>Contacto de Segurança:</strong> Para reportar vulnerabilidades ou incidentes de segurança, contacte: <strong>reparauto.contacto@gmail.com</strong>.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>9. Boas Práticas para o Utilizador</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li>Utilize uma password única e forte para a sua conta ReparAuto (recomendamos um gestor de passwords).</li>
        <li>Não partilhe as suas credenciais de acesso com terceiros.</li>
        <li>Verifique se o URL do site começa por "https://reparauto-site.firebaseapp.com" ou o domínio personalizado associado.</li>
        <li>Mantenha o seu navegador e sistema operativo atualizados.</li>
        <li>Em caso de suspeita de acesso não autorizado à sua conta, altere a password e contacte-nos imediatamente.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>10. Conformidade e Certificações</p>
      <p class='mb-4'>A infraestrutura Google Cloud / Firebase, que suporta a ReparAuto, dispõe das seguintes certificações e conformidades: <strong>ISO 27001</strong>, <strong>ISO 27017</strong>, <strong>ISO 27018</strong>, <strong>SOC 1/2/3</strong>, <strong>PCI DSS</strong>, <strong>FedRAMP</strong>, e está em conformidade com o <strong>RGPD</strong> (incluindo Certified SCCs para transferências internacionais de dados). A ReparAuto compromete-se a manter a plataforma em conformidade com a legislação aplicável, incluindo o RGPD, o DSA e a legislação nacional portuguesa.</p>

      <p class='font-bold text-slate-800 mb-2'>11. Contacto</p>
      <p class='mb-4'>Para reportar vulnerabilidades de segurança, solicitar informações sobre as medidas implementadas ou qualquer outra questão de segurança, contacte: <strong>reparauto.contacto@gmail.com</strong>.</p>
    `,
  },
};
