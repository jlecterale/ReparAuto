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

// ============ TEXTOS DAS POLÍTICAS ============
export const TEXTOS_POLITICAS = {
  termos: {
    titulo: 'Termos de Utilização - ReparAuto',
    corpo: `
      <p class='font-bold text-slate-800 mb-2'>1. Introdução</p>
      <p class='mb-4'>Bem-vindo(a) à <strong>ReparAuto</strong>. Ao aceder e utilizar a ReparAuto, o utilizador concorda em submeter-se aos presentes Termos de Utilização. Se não concordo com estes termos, não deverá utilizar a plataforma.</p>

      <p class='font-bold text-slate-800 mb-2'>2. Natureza do Serviço</p>
      <p class='mb-4'>A ReparAuto é um marketplace que atua exclusivamente como intermediário tecnológico. Disponibilizamos uma plataforma online para que Vendedores e Compradores possam interagir com fins de compra e venda de veículos e peças. A ReparAuto não é proprietária dos itens anunciados, não assumindo qualquer responsabilidade pelas transações celebradas entre as partes.</p>

      <p class='font-bold text-slate-800 mb-2'>3. Direitos e Deveres do Vendedor</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Veracidade das Informações:</strong> O Vendedor compromete-se a fornecer informações rigorosas, completas e atualizadas sobre o veículo ou peça, incluindo o estado real de conservação e avarias conhecidas.</li>
        <li><strong>Responsabilidade Legal:</strong> O Vendedor garante ter capacidade legal e legitimidade para a venda do item.</li>
        <li><strong>Transparência em Viaturas com Avarias:</strong> Nos casos de veículos com necessidade de reparação, o Vendedor deve explicitar as deficiências e custos conhecidos.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>4. Direitos e Deveres do Comprador</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Due Diligence:</strong> É da inteira responsabilidade do Comprador verificar o estado do veículo ou peça presencialmente antes de realizar qualquer pagamento.</li>
        <li><strong>Consciência do Risco:</strong> O Comprador reconhece que veículos ou peças low-cost acarretam risco inerente superior de anomalias adicionais.</li>
      </ul>
    `,
  },
  privacidade: {
    titulo: 'Política de Privacidade (RGPD) - ReparAuto',
    corpo: `
      <p class='font-bold text-slate-800 mb-2'>1. Enquadramento e Responsável pelo Tratamento</p>
      <p class='mb-4'>No estrito cumprimento do Regulamento Geral sobre a Proteção de Dados (RGPD - Regulamento (UE) 2016/679), a ReparAuto compromete-se a proteger a privacidade dos seus utilizadores.</p>

      <p class='font-bold text-slate-800 mb-2'>2. Dados Recolhidos</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Dados de Identificação e Contacto:</strong> Nome, endereço de email, número de telefone.</li>
        <li><strong>Dados de Localização:</strong> Recolhemos apenas a indicação geográfica geral (concelho) fornecida pelo utilizador para associar aos anúncios. Não recolhemos coordenadas GPS exatas.</li>
        <li><strong>Dados de Registo:</strong> Endereço IP, tipo de browser, logs de acesso.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>3. Finalidades do Tratamento</p>
      <p class='mb-4'>Os dados são tratados para criação e gestão de conta, publicação de anúncios, facilitação do contacto direto entre comprador e vendedor, e melhorias de segurança.</p>

      <p class='font-bold text-slate-800 mb-2'>4. Retenção e Partilha de Dados</p>
      <p class='mb-4'>Os anúncios e dados associados são guardados para assegurar a correta exibição e eliminados permanentemente se o utilizador optar por apagar o anúncio. Nunca vendemos dados a terceiros para marketing.</p>

      <p class='font-bold text-slate-800 mb-2'>5. Direitos dos Titulares</p>
      <p class='mb-4'>O utilizador tem o direito de solicitar o acesso, retificação, apagamento (direito ao esquecimento), ou oposição ao tratamento dos seus dados pessoais.</p>
    `,
  },
  cookies: {
    titulo: 'Política de Cookies - ReparAuto',
    corpo: `
      <p class='font-bold text-slate-800 mb-2'>1. O que são Cookies?</p>
      <p class='mb-4'>Cookies são pequenos ficheiros de texto descarregados para o seu dispositivo quando visita um website.</p>

      <p class='font-bold text-slate-800 mb-2'>2. Categorias de Cookies Utilizados</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Estritamente Necessários:</strong> Essenciais para a navegação segura, tokens de sessão e guardar preferências de consentimento. Não podem ser desativados.</li>
        <li><strong>Analíticos / Desempenho:</strong> Permitem-nos contabilizar visitas e medir a performance da ReparAuto de forma anonimizada.</li>
        <li><strong>Funcionais:</strong> Usados para memorizar escolhas, como filtros de pesquisa recentes e lista de favoritos local.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>3. Gestão de Consentimento</p>
      <p class='mb-4'>A ReparAuto implementa um modelo de consentimento granular. Pode gerir livremente as suas preferências de consentimento a qualquer momento.</p>
    `,
  },
  seguranca: {
    titulo: 'Política de Segurança da Plataforma',
    corpo: `
      <p class='font-bold text-slate-800 mb-2'>1. Stack Tecnológica e Segurança Perimetral</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>HTTPS e HSTS Estrito:</strong> Todo o tráfego é servido via TLS 1.3 com HTTP Strict Transport Security (HSTS) estrito.</li>
        <li><strong>Proteção Contra Vulnerabilidades (OWASP):</strong> Prevenção contra SQL Injection (consultas parametrizadas), Cross-Site Scripting (XSS - sanitização estrita e CSP moderna), e CSRF (Tokens anti-CSRF).</li>
        <li><strong>Limitação de Tráfego:</strong> Rate Limiting por IP para impedir ataques de Brute Force e Scraping.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>2. Autenticação e Gestão de Sessão</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Autenticação Moderna:</strong> Suporte para OAuth 2.0 (Google, Apple) e Magic Links passwordless.</li>
        <li><strong>Controlo de Acesso:</strong> Perfis divididos via Role-Based Access Control (RBAC) com validação de tokens em endpoints de API.</li>
      </ul>

      <p class='font-bold text-slate-800 mb-2'>3. Proteção e Encriptação de Dados</p>
      <ul class='list-disc pl-5 mb-4 space-y-1'>
        <li><strong>Criptografia em Repouso:</strong> Discos de base de dados e backups utilizam encriptação AES-256 no nível de armazenamento.</li>
        <li><strong>Minimização de Dados:</strong> Apenas armazenamos dados de contacto estritamente necessários e geolocalização limitada (ao nível do concelho).</li>
      </ul>
    `,
  },
};
