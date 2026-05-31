'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, 
  Phone, 
  WhatsappLogo, 
  EnvelopeSimple, 
  Globe, 
  MapPin, 
  Star, 
  User,
  Wrench,
  ChatCircleDots
} from '@phosphor-icons/react';
import { getOficinaPorId, addReview, subscribeReviewsOficina } from '@/lib/db';
import type { OficinaMecanico } from '@/types/oficina';
import { ESPECIALIDADES_LABELS } from '@/types/oficina';
import type { Review } from '@/types/review';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import UserAvatar from '@/components/ui/UserAvatar';

// Dynamically import MapViewer to prevent SSR errors
const MapViewer = dynamic(() => import('@/components/ui/MapViewer'), {
  ssr: false,
  loading: () => <div className="h-64 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-2xl flex items-center justify-center text-sm text-neutral-400">A carregar mapa...</div>
});

interface DetalhesOficinaProps {
  id: string;
}

export default function DetalhesOficina({ id }: DetalhesOficinaProps) {
  const router = useRouter();
  const { auth } = useApp();
  const { user } = auth;
  const toast = useToast();

  const [oficina, setOficina] = useState<OficinaMecanico | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviandoReview, setEnviandoReview] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const dados = await getOficinaPorId(id);
        if (dados) {
          setOficina(dados);
        } else {
          toast?.erro('Oficina não encontrada.');
          router.push('/oficinas');
        }
      } catch (err) {
        console.error(err);
        toast?.erro('Erro ao carregar dados da oficina.');
      } finally {
        setLoading(false);
      }
    }

    carregarDados();

    // Subscribe to reviews
    const unsub = subscribeReviewsOficina(
      id,
      (data) => {
        setReviews(data);
      },
      (err) => {
        console.error(err);
      }
    );

    return unsub;
  }, [id, router, toast]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast?.erro('Faça login para deixar uma avaliação.');
      router.push('/perfil');
      return;
    }

    if (user.email === oficina?.criador) {
      toast?.erro('Não pode avaliar a sua própria oficina.');
      return;
    }

    if (!comentario) {
      toast?.erro('Por favor, escreva um comentário.');
      return;
    }

    setEnviandoReview(true);

    try {
      await addReview({
        autorUid: user.uid,
        autorNome: user.nome,
        autorFoto: user.foto || null,
        vendedorUid: '', // Not strictly a seller profile
        vendedorEmail: oficina?.criador || '',
        anuncioId: id,
        anuncioTipo: 'oficina',
        nota,
        comentario,
      });

      toast?.sucesso('Avaliação enviada com sucesso! Irá aparecer após aprovação.');
      setComentario('');
      setNota(5);
    } catch (err) {
      console.error(err);
      toast?.erro('Erro ao enviar avaliação.');
    } finally {
      setEnviandoReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center animate-pulse">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4 mx-auto mb-4" />
        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3 mx-auto" />
      </div>
    );
  }

  if (!oficina) {
    return null;
  }

  // Calculate media of reviews displayed if any, else default to database value or 5.0
  const ratingMedia = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.nota, 0) / reviews.length 
    : (oficina.mediaAvaliacoes || 5.0);

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/oficinas')}
        className="flex items-center gap-2 text-sm font-semibold text-fg-subtle hover:text-fg transition mb-6 cursor-pointer"
      >
        <ArrowLeft size={16} /> Voltar para o Diretório
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Left Column: Workshop details */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center font-bold text-2xl border border-brand-100 dark:border-brand-900 shrink-0">
                  {oficina.logoUrl ? (
                    <img src={oficina.logoUrl} alt={oficina.nome} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    oficina.nome.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-fg-strong tracking-tight">{oficina.nome}</h1>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-fg-subtle">
                    <MapPin size={16} className="text-neutral-400" />
                    <span>{oficina.morada}, {oficina.localidade}, {oficina.distrito}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center text-amber-500">
                      <Star size={16} weight="fill" />
                    </div>
                    <span className="text-sm font-bold text-fg-strong">{ratingMedia.toFixed(1)}</span>
                    <span className="text-xs text-fg-subtle">({reviews.length} avaliações aprovadas)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Specialties */}
            <div className="py-6 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="text-sm font-bold text-fg-subtle uppercase tracking-wider mb-3">Especialidades do Profissional</h2>
              <div className="flex flex-wrap gap-2">
                {oficina.especialidades.map((esp) => (
                  <Badge key={esp} cor="brand" variante="soft" className="text-xs px-3 py-1 font-semibold">
                    {ESPECIALIDADES_LABELS[esp]}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="py-6">
              <h2 className="text-sm font-bold text-fg-subtle uppercase tracking-wider mb-3">Sobre a Oficina / Serviços</h2>
              <p className="text-sm sm:text-base text-fg-subtle leading-relaxed whitespace-pre-wrap">
                {oficina.descricao}
              </p>
            </div>
          </div>

          {/* Location Map */}
          {oficina.coordenadas && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-bold text-fg-strong mb-4">Localização Geográfica</h2>
              <MapViewer lat={oficina.coordenadas.latitude} lng={oficina.coordenadas.longitude} />
            </div>
          )}

          {/* Reviews section */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-fg-strong">Avaliações do Profissional</h2>

            {/* Review Form */}
            {user?.email !== oficina.criador ? (
              <form onSubmit={handleSubmitReview} className="bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl p-5 border border-neutral-150 dark:border-neutral-800">
                <h3 className="text-sm font-bold text-fg-strong mb-3">Deixe a sua avaliação</h3>
                
                {/* Stars selector */}
                <div className="flex items-center gap-1.5 mb-4">
                  <span className="text-xs text-fg-subtle mr-2">Nota:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNota(star)}
                      className="text-amber-500 hover:scale-110 transition cursor-pointer"
                    >
                      <Star size={24} weight={star <= nota ? 'fill' : 'regular'} />
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder="Escreva a sua avaliação sobre o serviço prestado, pontualidade, simpatia e qualidade..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                  <Button
                    type="submit"
                    tipo="primario"
                    carregando={enviandoReview}
                    className="w-full sm:w-auto font-bold px-6"
                  >
                    Enviar Avaliação
                  </Button>
                </div>
              </form>
            ) : (
              <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl p-4 text-center border border-neutral-150 dark:border-neutral-800 text-xs text-fg-subtle">
                Como proprietário desta oficina, não pode submeter avaliações para o seu próprio perfil.
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4 pt-2">
              {reviews.length === 0 ? (
                <p className="text-sm text-fg-subtle text-center py-6">Ainda não existem avaliações aprovadas para este profissional.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={{ nome: review.autorNome, foto: review.autorFoto } as any} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-fg-strong">{review.autorNome}</p>
                          <div className="flex items-center text-amber-500 gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} size={12} weight={star <= review.nota ? 'fill' : 'regular'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-fg-subtle">
                        {review.dataCriacao?.toDate?.() ? new Date(review.dataCriacao.toDate()).toLocaleDateString('pt-PT') : ''}
                      </span>
                    </div>
                    <p className="text-sm text-fg-subtle mt-2 leading-relaxed pl-11">
                      {review.comentario}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Contact info & metadata */}
        <div className="space-y-6">
          {/* Action contacts Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-fg-strong">Contactar Profissional</h2>
            
            <div className="space-y-3 pt-2">
              {/* Call */}
              <a
                href={`tel:${oficina.telefone}`}
                className="flex items-center justify-center gap-3 w-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-fg-strong font-bold py-3.5 px-4 rounded-xl text-sm transition"
              >
                <Phone size={18} weight="fill" className="text-brand-600" />
                Ligar para Oficina
              </a>

              {/* WhatsApp */}
              {oficina.whatsapp && (
                <a
                  href={`https://wa.me/${oficina.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-md shadow-green-500/10"
                >
                  <WhatsappLogo size={20} weight="fill" />
                  Enviar WhatsApp
                </a>
              )}

              {/* Email */}
              <a
                href={`mailto:${oficina.email}`}
                className="flex items-center justify-center gap-3 w-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-fg-strong font-bold py-3.5 px-4 rounded-xl text-sm transition"
              >
                <EnvelopeSimple size={18} weight="bold" className="text-neutral-500" />
                Enviar Email
              </a>

              {/* Website */}
              {oficina.website && (
                <a
                  href={oficina.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-fg-strong font-bold py-3.5 px-4 rounded-xl text-sm transition"
                >
                  <Globe size={18} />
                  Visitar Website
                </a>
              )}
            </div>
          </div>

          {/* Details Metadata Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-fg-strong mb-4">Informação de Registo</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-fg-subtle">Responsável</span>
                <span className="font-semibold text-fg-strong">{oficina.responsavel}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-fg-subtle">Distrito</span>
                <span className="font-semibold text-fg-strong">{oficina.distrito}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-fg-subtle">Concelho</span>
                <span className="font-semibold text-fg-strong">{oficina.localidade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-subtle">Membro desde</span>
                <span className="font-semibold text-fg-strong">
                  {oficina.dataCriacao?.toDate?.() ? new Date(oficina.dataCriacao.toDate()).toLocaleDateString('pt-PT') : 'Recente'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
