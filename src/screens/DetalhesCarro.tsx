'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { getCarroPorId as getCarroPorIdDb, incrementCampo } from '@/lib/db';
import { formatarPreco, renderDescricao } from '@/lib/utils';
import TechnicalSheet from '@/components/detalhes/TechnicalSheet';
import StatusPanel from '@/components/detalhes/StatusPanel';
import ContactSection from '@/components/detalhes/ContactSection';
import GalleryModal from '@/components/detalhes/GalleryModal';
import VinCheckPanel from '@/components/trust/VinCheckPanel';
import PriceIndicatorBadge from '@/components/preco/PriceIndicatorBadge';
import MarketWidget from '@/components/preco/MarketWidget';
import usePriceIndicator from '@/hooks/usePriceIndicator';
import { formatarPreco as fmt } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import ShareButton from '@/components/ui/ShareButton';
import FotoRender from '@/components/ui/FotoRender';
import type { Carro } from '@/types/carro';

export default function DetalhesCarro() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { auth, favoritos } = useApp();
  const { user, isAdmin } = auth;
  const { toggleFavorito, isFavorito } = favoritos;

  const [carro, setCarro] = useState<Carro | null>(null);
  const [loading, setLoading] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const [galeriaAberta, setGaleriaAberta] = useState(false);
  const [indiceGaleria, setIndiceGaleria] = useState(0);

  useEffect(() => {
    async function fetchCarro() {
      if (!id) { setLoading(false); return; }
      const data = await getCarroPorIdDb(id);
      if (!data) {
        setLoading(false);
        return;
      }
      if (data.status !== 'aprovado' && data.criador !== user?.email && !isAdmin) {
        setBloqueado(true);
        setLoading(false);
        return;
      }
      setCarro(data);
      setLoading(false);
      const key = `viewed_car_${id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        incrementCampo('cars', id, 'visualizacoes');
      }
    }
    fetchCarro();
  }, [id, user, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fa-solid fa-spinner fa-spin text-3xl text-accent"></i>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="text-center py-12">
        <i className="fa-solid fa-lock text-4xl text-slate-300 mb-3"></i>
        <p className="font-semibold text-slate-600">Anúncio não disponível</p>
        <p className="text-sm text-slate-400 mt-1">Este anúncio está pendente de aprovação.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-accent hover:text-accent-hover font-semibold text-sm"
        >
          <i className="fa-solid fa-arrow-left mr-1"></i> Voltar à página inicial
        </button>
      </div>
    );
  }

  if (!carro) {
    return (
      <div className="text-center py-12">
        <i className="fa-solid fa-triangle-exclamation text-4xl text-slate-300 mb-3"></i>
        <p className="font-semibold text-slate-600">Anúncio não encontrado</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-accent hover:text-accent-hover font-semibold text-sm"
        >
          <i className="fa-solid fa-arrow-left mr-1"></i> Voltar à página inicial
        </button>
      </div>
    );
  }

  const isLowCost = carro.preco <= 2000;
  const priceInfo = usePriceIndicator(carro);

  return (
    <div className="page-enter">
      <button
        onClick={() => router.back()}
        className="mb-3 text-brand-700 hover:text-accent font-semibold text-sm flex items-center gap-1"
      >
        <i className="fa-solid fa-arrow-left"></i> Voltar
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-900">
              {carro.marca} {carro.modelo}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {carro.anoFabricacao} • {carro.km?.toLocaleString('pt-PT')} km • {carro.local || 'Portugal'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLowCost && <Badge cor="accent">Low-Cost</Badge>}
            {carro.status === 'pendente' && <Badge cor="yellow">Pendente</Badge>}
            {carro.status === 'rejeitado' && <Badge cor="red">Rejeitado</Badge>}
            <button
              onClick={() => toggleFavorito(carro.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1 ${
                isFavorito(carro.id)
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <i className={`fa-solid fa-heart ${isFavorito(carro.id) ? '' : 'text-slate-400'}`}></i>
              {isFavorito(carro.id) ? 'Favorito' : 'Favoritar'}
            </button>
            <ShareButton
              title={`${carro.marca} ${carro.modelo} - ReparAuto`}
              text={`${carro.marca} ${carro.modelo} ${carro.anoFabricacao} - ${formatarPreco(carro.preco)}`}
            />
          </div>
        </div>

        {carro.fotos && carro.fotos.length > 0 && (
          <div className="mb-6">
            <div
              className="w-full h-56 sm:h-80 rounded-xl overflow-hidden bg-slate-200 cursor-pointer relative group"
              onClick={() => { setIndiceGaleria(0); setGaleriaAberta(true); }}
            >
              <FotoRender foto={carro.fotos[0]} classes="w-full h-full object-cover" />
              {carro.fotos.length > 1 && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                  <span className="text-white bg-black/50 px-3 py-1.5 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                    <i className="fa-solid fa-expand mr-1"></i> Ver {carro.fotos.length} fotos
                  </span>
                </div>
              )}
            </div>
            {carro.fotos.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
                {carro.fotos.slice(1, 5).map((foto, i) => (
                  <div
                    key={i}
                    className="w-20 h-16 rounded-lg overflow-hidden bg-slate-200 cursor-pointer flex-shrink-0 hover:opacity-80 transition"
                    onClick={() => { setIndiceGaleria(i + 1); setGaleriaAberta(true); }}
                  >
                    <FotoRender foto={foto} classes="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="flex-1">
            {carro.estadoVeiculo === 'manutencao' && (
              <div className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <i className="fa-solid fa-tools"></i>
                Este veículo precisa de manutenção/reparações
              </div>
            )}
          </div>
          <StatusPanel carro={carro} />
        </div>

        {carro.descricao && (
          <div className="mb-6">
            <h3 className="font-extrabold text-brand-900 mb-2 flex items-center gap-2">
              <i className="fa-solid fa-align-left text-accent"></i> Descrição
            </h3>
            <div
              className="text-sm text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderDescricao(carro.descricao) }}
            />
          </div>
        )}

        {priceInfo.indicator !== 'indisponivel' && (
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-brand-900 flex items-center gap-2 mb-1">
                  <i className="fa-solid fa-chart-line text-accent"></i>
                  Análise de preço
                </h3>
                <p className="text-xs text-slate-500">
                  Comparado com {priceInfo.sampleSize}{' '}
                  {priceInfo.sampleSize === 1 ? 'anúncio similar' : 'anúncios similares'} no ReparAuto.
                </p>
              </div>
              <PriceIndicatorBadge
                indicator={priceInfo.indicator}
                deviation={priceInfo.deviation}
                sampleSize={priceInfo.sampleSize}
              />
            </div>
            {priceInfo.stats && (
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                <div className="bg-white rounded-lg p-2">
                  <p className="text-[10px] text-slate-500">Mínimo</p>
                  <p className="font-bold text-green-600">{fmt(priceInfo.stats.min)}</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <p className="text-[10px] text-slate-500">Mediana do mercado</p>
                  <p className="font-bold text-brand-900">{fmt(priceInfo.stats.median)}</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <p className="text-[10px] text-slate-500">Máximo</p>
                  <p className="font-bold text-red-600">{fmt(priceInfo.stats.max)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <MarketWidget marca={carro.marca} modelo={carro.modelo} title="Ver mercado deste modelo" />
        </div>

        <TechnicalSheet carro={carro} />

        <div className="mt-6">
          <ContactSection carro={carro} />
        </div>

        <div className="mt-6">
          <VinCheckPanel />
        </div>
      </div>

      <GalleryModal
        show={galeriaAberta}
        onClose={() => setGaleriaAberta(false)}
        fotos={carro.fotos}
        indiceInicial={indiceGaleria}
      />
    </div>
  );
}
