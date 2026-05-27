import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getCarrosByCreator, getPecasByCreator, updateCarro, updatePeca, deleteCarro, deletePeca } from '@/lib/db';
import { formatarPreco } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import EditarPerfilModal from './EditarPerfilModal';
import EditarCarroModal from '@/components/admin/EditarCarroModal';
import EditarPecaModal from '@/components/admin/EditarPecaModal';
import Badge from '@/components/ui/Badge';
import UserAvatar from '@/components/ui/UserAvatar';
import SellerBadges from '@/components/trust/SellerBadges';
import VerificationRequest from '@/components/trust/VerificationRequest';
import ReviewsList from '@/components/trust/ReviewsList';
import useReviews from '@/hooks/useReviews';
import useVerification from '@/hooks/useVerification';
import type { Carro } from '@/types/carro';
import type { Peca } from '@/types/peca';

export default function ProfileLoggedIn() {
  const { auth } = useApp();
  const { user, logout, isAdmin, updateProfile, refreshProfile } = auth;
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [meusCarros, setMeusCarros] = useState<Carro[]>([]);
  const [minhasPecas, setMinhasPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCarro, setEditCarro] = useState<Carro | null>(null);
  const [editPeca, setEditPeca] = useState<Peca | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ tipo: 'carro' | 'peca'; id: string; titulo: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { reviews, loading: reviewsLoading, media, total } = useReviews(user?.email);
  const { verification, loading: verificationLoading, pedir: pedirVerificacao } = useVerification(user?.uid);

  const carregar = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    const [carrosData, pecasData] = await Promise.all([
      getCarrosByCreator(user.email),
      getPecasByCreator(user.email),
    ]);
    setMeusCarros(carrosData);
    setMinhasPecas(pecasData);
    setLoading(false);
  }, [user?.email]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleSaveCarro = async (id: string, dados: Record<string, unknown>) => {
    await updateCarro(id, { ...dados, status: 'pendente' });
    setEditCarro(null);
    await carregar();
  };

  const handleSavePeca = async (id: string, dados: Record<string, unknown>) => {
    await updatePeca(id, { ...dados, status: 'pendente' });
    setEditPeca(null);
    await carregar();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.tipo === 'carro') {
        await deleteCarro(confirmDelete.id);
      } else {
        await deletePeca(confirmDelete.id);
      }
      setConfirmDelete(null);
      await carregar();
    } catch (err) {
      console.error('[Perfil] Erro ao eliminar:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0 w-16 h-16">
              <UserAvatar user={user} size="md" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 rounded-full transition cursor-pointer group">
                <i className="fa-solid fa-pen text-white text-xs opacity-0 group-hover:opacity-100 transition"></i>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    if (file.size > 1 * 1024 * 1024) {
                      alert('A foto deve ter no máximo 1MB.');
                      return;
                    }
                    try {
                      const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
                      const uploadTask = uploadBytesResumable(storageRef, file);
                      await new Promise<void>((resolve, reject) => {
                        uploadTask.on('state_changed', null, reject, resolve);
                      });
                      const url = await getDownloadURL(storageRef);
                      await updateProfile({ foto: url });
                      await refreshProfile();
                    } catch {
                      alert('Erro ao enviar foto. Tente novamente.');
                    }
                  }}
                />
              </label>
              {isAdmin && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-brand-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border-2 border-white z-10">
                  Admin
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-brand-900 text-lg">{user?.nome || 'Utilizador'}</h3>
                {user?.tipoConta === 'profissional' && (
                  <span className="text-[10px] bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full">
                    <i className="fa-solid fa-store mr-1"></i>Profissional
                  </span>
                )}
              </div>
              <SellerBadges
                verificado={user?.verificado}
                badges={user?.badges}
                mediaAvaliacoes={user?.mediaAvaliacoes}
                totalAvaliacoes={user?.totalAvaliacoes}
                compact
              />
              <p className="text-sm text-gray-500">{user?.email}</p>
              {user?.telefone && (
                <p className="text-xs text-gray-400 mt-1">
                  <i className="fa-solid fa-phone mr-1"></i>{user.telefone}
                  {user.localidade && <> • <i className="fa-solid fa-location-dot mr-1"></i>{user.localidade}</>}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditModalOpen(true)}
            className="text-xs text-accent hover:text-accent-hover font-semibold border border-accent/30 px-3 py-1.5 rounded-full transition hover:bg-accent/5"
          >
            <i className="fa-solid fa-pen mr-1"></i> Editar
          </button>
        </div>

        {user?.bio && (
          <div className="mt-4 bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">{user.bio}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 px-3 py-1.5 rounded-full transition"
          >
            <i className="fa-solid fa-right-from-bracket mr-1"></i> Sair
          </button>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-address-card text-accent"></i> Dados Pessoais
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
            <p className="font-semibold text-brand-900">{user?.email}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telemóvel</p>
            <p className="font-semibold text-brand-900">{user?.telefone || '-'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Localidade</p>
            <p className="font-semibold text-brand-900">{user?.localidade || '-'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código Postal</p>
            <p className="font-semibold text-brand-900">{user?.codigoPostal || '-'}</p>
          </div>
          {user?.morada && (
            <div className="bg-slate-50 rounded-xl p-3 sm:col-span-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Morada</p>
              <p className="font-semibold text-brand-900">{user.morada}</p>
            </div>
          )}
          {user?.nif && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIF</p>
              <p className="font-semibold text-brand-900">{user.nif}</p>
            </div>
          )}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notificações</p>
            <p className="font-semibold text-brand-900">
              {user?.notificacoes ? (
                <span className="text-green-600"><i className="fa-solid fa-bell mr-1"></i> Ativas</span>
              ) : (
                <span className="text-slate-400"><i className="fa-solid fa-bell-slash mr-1"></i> Inativas</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-accent"></i>
        </div>
      ) : (
        <>
      {/* My Cars */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-accent"></i> Os Seus Carros Anunciados
        </h4>

        {meusCarros.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl">
            <p>Nenhum carro anunciado ainda.</p>
            <button
              onClick={() => navigate('/anunciar')}
              className="mt-2 text-accent hover:text-accent-hover font-semibold text-xs"
            >
              <i className="fa-solid fa-circle-plus mr-1"></i> Anunciar carro ou moto
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meusCarros.map((carro) => (
              <div
                key={carro.id}
                className="bg-slate-50 rounded-xl p-3 border border-slate-200 hover:bg-slate-100 transition"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => navigate(`/detalhes/${carro.id}`)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-brand-900 text-sm">
                        {carro.marca} {carro.modelo} ({carro.anoFabricacao})
                      </p>
                      {carro.status === 'pendente' && <Badge cor="yellow">Pendente</Badge>}
                      {carro.status === 'rejeitado' && <Badge cor="red">Rejeitado</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{carro.km?.toLocaleString('pt-PT')} km</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="font-extrabold text-accent text-sm">{formatarPreco(carro.preco)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditCarro(carro); }}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      title="Editar"
                    >
                      <i className="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete({ tipo: 'carro', id: carro.id, titulo: `${carro.marca} ${carro.modelo}` }); }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span><i className="fa-solid fa-eye mr-1"></i>{carro.visualizacoes || 0}</span>
                  <span><i className="fa-solid fa-comment mr-1"></i>{carro.contagemMensagens || 0}</span>
                  <span><i className="fa-solid fa-heart mr-1"></i>{carro.contagemFavoritos || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Parts */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-gears text-accent"></i> As Suas Peças & Pedidos
        </h4>

        {minhasPecas.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl">
            <p>Nenhuma peça ou pedido anunciado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {minhasPecas.map((peca) => (
              <div
                key={peca.id}
                className="bg-slate-50 rounded-xl p-3 border border-slate-200 hover:bg-slate-100 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-brand-900 text-sm">{peca.titulo}</p>
                      {peca.status === 'pendente' && <Badge cor="yellow">Pendente</Badge>}
                      {peca.status === 'rejeitado' && <Badge cor="red">Rejeitado</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{peca.categoria} • {peca.tipo}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {peca.preco != null && (
                      <span className="font-extrabold text-accent text-sm">{formatarPreco(peca.preco)}</span>
                    )}
                    <button
                      onClick={() => setEditPeca(peca)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      title="Editar"
                    >
                      <i className="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ tipo: 'peca', id: peca.id, titulo: peca.titulo })}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span><i className="fa-solid fa-eye mr-1"></i>{peca.visualizacoes || 0}</span>
                  <span><i className="fa-solid fa-comment mr-1"></i>{peca.contagemMensagens || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification */}
      {user && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <VerificationRequest
            uid={user.uid}
            email={user.email}
            nome={user.nome}
            nif={user.nif}
            verificado={user.verificado}
            verification={verification}
            loading={verificationLoading}
            onSubmit={pedirVerificacao}
          />
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-star text-yellow-400"></i> Avaliações Recebidas
        </h4>
        <ReviewsList
          reviews={reviews}
          loading={reviewsLoading}
          media={media}
          total={total}
          currentUserUid={user?.uid}
        />
      </div>

      <EditarPerfilModal show={editModalOpen} onClose={() => setEditModalOpen(false)} />

      {editCarro && (
        <EditarCarroModal
          show
          carro={editCarro}
          onClose={() => setEditCarro(null)}
          onSave={handleSaveCarro}
        />
      )}

      {editPeca && (
        <EditarPecaModal
          show
          peca={editPeca}
          onClose={() => setEditPeca(null)}
          onSave={handleSavePeca}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h4 className="font-bold text-brand-900 mb-2">Eliminar Anúncio</h4>
            <p className="text-sm text-slate-600 mb-4">
              Tem certeza que deseja eliminar <strong>{confirmDelete.titulo}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? <i className="fa-solid fa-spinner fa-spin mr-1"></i> : <i className="fa-solid fa-trash-can mr-1"></i>}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
