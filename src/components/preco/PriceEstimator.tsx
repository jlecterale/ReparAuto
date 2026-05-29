'use client';

import { useMemo, useState } from 'react';
import usePriceEstimate from '@/hooks/usePriceEstimate';
import { formatarPreco } from '@/lib/utils';
import marcasModelos from '@/data/marcas-modelos.json';
import { TIPOS_COMBUSTIVEL, TIPOS_CAMBIO } from '@/lib/constants';

interface MarcaModelo {
  marca: string;
  modelos: string[];
}

const ANO_ATUAL = new Date().getFullYear();

export default function PriceEstimator() {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState<string>('');
  const [km, setKm] = useState<string>('');
  const [combustivel, setCombustivel] = useState('');
  const [cambio, setCambio] = useState('');

  const lista = marcasModelos as MarcaModelo[];
  const marcas = useMemo(() => lista.map((m) => m.marca).sort(), [lista]);
  const modelos = useMemo(() => {
    const found = lista.find((m) => m.marca === marca);
    return found ? found.modelos : [];
  }, [lista, marca]);

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
    alta: 'text-green-700 bg-green-50 border-green-200',
    media: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    baixa: 'text-slate-600 bg-slate-50 border-slate-200',
  }[estimate.confidence];

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Marca</label>
          <select
            value={marca}
            onChange={(e) => {
              setMarca(e.target.value);
              setModelo('');
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Selecionar marca</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Modelo</label>
          <select
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            disabled={!marca}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">Selecionar modelo</option>
            {modelos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Ano</label>
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            min={1980}
            max={ANO_ATUAL + 1}
            placeholder={String(ANO_ATUAL - 5)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Quilómetros</label>
          <input
            type="number"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            min={0}
            placeholder="120000"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Combustível</label>
          <select
            value={combustivel}
            onChange={(e) => setCombustivel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Qualquer</option>
            {TIPOS_COMBUSTIVEL.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Caixa</label>
          <select
            value={cambio}
            onChange={(e) => setCambio(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Qualquer</option>
            {TIPOS_CAMBIO.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!input ? (
        <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
          <i className="fa-solid fa-circle-info mr-2"></i>
          Preencha marca, modelo e ano para receber uma estimativa.
        </div>
      ) : estimate.sampleSize === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-200 rounded-xl">
          <i className="fa-solid fa-magnifying-glass text-2xl mb-2 text-slate-300"></i>
          <p>Não encontrámos anúncios suficientes para este modelo.</p>
          <p className="text-xs text-slate-400 mt-1">Tente um ano próximo ou outro modelo.</p>
        </div>
      ) : (
        <>
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 text-center">
            <p className="text-xs text-slate-600 mb-2">Estimativa de mercado</p>
            <p className="text-3xl sm:text-4xl font-extrabold text-accent">
              {formatarPreco(estimate.estimate)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Intervalo provável: <strong>{formatarPreco(estimate.rangeMin)}</strong> –{' '}
              <strong>{formatarPreco(estimate.rangeMax)}</strong>
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px]">
              <span className={`px-2 py-1 rounded-full border ${confidenceColor}`}>
                Confiança {estimate.confidence}
              </span>
              <span className="text-slate-500">
                {estimate.sampleSize} {estimate.sampleSize === 1 ? 'anúncio similar' : 'anúncios similares'}
              </span>
            </div>
          </div>

          {estimate.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-center text-xs">
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-[10px] text-slate-500">Mínimo</p>
                <p className="font-bold text-slate-700">{formatarPreco(estimate.stats.min)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-[10px] text-slate-500">Mediana</p>
                <p className="font-bold text-slate-700">{formatarPreco(estimate.stats.median)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-[10px] text-slate-500">Média</p>
                <p className="font-bold text-slate-700">{formatarPreco(Math.round(estimate.stats.mean))}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-[10px] text-slate-500">Máximo</p>
                <p className="font-bold text-slate-700">{formatarPreco(estimate.stats.max)}</p>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-slate-400 mt-4 text-center">
        <i className="fa-solid fa-circle-info mr-1"></i>
        Estimativa indicativa, baseada em anúncios aprovados no ReparAuto. Não substitui uma avaliação profissional.
      </p>
    </div>
  );
}
