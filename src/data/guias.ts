/**
 * Static buying/selling guides (GAP-13 — editorial content). Pure content:
 * rendered by the server components in app/guias/*, indexed by the sitemap.
 * User-facing text is Portuguese; identifiers stay English.
 */

export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: GuideCategory;
  readingMinutes: number;
  /** ISO date of the last content revision (feeds JSON-LD dateModified). */
  updatedAt: string;
  intro: string[];
  sections: GuideSection[];
}

export type GuideCategory = 'comprar' | 'vender' | 'pecas';

export const GUIDE_CATEGORIES: Record<GuideCategory, string> = {
  comprar: 'Comprar',
  vender: 'Vender',
  pecas: 'Peças',
};

export const GUIDES: Guide[] = [
  {
    slug: 'comprar-carro-usado-para-reparar',
    title: 'Como comprar um carro para reparar sem surpresas',
    description:
      'Checklist completo para comprar um carro usado com avarias em Portugal: o que inspecionar, como estimar a reparação e quando desistir do negócio.',
    category: 'comprar',
    readingMinutes: 7,
    updatedAt: '2026-07-02',
    intro: [
      'Um carro para reparar pode ser um excelente negócio — ou um poço sem fundo. A diferença está quase sempre na preparação de quem compra: saber o que perguntar, o que inspecionar e quanto vai custar pôr o carro a andar antes de fechar o negócio.',
      'Este guia junta a experiência de quem compra e vende carros com avarias todos os dias no RecarGarage, o marketplace onde o estado real do veículo é declarado de forma estruturada.',
    ],
    sections: [
      {
        heading: 'Comece pelo anúncio: o que um bom vendedor declara',
        paragraphs: [
          'Fuja de anúncios vagos ("precisa de arranjos") e prefira anúncios que discriminam o tipo de avaria. No RecarGarage, o vendedor indica se o carro está pronto a rodar ou precisa de manutenção, os tipos de intervenção necessários (mecânica, elétrica, pintura, lataria, estofos, ar condicionado), se o carro roda pelos próprios meios e se tem inspeção válida.',
          'Um vendedor que documenta as avarias com fotos e um orçamento estimado está, na prática, a reduzir o seu risco de comprador. Se o anúncio omite tudo isto, pergunte antes de se deslocar.',
        ],
      },
      {
        heading: 'Estime o custo total antes de negociar',
        paragraphs: [
          'A conta que interessa é: preço do carro + peças + mão-de-obra + legalização (inspeção, IUC) — comparada com o valor de mercado do carro reparado. Se a soma passar de 80% desse valor, o negócio raramente compensa.',
        ],
        bullets: [
          'Peça o orçamento de reparação ao vendedor, se existir, e valide-o com um mecânico independente.',
          'Consulte o preço das peças principais antes da visita — no marketplace de peças encontra referências reais de peças usadas.',
          'Some sempre uma margem de 20–30% para avarias descobertas depois da compra.',
        ],
      },
      {
        heading: 'A inspeção presencial: checklist mínimo',
        bullets: [
          'Motor frio ao chegar — um motor pré-aquecido pode esconder arranques difíceis.',
          'Verifique fugas de óleo e líquido de refrigeração (manchas por baixo do carro).',
          'Teste todos os elétricos: vidros, luzes, quadrante, ar condicionado.',
          'Procure diferenças de tinta e folgas entre painéis — sinais de acidente mal reparado.',
          'Confirme se o número de quadro (VIN) bate certo com o documento único (DUA).',
          'Se o carro roda, faça um test-drive: caixa, travões, direção e ruídos anormais.',
        ],
      },
      {
        heading: 'Documentação e sinais de alerta',
        paragraphs: [
          'Desconfie de preços demasiado bons, vendedores com pressa e pedidos de sinal por transferência antes de ver o carro. Exija sempre o documento único automóvel e confirme que quem vende é o proprietário.',
        ],
        bullets: [
          'Carro penhorado ou com reserva de propriedade: peça uma certidão do registo automóvel (online, custa poucos euros).',
          'Quilómetros suspeitos: compare com os relatórios das inspeções periódicas (IMT).',
          'Sem inspeção válida: conte com esse custo e possíveis reparações para a passar.',
        ],
      },
      {
        heading: 'Negocie com base em factos',
        paragraphs: [
          'Cada avaria documentada é um argumento objetivo de negociação. Leve a lista de intervenções necessárias e os preços das peças, e proponha um valor baseado no custo real de repor o carro em condições — não num palpite.',
          'Se o vendedor indicou um mecânico de confiança no anúncio, fale com ele: é frequentemente a fonte mais honesta sobre o histórico do carro.',
        ],
      },
    ],
  },
  {
    slug: 'verificar-historico-carro-usado',
    title: 'Como verificar o histórico de um carro usado em Portugal',
    description:
      'VIN, matrícula, registo automóvel, inspeções e quilómetros: os passos práticos para confirmar o passado de um carro usado antes de o comprar.',
    category: 'comprar',
    readingMinutes: 6,
    updatedAt: '2026-07-02',
    intro: [
      'O maior risco na compra de um usado não é a avaria visível — é a que ninguém declara: quilómetros adulterados, acidentes graves mal reparados, penhoras ou carros importados com passado obscuro.',
      'A boa notícia: em Portugal consegue verificar quase tudo com alguns passos simples e baratos.',
    ],
    sections: [
      {
        heading: 'Descodifique o VIN (número de quadro)',
        paragraphs: [
          'O VIN é o bilhete de identidade do carro: 17 caracteres gravados no quadro, visíveis normalmente na base do para-brisas e na ombreira da porta do condutor. Confirme que o VIN físico é igual ao que consta no documento único — qualquer divergência é motivo para abandonar o negócio.',
          'A descodificação do VIN revela a marca, o ano-modelo e o país de fabrico. Na página de cada anúncio do RecarGarage encontra um verificador de VIN que faz esta validação básica de borla.',
        ],
      },
      {
        heading: 'Consulte o registo automóvel',
        bullets: [
          'Peça uma certidão permanente do registo automóvel (online no site do registo automóvel, por poucos euros).',
          'A certidão mostra o proprietário atual, reservas de propriedade (crédito por liquidar), penhoras e apreensões.',
          'Nunca compre um carro com ónus registado sem que fique resolvido no ato da venda.',
        ],
      },
      {
        heading: 'Cruze os quilómetros com as inspeções',
        paragraphs: [
          'As inspeções periódicas obrigatórias registam a quilometragem em cada passagem. Peça ao vendedor as fichas de inspeção anteriores (ou consulte no portal do IMT) e verifique se a evolução dos quilómetros é coerente. Um carro que "andou para trás" ou que fez saltos improváveis é sinal de conta-quilómetros adulterado — prática que, além de fraude, é crime.',
        ],
      },
      {
        heading: 'Carros importados: cuidados extra',
        bullets: [
          'Peça a documentação de origem e confirme a data da primeira matrícula no país de origem.',
          'Verifique se o ISV (imposto sobre veículos) foi pago — sem isso, o carro não pode ser legalizado.',
          'Em carros vindos de países com histórico de inundações ou salvados, um relatório pago de histórico internacional (ex.: carVertical) é um investimento pequeno face ao risco.',
        ],
      },
      {
        heading: 'Histórico de manutenção e acidentes',
        paragraphs: [
          'Livro de revisões carimbado, faturas de oficina e histórico da marca são o padrão-ouro. Na ausência deles, um mecânico consegue ler muito do passado do carro numa inspeção pré-compra: pintura fora de fábrica, soldaduras no chassis, folgas anormais.',
          'No RecarGarage, os anúncios de carros para reparar declaram as avarias de forma estruturada — mas a verificação independente continua a ser sua. Transparência do vendedor e diligência do comprador não são substitutos um do outro.',
        ],
      },
    ],
  },
  {
    slug: 'negociar-preco-carro-usado',
    title: 'Como negociar o preço de um carro usado',
    description:
      'Técnicas práticas de negociação para carros usados: preparação, argumentos objetivos baseados no estado do carro e erros que custam dinheiro.',
    category: 'comprar',
    readingMinutes: 5,
    updatedAt: '2026-07-02',
    intro: [
      'Negociar não é regatear às cegas: é apresentar factos que justificam um preço diferente do pedido. Quem chega preparado paga menos — de forma consistente.',
    ],
    sections: [
      {
        heading: 'Prepare-se antes do contacto',
        bullets: [
          'Pesquise anúncios comparáveis (mesma marca, modelo, geração, combustível e quilometragem) e anote os preços pedidos.',
          'Some ao preço as despesas que vai ter: inspeção, IUC, seguro, eventuais reparações.',
          'Defina o seu preço máximo antes da visita — e cumpra-o.',
        ],
      },
      {
        heading: 'Argumentos objetivos valem mais do que insistência',
        paragraphs: [
          'Cada defeito verificável é um desconto legítimo: pneus no fim, revisão em atraso, amolgadelas, inspeção a expirar. Em carros para reparar, o orçamento das intervenções necessárias é o argumento central — apresente números de peças e mão-de-obra, não impressões.',
        ],
        bullets: [
          'Aponte defeitos durante a inspeção, com o vendedor presente.',
          'Use o custo real da reparação: "só em travões e embraiagem são 600€".',
          'Proponha um valor concreto e fundamentado em vez de perguntar "qual é a margem?".',
        ],
      },
      {
        heading: 'Timing e alternativas são alavancas',
        paragraphs: [
          'Um anúncio com semanas de vida dá-lhe mais margem do que uma novidade com dezenas de interessados. Ter alternativas reais (outros carros na sua lista) permite negociar sem ansiedade — e transmitir isso, com respeito, muda a conversa.',
        ],
      },
      {
        heading: 'Erros que custam dinheiro',
        bullets: [
          'Apaixonar-se por um carro específico e mostrá-lo ao vendedor.',
          'Negociar por telefone antes de inspecionar — perde os argumentos da inspeção.',
          'Deixar sinal sem documento assinado que identifique carro, valor e condições.',
          'Ceder à pressão do "tenho outro interessado para hoje".',
        ],
      },
      {
        heading: 'Feche o negócio com segurança',
        paragraphs: [
          'Acordado o preço, formalize: contrato de compra e venda simples com identificação das partes, do carro (matrícula e VIN), valor, e a declaração do estado conhecido. O pagamento deve acontecer no momento da assinatura do requerimento de registo — nunca antes.',
        ],
      },
    ],
  },
  {
    slug: 'comprar-pecas-usadas-com-seguranca',
    title: 'Como comprar peças auto usadas com segurança',
    description:
      'Compatibilidade, estado real e vendedores de confiança: o essencial para poupar em peças usadas e de desmonte sem comprar gato por lebre.',
    category: 'pecas',
    readingMinutes: 5,
    updatedAt: '2026-07-02',
    intro: [
      'Peças usadas e de desmonte custam tipicamente 40–70% menos do que novas — e para muitos componentes (portas, faróis, interiores, módulos) são a única opção economicamente sensata em carros com alguns anos.',
      'O risco não está no "usado": está em comprar a peça errada ou em pior estado do que o anunciado.',
    ],
    sections: [
      {
        heading: 'Compatibilidade primeiro, preço depois',
        paragraphs: [
          'A causa número um de devoluções é a peça que "não serve". Antes de comprar, confirme a compatibilidade com o seu carro: marca, modelo, geração e — crítico em peças mecânicas — a motorização exata.',
        ],
        bullets: [
          'Compare a referência OEM gravada na peça antiga com a anunciada, sempre que exista.',
          'No RecarGarage, os anúncios de peças declaram compatibilidades por marca, modelo, intervalo de anos e motor — e a página de cada carro mostra peças compatíveis.',
          'Na dúvida, envie ao vendedor o VIN do seu carro: permite confirmar a versão exata.',
        ],
      },
      {
        heading: 'Avalie o estado real da peça',
        bullets: [
          'Exija fotos reais da peça concreta (não de catálogo), incluindo defeitos.',
          'Peças elétricas e módulos: pergunte se foram testados e em que carro.',
          'Peças de desgaste (embraiagens, discos, amortecedores): pergunte os quilómetros do carro de origem.',
          'Desconfie de "como nova" sem fotos que o comprovem.',
        ],
      },
      {
        heading: 'Escolha o tipo de anúncio certo',
        paragraphs: [
          'Num marketplace com venda, desmonte e procura, use isso a seu favor: se a peça não aparece, publique um anúncio de procura e deixe os desmanteladores virem ter consigo. Para peças grandes (portas, capôs), o desmonte local poupa portes e riscos de transporte.',
        ],
      },
      {
        heading: 'Pagamento e entrega sem sustos',
        bullets: [
          'Prefira levantamento em mão com teste/inspeção da peça sempre que possível.',
          'À distância, use meios de pagamento com rasto (MB Way, transferência) e desconfie de vendedores que exigem métodos sem proteção.',
          'Acorde por escrito (no chat) a política de devolução se a peça não servir.',
          'Guarde a embalagem e registe a abertura em vídeo em peças caras — facilita reclamações.',
        ],
      },
    ],
  },
  {
    slug: 'vender-carro-avariado',
    title: 'Como vender um carro avariado de forma rápida e honesta',
    description:
      'Transparência vende: como anunciar um carro com avarias, definir o preço certo e encontrar o comprador que procura exatamente o seu carro.',
    category: 'vender',
    readingMinutes: 5,
    updatedAt: '2026-07-02',
    intro: [
      'Um carro avariado não é um problema sem valor — é um produto com um mercado próprio: mecânicos, hobbistas, recuperadores e desmanteladores procuram exatamente o que tem para vender.',
      'O segredo para vender depressa e sem conflitos pós-venda resume-se numa palavra: transparência.',
    ],
    sections: [
      {
        heading: 'Declare as avarias — todas',
        paragraphs: [
          'Esconder uma avaria não a faz desaparecer: fá-la aparecer na inspeção do comprador (e o negócio cai) ou depois da venda (e o conflito começa). Anúncios com avarias declaradas de forma estruturada geram menos visitas perdidas e compradores mais qualificados.',
        ],
        bullets: [
          'Indique o estado geral: pronto a rodar ou a precisar de manutenção.',
          'Discrimine os tipos de intervenção: mecânica, elétrica, pintura, lataria, interior.',
          'Diga se o carro roda pelos próprios meios e se tem inspeção válida.',
          'Se tiver um orçamento de oficina para a reparação, publique-o — é um poderoso sinal de confiança.',
        ],
      },
      {
        heading: 'Fotografe como um profissional (mesmo com o telemóvel)',
        bullets: [
          'Luz natural, carro lavado, fundo simples.',
          'Cubra todos os ângulos — e fotografe as avarias de perto, sem esconder.',
          'Inclua o quadrante com os quilómetros e o interior.',
          'Mais fotos honestas = menos perguntas repetidas e visitas ao engano.',
        ],
      },
      {
        heading: 'Ponha o preço no sítio certo',
        paragraphs: [
          'O preço de um carro avariado é o valor de mercado do carro em bom estado menos o custo da reparação — menos ainda uma margem que torne o negócio interessante para quem vai meter mãos à obra. Pedir "quase preço de bom" para um carro parado só garante meses de anúncio sem contactos.',
          'Compare com anúncios semelhantes e ajuste ao estado real. Um preço realista desde o início vende em dias; cortes sucessivos ao longo de meses queimam o anúncio.',
        ],
      },
      {
        heading: 'Filtre contactos e venda em segurança',
        bullets: [
          'Responda depressa: os primeiros dias do anúncio concentram a maioria dos interessados.',
          'Receba visitas acompanhado e em local seguro; de dia.',
          'Não entregue documentos nem o carro antes do pagamento confirmado.',
          'Formalize com contrato e requerimento de registo assinados no ato do pagamento.',
        ],
      },
      {
        heading: 'E se ninguém comprar o carro inteiro?',
        paragraphs: [
          'Carros com danos estruturais ou custo de reparação impossível valem frequentemente mais às peças. Publique um anúncio de desmonte: motor, caixa, portas, faróis e interiores têm procura constante — e a soma das partes supera muitas vezes a melhor oferta pelo carro completo.',
        ],
      },
    ],
  },
  {
    slug: 'documentos-compra-venda-carro',
    title: 'Documentos para comprar e vender carro em Portugal',
    description:
      'DUA, registo de propriedade, IUC, seguro e inspeção: os documentos e prazos que compradores e vendedores têm de tratar numa venda entre particulares.',
    category: 'comprar',
    readingMinutes: 6,
    updatedAt: '2026-07-02',
    intro: [
      'A parte burocrática de uma venda entre particulares é simples quando se sabe o que é preciso — e uma dor de cabeça (multas incluídas) quando se deixa ao acaso. Este guia resume documentos, custos e prazos, do lado de quem compra e de quem vende.',
    ],
    sections: [
      {
        heading: 'Os documentos essenciais',
        bullets: [
          'Documento Único Automóvel (DUA) — identifica o carro e o proprietário.',
          'Certidão do registo automóvel — revela ónus: reservas de propriedade, penhoras.',
          'Ficha de inspeção periódica válida (carros com mais de 4 anos).',
          'Documento de identificação de ambas as partes.',
          'Contrato de compra e venda — não é obrigatório, mas protege ambos.',
        ],
      },
      {
        heading: 'O registo de propriedade (o passo que não pode falhar)',
        paragraphs: [
          'A transferência de propriedade faz-se com o requerimento de registo automóvel assinado por comprador e vendedor, entregue online (Automóvel Online), numa conservatória ou num balcão IRN. O prazo legal é de 60 dias após a venda; fora do prazo há coimas.',
          'Vendedor: não entregue o carro sem este requerimento assinado — enquanto o registo não muda, as multas e o IUC continuam em seu nome.',
        ],
      },
      {
        heading: 'Custos e impostos associados',
        bullets: [
          'Registo de propriedade: valor fixo (mais barato online).',
          'IUC (Imposto Único de Circulação): passa a ser devido pelo novo proprietário; confirme se está pago no ano corrente.',
          'Seguro: obrigatório antes de circular — trate da apólice para o dia da compra.',
          'Inspeção: se estiver caducada, o carro não pode circular (exceto para ir à inspeção, com marcação).',
        ],
      },
      {
        heading: 'Contrato de compra e venda: o que deve constar',
        bullets: [
          'Identificação completa de vendedor e comprador.',
          'Identificação do veículo: marca, modelo, matrícula, VIN e quilómetros.',
          'Preço, forma de pagamento e data.',
          'Declaração do estado do veículo e avarias conhecidas — em carros para reparar, anexe a lista declarada no anúncio.',
          'Assinaturas de ambas as partes, com cópia para cada um.',
        ],
      },
      {
        heading: 'Erros frequentes (e como evitá-los)',
        bullets: [
          'Comprar carro com reserva de propriedade ativa — exija a extinção antes ou no ato da venda.',
          'Pagar sem assinar em simultâneo o requerimento de registo.',
          'Vendedor que "fica de tratar do registo" e não trata — acompanhe até ver a propriedade mudada.',
          'Ignorar o IUC em dívida de anos anteriores: a dívida é do proprietário de então, mas complica a vida ao novo.',
        ],
      },
    ],
  },
  {
    slug: 'importar-anuncios-standvirtual',
    title: 'Como importar os seus anúncios do Standvirtual',
    description:
      'Traga os seus anúncios do Standvirtual para o RecarGarage em minutos: cole o link de um anúncio ou importe vários de uma vez, com fotos e ficha técnica.',
    category: 'vender',
    readingMinutes: 4,
    updatedAt: '2026-07-05',
    intro: [
      'Se já anuncia no Standvirtual, não precisa de reescrever tudo à mão. O RecarGarage lê o seu anúncio a partir do link público e recria a ficha — marca, modelo, ano, quilómetros, combustível, caixa, preço, descrição e fotos.',
      'A ferramenta serve tanto particulares como profissionais: basta ter sessão iniciada e o email confirmado. Só deve importar anúncios seus — é pedida uma confirmação de que o anúncio lhe pertence e de que tem direitos sobre as fotografias.',
    ],
    sections: [
      {
        heading: 'Importar um anúncio (pré-preencher o formulário)',
        paragraphs: [
          'Ideal para quem tem um ou dois carros: o anúncio é lido e o formulário de publicação fica pré-preenchido para rever antes de publicar.',
        ],
        bullets: [
          'Abra Anunciar (ou Perfil) e escolha "Importar do Standvirtual".',
          'No modo "Importar 1", cole o link do anúncio (termina em "-ID….html") e confirme que o anúncio é seu.',
          'Toque em "Pré-preencher formulário": vai direto ao formulário de anúncio com os dados e fotos carregados.',
          'Reveja os campos assinalados como "a rever" (valores que não foi possível traduzir automaticamente), complete o que faltar e publique.',
        ],
      },
      {
        heading: 'Importar vários de uma vez (até 25 por lote)',
        paragraphs: [
          'Para quem tem muitos anúncios: junte os links numa lista e a importação cria cada carro como rascunho pendente, um a um, com progresso visível.',
        ],
        bullets: [
          'Adicione os links um a um, cole vários de uma vez (um por linha) ou arraste um ficheiro .txt/.csv — há modelos para descarregar.',
          'Contas profissionais com documentação validada podem colar o endereço da página do stand (ex.: omeustand.standvirtual.com) e a lista de anúncios publicados é preenchida automaticamente.',
          'Cada link é validado na hora: inválidos aparecem a vermelho com o motivo, repetidos e já importados são assinalados.',
          'A importação é propositadamente um a um, com uma pequena pausa entre anúncios, para não sobrecarregar o Standvirtual. Pode cancelar os restantes a qualquer momento.',
          'No fim vê o resumo (criados, já existentes, falhados) e cada anúncio criado tem um atalho "Rever".',
        ],
      },
      {
        heading: 'O que é importado — e o que não é',
        bullets: [
          'Importado: marca, modelo, versão na descrição, ano, quilómetros, combustível, caixa, carroçaria, cor, portas, lugares, potência, cilindrada, localização, preço, descrição, equipamento e fotos (re-alojadas no RecarGarage).',
          'Não importado: o telefone do anúncio de origem — os contactos vêm sempre do seu perfil RecarGarage; atualize-o antes de importar.',
          'Valores que o sistema não reconhece não bloqueiam a importação: o campo fica vazio e é assinalado para rever.',
          'Anúncios importados seguem as regras normais: ficam pendentes até aprovação e mostram o selo "Importado".',
        ],
      },
      {
        heading: 'Problemas comuns',
        bullets: [
          'Link inválido: confirme que copiou o endereço completo do anúncio (tem de terminar em "-ID….html").',
          '"Já importado": cada anúncio só é importado uma vez — repetir a importação não cria duplicados.',
          'Leitura bloqueada: o Standvirtual pode travar temporariamente leituras automáticas; o que já foi criado fica guardado e pode tentar o resto mais tarde.',
          'Anúncio não encontrado: o anúncio pode ter sido removido ou o link ter expirado.',
        ],
      },
    ],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
