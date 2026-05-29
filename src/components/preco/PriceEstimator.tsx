'use client';

import { useState } from 'react';
import { Info, MagnifyingGlass } from '@phosphor-icons/react';
import usePriceEstimate from '@/hooks/usePriceEstimate';
import { formatarPreco } from '@/lib/utils';
import { PRICE_DISCLAIMERS, PRICE_THRESHOLDS, TIPOS_CAMBIO, TIPOS_COMBUSTIVEL } from '@/lib/constants';
import Alert from '@/components/ui/Alert';
import BrandModelSelect from '@/components/preco/BrandModelSelect';

const ANO_ATUAL = new Date().getFullYear();

export default function PriceEstimator() {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState<string>('');
  const [km, setKm] = useState<string>('');
  const [combustivel, setCombustivel] = useState('');
  const [cambio, setCambio] = useState('');

  const input = marca && modelo && ano
    ? {
        marca,
        modelo,
        ano: Number(ano),
        km: km ? Number(km) : undefined,
        combustivel: combustivel || undefined,
        cambio: cambio || undefined,
      }
    : null;

  const estimate = usePriceEstimate(input);

  const confidenceColor = {
    alta: 'text-success-700 bg-success-50 border-success-200',
    media: 'text-warning-700 bg-warning-50 border-warning-200',
    baixa: 'text-fg-muted bg-neutral-50 border-neutral-200',
  }[estimate.confidence];

  const showLowConfidenceWarning =
    estimate.sampleSize > 0 && estimate.sampleSize < PRICE_THRESHOLDS.lowConfidenceSampleSize;

  const fieldClass =
    'w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30';
  const labelClass = 'block text-xs font-bold text-fg mb-1';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <BrandModelSelect
          marca={marca}
          modelo={modelo}
          onMarcaChange={setMarca}
          onModeloChange={setModelo}
          required
        />

        <div>
          <label htmlFor="ano-input" className={labelClass}>Ano</label>
          <input
            id="ano-input"
            type="number"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            min={1980}
            max={ANO_ATUAL + 1}
            placeholder={String(ANO_ATUAL - 5)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="km-input" className={labelClass}>Quilómetros</label>
          <input
            id="km-input"
            type="number"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            min={0}
            placeholder="120000"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="combustivel-select" className={labelClass}>Combustível</label>
          <select
            id="combustivel-select"
            value={combustivel}
            onChange={(e) => setCombustivel(e.target.value)}
            className={fieldClass}
          >
            <option value="">Qualquer</option>
            {TIPOS_COMBUSTIVEL.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cambio-select" className={labelClass}>Caixa</label>
          <select
            id="cambio-select"
            value={cambio}
            onChange={(e) => setCambio(e.target.value)}
            className={fieldClass}
          >
            <option value="">Qualquer</option>
            {TIPOS_CAMBIO.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {!input ? (
        <div className="flex flex-col items-center justify-center text-center py-10 text-fg-muted text-sm border border-dashed border-neutral-200 rounded-xl">
          <Info size={28} className="mb-2 text-fg-subtle" />
          <p>Preencha marca, modelo e ano para receber uma estimativa.</p>
        </div>
      ) : estimate.sampleSize === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10 text-fg-muted text-sm border border-dashed border-neutral-200 rounded-xl">
          <MagnifyingGlass size={28} className="mb-2 text-fg-subtle" />
          <p>Não encontrámos anúncios suficientes para este modelo.</p>
          <p className="text-xs text-fg-subtle mt-1">Tente um ano próximo ou outro modelo.</p>
        </div>
      ) : (
        <>
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 text-center">
            <p className="text-xs text-fg-muted mb-2">Intervalo de mercado</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-accent leading-tight">
              {formatarPreco(estimate.rangeMin)} – {formatarPreco(estimate.rangeMax)}
            </p>
            <p className="text-xs text-fg-muted mt-3">
              Estimativa central: <strong className="text-fg-strong">{formatarPreco(estimate.estimate)}</strong>
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] flex-wrap">
              <span className={`px-2 py-1 rounded-full border ${confidenceColor}`}>
                Confiança {estimate.confidence}
              </span>
              <span className="text-fg-muted">
                {estimate.sampleSize}{' '}
                {estimate.sampleSize === 1 ? 'anúncio similar' : 'anúncios similares'}
              </span>
            </div>
          </div>

          {estimate.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-center text-xs">
              <div className="bg-neutral-50 rounded-lg p-2">
                <p className="text-[10px] text-fg-muted">Mínimo</p>
                <p className="font-bold text-fg-strong">{formatarPreco(estimate.stats.min)}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-2">
                <p className="text-[10px] text-fg-muted">Mediana</p>
                <p className="font-bold text-fg-strong">{formatarPreco(estimate.stats.median)}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-2">
                <p className="text-[10px] text-fg-muted">Média</p>
                <p className="font-bold text-fg-strong">{formatarPreco(Math.round(estimate.stats.mean))}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-2">
                <p className="text-[10px] text-fg-muted">Máximo</p>
                <p className="font-bold text-fg-strong">{formatarPreco(estimate.stats.max)}</p>
              </div>
            </div>
          )}

          {showLowConfidenceWarning && (
            <Alert tipo="aviso" icone={<Info />} className="mt-3 !text-xs">
              {PRICE_DISCLAIMERS.lowConfidence}
            </Alert>
          )}
        </>
      )}

      <p className="text-[10px] text-fg-muted mt-4 leading-relaxed flex gap-1">
        <Info size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
        <span>{PRICE_DISCLAIMERS.estimator}</span>
      </p>
    </div>
  );
}
