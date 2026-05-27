import { useState, useEffect } from 'react';
import { useApp } from '@/providers/AppProvider';
import { obterWhatsApp, gerarLinkWhatsApp } from '@/lib/utils';
import { getUserByEmail } from '@/lib/db';
import useReviews from '@/hooks/useReviews';
import useReports from '@/hooks/useReports';
import SellerBadges from '@/components/trust/SellerBadges';
import ReviewForm from '@/components/trust/ReviewForm';
import ReviewsList from '@/components/trust/ReviewsList';
import ReportButton from '@/components/trust/ReportButton';
import ReportModal from '@/components/trust/ReportModal';
import type { Carro } from '@/types/carro';
import type { Usuario } from '@/types/usuario';

export default function ContactSection({ carro }: { carro: Carro | null }) {
  const [mostrarTelefone, setMostrarTelefone] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [vendedorProfile, setVendedorProfile] = useState<Usuario | null>(null);
  const { auth, chat } = useApp();
  const { user } = auth;
  const { abrirChat } = chat;

  const vendedorEmail = carro?.vendedorEmail || carro?.criador;
  const { reviews, loading: reviewsLoading, media, total, criar: criarReview, remover: removerReview } = useReviews(vendedorEmail);
  const { criar: criarReport } = useReports();

  useEffect(() => {
    if (!vendedorEmail) return;
    let stale = false;
    getUserByEmail(vendedorEmail).then((found) => {
      if (!stale && found) setVendedorProfile(found);
    });
    return () => { stale = true; };
  }, [vendedorEmail]);

  if (!carro) return null;

  const whatsapp = obterWhatsApp(carro.vendedorWhatsApp, carro.vendedorTelefone);
  const telefone = carro.vendedorTelefone;
  const email = carro.vendedorEmail || carro.criador;
  const temWhatsApp = !!whatsapp;
  const temTelefone = !!telefone;
  const temEmail = !!email;
  const vendedorUid = vendedorProfile?.uid || carro.criadorUid;
  const temChat = !!user && !!vendedorUid && user.email !== carro.criador;
  const canReview = !!user && user.email !== carro.criador;
  const alreadyReviewed = reviews.some((r) => r.autorUid === user?.uid && r.anuncioId === carro.id);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <h3 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-address-card text-accent"></i> Contactar Vendedor
        </h3>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-brand-700">
            <i className="fa-solid fa-user text-slate-400"></i>
            <span className="font-semibold">{carro.vendedorNome || carro.criador || 'Anunciante'}</span>
          </div>
          {user && user.email !== carro.criador && (
            <ReportButton onClick={() => setReportModalOpen(true)} />
          )}
        </div>

        {vendedorProfile && (
          <div className="mb-4">
            <SellerBadges
              verificado={vendedorProfile.verificado}
              badges={vendedorProfile.badges}
              mediaAvaliacoes={vendedorProfile.mediaAvaliacoes}
              totalAvaliacoes={vendedorProfile.totalAvaliacoes}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {temWhatsApp && (
            <a
              href={gerarLinkWhatsApp(whatsapp, `${carro.marca} ${carro.modelo}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition text-sm"
            >
              <i className="fa-brands fa-whatsapp text-lg"></i>
              WhatsApp
            </a>
          )}

          {temEmail && (
            <a
              href={`mailto:${email}`}
              className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition border border-slate-300 text-sm"
            >
              <i className="fa-solid fa-envelope"></i>
              Enviar Email
            </a>
          )}
        </div>

        <div className="mt-3">
          {temTelefone && !mostrarTelefone && (
            <button
              onClick={() => setMostrarTelefone(true)}
              className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-accent font-semibold py-3 px-4 rounded-xl transition border border-accent text-sm"
            >
              <i className="fa-solid fa-phone"></i>
              Ver Telefone
            </button>
          )}

          {temTelefone && mostrarTelefone && (
            <a
              href={`tel:${carro.vendedorTelefone}`}
              className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 px-4 rounded-xl transition text-sm"
            >
              <i className="fa-solid fa-phone"></i>
              {carro.vendedorTelefone}
            </a>
          )}
        </div>

        <div className="mt-3">
          {temChat && (
            <button
              onClick={() => abrirChat(carro.id, 'carro', `${carro.marca} ${carro.modelo}`, vendedorUid!, carro.vendedorNome || carro.criador || 'Vendedor')}
              className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition text-sm"
            >
              <i className="fa-solid fa-comment-dots"></i>
              Enviar Mensagem (Chat Interno)
            </button>
          )}

          {!temChat && !user && (
            <a
              href="#/perfil"
              className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 px-4 rounded-xl transition text-sm"
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              Faça login para enviar mensagem
            </a>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm mt-4">
        <h3 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-star text-yellow-400"></i> Avaliações do Vendedor
        </h3>

        {canReview && !alreadyReviewed && vendedorProfile && (
          <div className="mb-4">
            <ReviewForm
              autorUid={user!.uid}
              autorNome={user!.nome}
              autorFoto={user!.foto}
              vendedorUid={vendedorProfile.uid}
              vendedorEmail={vendedorEmail!}
              anuncioId={carro.id}
              anuncioTipo="carro"
              onSubmit={criarReview}
            />
          </div>
        )}

        <ReviewsList
          reviews={reviews}
          loading={reviewsLoading}
          media={media}
          total={total}
          currentUserUid={user?.uid}
          onDelete={vendedorProfile ? (id) => removerReview(id, vendedorProfile.uid, vendedorEmail!) : undefined}
        />
      </div>

      <ReportModal
        show={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        alvoTipo="carro"
        onSubmit={async (motivo, descricao) => {
          if (!user) return;
          await criarReport({
            denuncianteUid: user.uid,
            denuncianteEmail: user.email,
            alvoId: carro.id,
            alvoTipo: 'carro',
            motivo,
            descricao,
            status: 'pendente',
          });
        }}
      />
    </>
  );
}
