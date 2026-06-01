import type { Metadata } from 'next';
import Script from 'next/script';
import FaqSection from '@/components/home/FaqSection';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Perguntas Frequentes (FAQ)',
  description:
    'Esclareça as suas dúvidas sobre a compra e venda de carros usados baratos, viaturas low-cost e peças auto em Portugal no RecarGarage.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'Perguntas Frequentes (FAQ) · RecarGarage',
    description:
      'Esclareça as suas dúvidas sobre a compra e venda de carros usados baratos, viaturas low-cost e peças auto em Portugal no RecarGarage.',
    url: '/faq',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'Onde encontrar carros baratos e low-cost em Portugal?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'No RecarGarage, somos especialistas em agregar anúncios de carros usados baratos, viaturas low-cost e carros para reparar em Portugal. Nosso marketplace permite que encontre negócios a começar abaixo de 500€, ideal para quem procura um projeto de reparação ou um meio de transporte económico.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Como funciona a venda de peças de carros em Portugal no site?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Oferecemos uma secção dedicada inteiramente a peças auto e desmonte. Vendedores particulares e profissionais de desmantelamento listam peças originais usadas para variadas marcas e modelos. Pode pesquisar pela categoria da peça e contactar diretamente o anunciante para fechar o negócio de forma segura.'
      }
    },
    {
      '@type': 'Question',
      'name': 'É seguro comprar viaturas usadas e peças no RecarGarage?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Fornecemos uma plataforma transparente onde compradores e vendedores entram em contacto direto. Recomendamos sempre verificar o veículo ou a peça pessoalmente em Portugal antes de realizar qualquer pagamento. Além disso, leia as nossas diretrizes de segurança no rodapé para dicas de negociação segura.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Como posso anunciar o meu carro usado ou peças auto?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Anunciar no RecarGarage é extremamente simples e rápido. Basta clicar no botão "Anunciar" no menu superior, preencher os detalhes da viatura ou peça (como marca, modelo, ano, quilometragem, preço e fotos) e publicar. O seu anúncio ficará disponível para milhares de compradores interessados em Portugal.'
      }
    }
  ]
};

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqSection />
    </div>
  );
}
