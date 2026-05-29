'use client';

import { Calculator, Lightbulb } from '@phosphor-icons/react';
import PriceEstimator from '@/components/preco/PriceEstimator';

export default function AvaliarVeiculo() {
  return (
    <div className="page-enter max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-fg-heading flex items-center justify-center gap-2">
          <Calculator className="text-accent" /> Avaliar veículo
        </h1>
        <p className="text-sm text-fg-muted mt-2">
          Indique a marca, modelo e ano para obter uma estimativa de preço com base nos anúncios reais do ReparAuto.
        </p>
      </div>

      <PriceEstimator />

      <div className="mt-6 bg-primary-50 border border-primary-100 rounded-2xl p-5 text-sm text-fg-strong">
        <h2 className="font-bold text-fg-heading mb-2 flex items-center gap-2">
          <Lightbulb className="text-accent" /> Como funciona
        </h2>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>Procuramos anúncios aprovados com a mesma marca e modelo (ou modelos próximos).</li>
          <li>Calculamos a mediana e o intervalo central de preços (P25–P75).</li>
          <li>Excluímos outliers (1.5×IQR) para o valor não ser distorcido por anúncios fora do mercado.</li>
          <li>Ajustamos a estimativa ao número de quilómetros indicado.</li>
          <li>A confiança aumenta com o número de anúncios similares encontrados.</li>
        </ul>
      </div>
    </div>
  );
}
