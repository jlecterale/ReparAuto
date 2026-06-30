'use client';

import { ArrowLeft, ArrowsOut, CircleNotch, Heart, Lock, PencilSimpleLine, TextAlignLeft, Trash, Warning, Wrench, YoutubeLogo } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { getCarroPorId as getCarroPorIdDb, incrementCampo, updateCarro, deleteCarro } from '@/lib/db';
import { formatarPreco, renderDescricao } from '@/lib/utils';
import TechnicalSheet from '@/components/detalhes/TechnicalSheet';
import ContactSection from '@/components/detalhes/ContactSection';
import GalleryModal from '@/components/detalhes/GalleryModal';
import CompatibleParts from '@/components/pecas/CompatibleParts';
import VinCheckPanel from '@/components/trust/VinCheckPanel';
import FinanciamentoSeguroWidget from '@/components/detalhes/FinanciamentoSeguroWidget';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ShareButton from '@/components/ui/ShareButton';
import FotoRender from '@/components/ui/FotoRender';
import YoutubeEmbed from '@/components/ui/YoutubeEmbed';
import EditarCarroModal from '@/components/admin/EditarCarroModal';
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleSaveCarro = async (id: string, dados: Record<string, unknown>) => {
    await updateCarro(id, { ...dados, status: 'pendente' });
    setEditModalOpen(false);
    const data = await getCarroPorIdDb(id);
    if (data) setCarro(data);
  };

  const handleDelete = async () => {
    if (!carro) return;
    setDeleting(true);
    try {
      await deleteCarro(carro.id);
      router.push('/app');
    } catch (err) {
      console.error('[Detalhes] Erro ao eliminar:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CircleNotch className="animate-spin text-3xl text-accent" />
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="text-center py-12">
        <Lock className="text-4xl text-slate-300 mb-3" />
        <p className="font-semibold text-fg-muted">Anúncio não disponível</p>
        <p className="text-sm text-fg-subtle mt-1">Este anúncio está pendente de aprovação.</p>
        <Button
          tipo="terciario"
          tamanho="sm"
          icone={<ArrowLeft />}
          onClick={() => router.push('/app')}
          className="mt-4"
        >
          Voltar à página inicial
        </Button>
      </div>
    );
  }

  if (!carro) {
    return (
      <div className="text-center py-12">
        <Warning className="text-4xl text-slate-300 mb-3" />
        <p className="font-semibold text-fg-muted">Anúncio não encontrado</p>
        <Button
          tipo="terciario"
          tamanho="sm"
          icone={<ArrowLeft />}
          onClick={() => router.push('/app')}
          className="mt-4"
        >
          Voltar à página inicial
        </Button>
      </div>
    );
  }

  const isLowCost = carro.preco <= 2000;

  return (
    <div className="page-enter">
      <Button
        tipo="terciario"
        tamanho="sm"
        icone={<ArrowLeft />}
        onClick={() => router.back()}
        className="mb-3"
      >
        Voltar
      </Button>

      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-fg-heading">
              {carro.marca} {carro.modelo}
            </h1>
            <p className="text-fg-subtle text-sm mt-1">
              {carro.anoFabricacao} • {carro.km?.toLocaleString('pt-PT')} km • {carro.local || 'Portugal'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-accent">
                {formatarPreco(carro.preco)}
              </span>
              {isLowCost && <Badge cor="accent" variante="solid">Low-Cost</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {carro.status === 'pendente' && <Badge cor="yellow">Pendente</Badge>}
            {carro.status === 'rejeitado' && <Badge cor="red">Rejeitado</Badge>}
            <button
              onClick={() => toggleFavorito(carro.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1 ${
                isFavorito(carro.id)
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-fg-muted border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Heart weight={isFavorito(carro.id) ? 'fill' : 'regular'} className={isFavorito(carro.id) ? '' : 'text-slate-400'} />
              {isFavorito(carro.id) ? 'Favorito' : 'Favoritar'}
            </button>
            <ShareButton
              title={`${carro.marca} ${carro.modelo} - RecarGarage`}
              text={`${carro.marca} ${carro.modelo} ${carro.anoFabricacao} - ${formatarPreco(carro.preco)}`}
            />
            {(carro.criador === user?.email || isAdmin) && (
              <>
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 transition flex items-center gap-1"
                >
                  <PencilSimpleLine /> Editar
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center gap-1"
                >
                  <Trash /> Eliminar
                </button>
              </>
            )}
          </div>
        </div>

        {carro.fotos && carro.fotos.length > 0 && (
          <div className="mb-6">
            <div
              className="w-full h-56 sm:h-80 rounded-xl overflow-hidden bg-slate-100 cursor-pointer relative group"
              onClick={() => { setIndiceGaleria(0); setGaleriaAberta(true); }}
            >
              {/* Blurred backdrop fills the letterbox area so the contained photo never shows bare gray bars */}
              <FotoRender foto={carro.fotos[0]} classes="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60" />
              {/* Full photo, fit to height without cropping */}
              <FotoRender foto={carro.fotos[0]} classes="relative w-full h-full object-contain" />
              {carro.fotos.length > 1 && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                  <span className="text-white bg-black/50 px-3 py-1.5 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                    <ArrowsOut className="mr-1" /> Ver {carro.fotos.length} fotos
                  </span>
                </div>
              )}
            </div>
            {carro.fotos.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
                {carro.fotos.slice(1).map((foto, i) => (
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

        <div className="mb-6">
          {carro.estadoVeiculo === 'manutencao' && (
            <Alert tipo="aviso" icone={<Wrench size={18} />} className="!p-3 !rounded-lg !items-center font-semibold">
              Este veículo precisa de manutenção/reparações
            </Alert>
          )}
        </div>

        {carro.descricao && (
          <div className="mb-6">
            <h3 className="font-extrabold text-fg-heading mb-2 flex items-center gap-2">
              <TextAlignLeft className="text-accent" /> Descrição
            </h3>
            <div
              className="text-sm text-fg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderDescricao(carro.descricao) }}
            />
          </div>
        )}

        {carro.videoUrl && (
          <div className="mb-6">
            <h3 className="font-extrabold text-fg-heading mb-2 flex items-center gap-2">
              <YoutubeLogo weight="fill" className="text-red-600" /> Vídeo
            </h3>
            <YoutubeEmbed url={carro.videoUrl} title={`Vídeo do ${carro.marca} ${carro.modelo}`} />
          </div>
        )}

        <TechnicalSheet carro={carro} />

        <div className="mt-6">
          <ContactSection carro={carro} />
        </div>

        <FinanciamentoSeguroWidget
          carroPreco={carro.preco}
          carroId={carro.id}
          carroTitulo={`${carro.marca} ${carro.modelo}`}
          defaultNome={user?.nome}
          defaultEmail={user?.email}
          defaultTelefone={user?.telefone}
        />

        <div className="mt-6">
          <VinCheckPanel />
        </div>

        <div className="mt-6">
          <CompatibleParts carro={carro} />
        </div>
      </div>

      {editModalOpen && carro && (
        <EditarCarroModal
          show
          carro={carro}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveCarro}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h4 className="font-bold text-fg-heading mb-2">Eliminar Anúncio</h4>
            <p className="text-sm text-fg-muted mb-4">
              Tem certeza que deseja eliminar <strong>{carro.marca} {carro.modelo}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <Button tipo="secundario" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancelar
              </Button>
              <Button tipo="perigo" icone={<Trash />} onClick={handleDelete} disabled={deleting} carregando={deleting}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      <GalleryModal
        show={galeriaAberta}
        onClose={() => setGaleriaAberta(false)}
        fotos={carro.fotos}
        indiceInicial={indiceGaleria}
      />
    </div>
  );
}
