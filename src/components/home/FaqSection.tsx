'use client';

import { useState } from 'react';
import { CaretDown, Question } from '@phosphor-icons/react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Onde encontrar carros baratos e low-cost em Portugal?',
    answer: 'No RecarGarage, somos especialistas em agregar anúncios de carros usados baratos, viaturas low-cost e carros para reparar em Portugal. Nosso marketplace permite que encontre negócios a começar abaixo de 500€, ideal para quem procura um projeto de reparação ou um meio de transporte económico.',
  },
  {
    question: 'Como funciona a venda de peças de carros em Portugal no site?',
    answer: 'Oferecemos uma secção dedicada inteiramente a peças auto e desmonte. Vendedores particulares e profissionais de desmantelamento listam peças originais usadas para variadas marcas e modelos. Pode pesquisar pela categoria da peça e contactar diretamente o anunciante para fechar o negócio de forma segura.',
  },
  {
    question: 'É seguro comprar viaturas usadas e peças no RecarGarage?',
    answer: 'Fornecemos uma plataforma transparente onde compradores e vendedores entram em contacto direto. Recomendamos sempre verificar o veículo ou a peça pessoalmente em Portugal antes de realizar qualquer pagamento. Além disso, leia as nossas diretrizes de segurança no rodapé para dicas de negociação segura.',
  },
  {
    question: 'Como posso anunciar o meu carro usado ou peças auto?',
    answer: 'Anunciar no RecarGarage é extremamente simples e rápido. Basta clicar no botão "Anunciar" no menu superior, preencher os detalhes da viatura ou peça (como marca, modelo, ano, quilometragem, preço e fotos) e publicar. O seu anúncio ficará disponível para milhares de compradores interessados em Portugal.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-8 mt-10 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
          <Question size={24} weight="bold" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">
            Perguntas Frequentes (FAQ)
          </h2>
          <p className="text-sm text-zinc-500">
            Tudo o que precisa de saber sobre carros baratos, usados e peças em Portugal
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border-b border-zinc-100 last:border-0 pb-4 last:pb-0"
            >
              <button
                onClick={() => toggleIndex(idx)}
                className="w-full flex items-center justify-between text-left py-2 font-semibold text-zinc-800 hover:text-brand-600 transition-colors focus:outline-none"
                aria-expanded={isOpen}
              >
                <span className="text-base sm:text-lg">{item.question}</span>
                <CaretDown
                  size={18}
                  className={`transform transition-transform duration-300 text-zinc-400 ${
                    isOpen ? 'rotate-180 text-brand-600' : ''
                  }`}
                  weight="bold"
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? 'max-h-48 mt-2 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
