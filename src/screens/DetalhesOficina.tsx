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
  ChatCircleDots,
  SignIn,
  PencilSimple,
} from '@phosphor-icons/react';
import { getOficinaPorId, addReview, updateReview, subscribeReviewsOficina, getReviewById } from '@/lib/db';
import YoutubeEmbed from '@/components/ui/YoutubeEmbed';
import type { OficinaMecanico } from '@/types/oficina';
import { ESPECIALIDADES_LABELS } from '@/types/oficina';
import type { Review, ReviewInput } from '@/types/review';
import { getReviewId } from '@/types/review';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import ReviewFormStructured from '@/components/trust/ReviewFormStructured';
import ReviewCriteriosBar from '@/components/trust/ReviewCriteriosBar';
import UserAvatar from '@/components/ui/UserAvatar';
import Badge from '@/components/ui/Badge';

// Dynamically import MapViewer to prevent SSR errors
const MapViewer = dynamic(() => import('@/components/ui/MapViewer'), {
  ssr: false,
  loading: () => <div className="h-64 bg-neutral-100 animate-pulse rounded-2xl flex items-center justify-center text-sm text-neutral-400">A carregar mapa...</div>
});

interface DetalhesOficinaProps {
  id: string;
}

export default function DetalhesOficina({ id }: DetalhesOficinaProps) {
  const router = useRouter();
  const { auth, loginModal } = useApp();
  const { user } = auth;
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const toast = useToast();

  const [oficina, setOficina] = useState<OficinaMecanico | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | undefined>(undefined);
  const [checkingReview, setCheckingReview] = useState(false);

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

  // Check if current user has already reviewed this workshop
  useEffect(() => {
    if (!user) {
      setUserReview(undefined);
      return;
    }
    setCheckingReview(true);
    getReviewById(user.uid, id).then((found) => {
      setUserReview(found ?? undefined);
      setCheckingReview(false);
    });
  }, [user, id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-1/4 mx-auto mb-4" />
        <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto" />
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
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-100 pb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center font-bold text-2xl border border-brand-100 shrink-0">
                  {oficina.logoUrl ? (
                    <img src={oficina.logoUrl} alt={oficina.nome} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    oficina.nome.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-fg-strong tracking-tight">{oficina.nome}</h1>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-fg-subtle">
                    <MapPin size={16} className="text-neutral-400" />
                    <span>{[oficina.morada, oficina.bairro, oficina.localidade, oficina.distrito].filter(Boolean).join(', ')}</span>
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
            <div className="py-6 border-b border-neutral-100">
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

          {/* Workshop video */}
          {oficina.videoUrl && (
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-bold text-fg-strong mb-4">Vídeo de Apresentação</h2>
              <YoutubeEmbed url={oficina.videoUrl} title={`Vídeo da oficina ${oficina.nome}`} />
            </div>
          )}

          {/* Location Map */}
          {oficina.coordenadas && (
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-bold text-fg-strong mb-4">Localização Geográfica</h2>
              <MapViewer lat={oficina.coordenadas.latitude} lng={oficina.coordenadas.longitude} />
            </div>
          )}

          {/* Reviews section */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-fg-strong">Avaliações do Profissional</h2>

            {/* Review Form — only if not the workshop owner */}
            {user && user.email !== oficina.criador ? (
              <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-150">
                {checkingReview ? (
                  <p className="text-xs text-fg-subtle text-center py-3">A verificar...</p>
                ) : userReview ? (
                  <div>
                    <p className="text-xs text-fg-subtle mb-2 flex items-center gap-1">
                      <PencilSimple /> A sua avaliação actual
                    </p>
                    <ReviewFormStructured
                      autorUid={user.uid}
                      autorNome={user.nome}
                      autorFoto={user.foto || null}
                      vendedorUid={oficina.criadorUid || ''}
                      vendedorEmail={oficina.criador}
                      anuncioId={id}
                      anuncioTipo="oficina"
                      especialidades={oficina.especialidades}
                      existingReview={userReview}
                      onSubmit={async (data: ReviewInput) => {
                        await addReview(data);
                        toast?.sucesso('Avaliação enviada! Irá aparecer após aprovação.');
                        // Refresh user review
                        const found = await getReviewById(user.uid, id);
                        setUserReview(found ?? undefined);
                      }}
                      onUpdate={async (data: Partial<ReviewInput>) => {
                        await updateReview(user.uid, id, data);
                        toast?.sucesso('Avaliação actualizada! Irá ser re‑avaliada.');
                        const found = await getReviewById(user.uid, id);
                        setUserReview(found ?? undefined);
                      }}
                    />
                  </div>
                ) : (
                  <ReviewFormStructured
                    autorUid={user.uid}
                    autorNome={user.nome}
                    autorFoto={user.foto || null}
                    vendedorUid={oficina.criadorUid || ''}
                    vendedorEmail={oficina.criador}
                    anuncioId={id}
                    anuncioTipo="oficina"
                    especialidades={oficina.especialidades}
                    onSubmit={async (data: ReviewInput) => {
                      await addReview(data);
                      toast?.sucesso('Avaliação enviada! Irá aparecer após aprovação.');
                      const found = await getReviewById(user.uid, id);
                      setUserReview(found ?? undefined);
                    }}
                  />
                )}
              </div>
            ) : user ? (
              <div className="bg-neutral-50 rounded-2xl p-4 text-center border border-neutral-150 text-xs text-fg-subtle">
                Como proprietário desta oficina, não pode submeter avaliações para o seu próprio perfil.
              </div>
            ) : null}

            {/* Reviews List */}
            <div className="space-y-4 pt-2">
              {reviews.length === 0 ? (
                <p className="text-sm text-fg-subtle text-center py-6">Ainda não existem avaliações aprovadas para este profissional.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="border-b border-neutral-100 last:border-b-0 pb-4 last:pb-0">
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
                    {/* Criteria breakdown */}
                    {review.criterios && review.criterios.length > 0 && (
                      <ReviewCriteriosBar criterios={review.criterios} layout="horizontal" />
                    )}
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
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-fg-strong">Contactar Profissional</h2>
            
            {user ? (
              <div className="space-y-3 pt-2">
                {/* Call */}
                <a
                  href={`tel:${oficina.telefone}`}
                  className="flex items-center justify-center gap-3 w-full bg-neutral-100 hover:bg-neutral-200 text-fg-strong font-bold py-3.5 px-4 rounded-xl text-sm transition"
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
                  className="flex items-center justify-center gap-3 w-full bg-neutral-100 hover:bg-neutral-200 text-fg-strong font-bold py-3.5 px-4 rounded-xl text-sm transition"
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
                    className="flex items-center justify-center gap-3 w-full border border-neutral-300 hover:bg-neutral-50 text-fg-strong font-bold py-3.5 px-4 rounded-xl text-sm transition"
                  >
                    <Globe size={18} />
                    Visitar Website
                  </a>
                )}
              </div>
            ) : (
              <button
                onClick={() => loginModal.openLoginModal(currentPath)}
                className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-fg-muted font-semibold py-4 px-4 rounded-xl transition text-sm"
              >
                <SignIn />
                Faça login para ver os contactos
              </button>
            )}
          </div>

          {/* Details Metadata Card */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-fg-strong mb-4">Informação de Registo</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-fg-subtle">Responsável</span>
                <span className="font-semibold text-fg-strong">{oficina.responsavel}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-fg-subtle">Distrito</span>
                <span className="font-semibold text-fg-strong">{oficina.distrito}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
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
