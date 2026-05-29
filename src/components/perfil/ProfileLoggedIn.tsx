'use client';

import { ArrowRight, Bell, BellSlash, ChatCircle, CircleNotch, Eye, GearSix, Heart, IdentificationCard, ListChecks, MagnifyingGlass, MapPin, PencilSimple, PencilSimpleLine, Phone, PlusCircle, SignOut, Star, Storefront, Trash } from '@phosphor-icons/react';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getCarrosByCreator, getPecasByCreator, updateCarro, updatePeca, deleteCarro, deletePeca, getIntencoesPorUsuario } from '@/lib/db';
import type { IntencaoCompra } from '@/types/intencao';
import { formatarPreco } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import EditarPerfilModal from './EditarPerfilModal';
import EditarCarroModal from '@/components/admin/EditarCarroModal';
import EditarPecaModal from '@/components/admin/EditarPecaModal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import UserAvatar from '@/components/ui/UserAvatar';
import SellerBadges from '@/components/trust/SellerBadges';
import VerificationRequest from '@/components/trust/VerificationRequest';
import ReviewsList from '@/components/trust/ReviewsList';
import NotificationPreferences from '@/components/perfil/NotificationPreferences';
import useReviews from '@/hooks/useReviews';
import useVerification from '@/hooks/useVerification';
import type { Carro } from '@/types/carro';
import type { Peca } from '@/types/peca';

export default function ProfileLoggedIn() {
  const { auth } = useApp();
  const { user, logout, isAdmin, updateProfile, refreshProfile } = auth;
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [meusCarros, setMeusCarros] = useState<Carro[]>([]);
  const [minhasPecas, setMinhasPecas] = useState<Peca[]>([]);
  const [minhasIntencoes, setMinhasIntencoes] = useState<IntencaoCompra[]>([]);
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
    const [carrosData, pecasData, intencoesData] = await Promise.all([
      getCarrosByCreator(user.email),
      getPecasByCreator(user.email),
      getIntencoesPorUsuario(user.uid).catch(() => []),
    ]);
    setMeusCarros(carrosData);
    setMinhasPecas(pecasData);
    setMinhasIntencoes(intencoesData.filter((i: IntencaoCompra) => i.status === 'ativa'));
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
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0 w-16 h-16">
              <UserAvatar user={user} size="md" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 rounded-full transition cursor-pointer group">
                <PencilSimple className="text-white text-xs opacity-0 group-hover:opacity-100 transition" />
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
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-fg-heading text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border-2 border-white z-10">
                  Admin
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-fg-heading text-xl">{user?.nome || 'Utilizador'}</h3>
                {user?.tipoConta === 'profissional' && (
                  <Badge cor="brand" className="!text-[10px]">
                    <Storefront /> Profissional
                  </Badge>
                )}
              </div>
              <SellerBadges
                verificado={user?.verificado}
                badges={user?.badges}
                mediaAvaliacoes={user?.mediaAvaliacoes}
                totalAvaliacoes={user?.totalAvaliacoes}
                compact
              />
              <p className="text-sm text-fg-muted mt-0.5 break-words">{user?.email}</p>
              {(user?.telefone || user?.localidade) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm font-medium text-fg-muted">
                  {user?.telefone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="text-neutral-400" /> {user.telefone}
                    </span>
                  )}
                  {user?.localidade && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="text-neutral-400" /> {user.localidade}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditModalOpen(true)}
            className="text-xs text-accent hover:text-accent-hover font-semibold border border-accent/30 px-3 py-1.5 rounded-full transition hover:bg-accent/5"
          >
            <PencilSimple className="mr-1" /> Editar
          </button>
        </div>

        {user?.bio && (
          <div className="mt-4 bg-neutral-50 border border-neutral-100 rounded-xl p-3.5">
            <p className="text-sm text-fg leading-relaxed">{user.bio}</p>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-wrap gap-2">
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="inline-flex items-center gap-1.5 text-xs text-danger-600 hover:text-white hover:bg-danger-600 font-bold border border-danger-200 px-4 py-2 rounded-full transition"
          >
            <SignOut /> Sair
          </button>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="font-extrabold text-fg-heading mb-4 flex items-center gap-2">
          <IdentificationCard className="text-accent" /> Dados Pessoais
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">Email</p>
            <p className="font-semibold text-fg-heading">{user?.email}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">Telemóvel</p>
            <p className="font-semibold text-fg-heading">{user?.telefone || '-'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">Localidade</p>
            <p className="font-semibold text-fg-heading">{user?.localidade || '-'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">Código Postal</p>
            <p className="font-semibold text-fg-heading">{user?.codigoPostal || '-'}</p>
          </div>
          {user?.morada && (
            <div className="bg-slate-50 rounded-xl p-3 sm:col-span-2">
              <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">Morada</p>
              <p className="font-semibold text-fg-heading">{user.morada}</p>
            </div>
          )}
          {user?.nif && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">NIF</p>
              <p className="font-semibold text-fg-heading">{user.nif}</p>
            </div>
          )}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">Notificações</p>
            <p className="font-semibold text-fg-heading">
              {user?.notificacoes ? (
                <span className="text-green-600"><Bell className="mr-1" /> Ativas</span>
              ) : (
                <span className="text-fg-subtle"><BellSlash className="mr-1" /> Inativas</span>
              )}
            </p>
          </div>
        </div>

        {user?.uid && (
          <div className="mt-4">
            <h4 className="text-xs font-bold text-fg-subtle uppercase tracking-wider mb-3">Preferências de Notificação</h4>
            <NotificationPreferences uid={user.uid} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <CircleNotch className="animate-spin text-3xl text-accent" />
        </div>
      ) : (
        <>
      {/* My Cars */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="font-extrabold text-fg-heading mb-4 flex items-center gap-2">
          <ListChecks className="text-accent" /> Os Seus Carros Anunciados
        </h4>

        {meusCarros.length === 0 ? (
          <div className="flex flex-col items-center text-center py-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl">
            <ListChecks size={32} className="text-neutral-300 mb-2" />
            <p className="text-sm text-fg-muted mb-3">Ainda não tem carros anunciados.</p>
            <Button
              tipo="primario"
              tamanho="sm"
              icone={<PlusCircle weight="bold" />}
              onClick={() => router.push('/anunciar')}
            >
              Anunciar carro ou moto
            </Button>
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
                    onClick={() => router.push(`/detalhes/${carro.id}`)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-fg-heading text-sm">
                        {carro.marca} {carro.modelo} ({carro.anoFabricacao})
                      </p>
                      {carro.status === 'pendente' && <Badge cor="yellow">Pendente</Badge>}
                      {carro.status === 'rejeitado' && <Badge cor="red">Rejeitado</Badge>}
                    </div>
                    <p className="text-xs text-fg-subtle">{carro.km?.toLocaleString('pt-PT')} km</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="font-extrabold text-accent text-sm">{formatarPreco(carro.preco)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditCarro(carro); }}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      title="Editar"
                    >
                      <PencilSimpleLine className="text-xs" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete({ tipo: 'carro', id: carro.id, titulo: `${carro.marca} ${carro.modelo}` }); }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash className="text-xs" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-fg-subtle">
                  <span><Eye className="mr-1" />{carro.visualizacoes || 0}</span>
                  <span><ChatCircle className="mr-1" />{carro.contagemMensagens || 0}</span>
                  <span><Heart className="mr-1" />{carro.contagemFavoritos || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Parts */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="font-extrabold text-fg-heading mb-4 flex items-center gap-2">
          <GearSix className="text-accent" /> As Suas Peças & Pedidos
        </h4>

        {minhasPecas.length === 0 ? (
          <div className="flex flex-col items-center text-center py-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl">
            <GearSix size={32} className="text-neutral-300 mb-2" />
            <p className="text-sm text-fg-muted">Ainda não tem peças ou pedidos anunciados.</p>
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
                      <p className="font-bold text-fg-heading text-sm">{peca.titulo}</p>
                      {peca.status === 'pendente' && <Badge cor="yellow">Pendente</Badge>}
                      {peca.status === 'rejeitado' && <Badge cor="red">Rejeitado</Badge>}
                    </div>
                    <p className="text-xs text-fg-subtle">{peca.categoria} • {peca.tipo}</p>
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
                      <PencilSimpleLine className="text-xs" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ tipo: 'peca', id: peca.id, titulo: peca.titulo })}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash className="text-xs" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-fg-subtle">
                  <span><Eye className="mr-1" />{peca.visualizacoes || 0}</span>
                  <span><ChatCircle className="mr-1" />{peca.contagemMensagens || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Purchase Intentions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="font-extrabold text-fg-heading mb-4 flex items-center gap-2">
          <MagnifyingGlass className="text-accent" /> Minhas Intenções de Compra
        </h4>
        {minhasIntencoes.length === 0 ? (
          <div className="flex flex-col items-center text-center py-6 text-fg-subtle text-sm bg-slate-50 rounded-xl">
            <p>Nenhuma intenção de compra ativa.</p>
            <Button
              tipo="terciario"
              tamanho="sm"
              icone={<PlusCircle />}
              onClick={() => router.push('/comprar')}
              className="mt-2"
            >
              Criar intenção
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-fg-subtle mb-2">{minhasIntencoes.length} intenção(ões) ativa(s)</p>
            <Button
              tipo="terciario"
              tamanho="sm"
              icone={<ArrowRight />}
              onClick={() => router.push('/minhas-intencoes')}
            >
              Ver todas as intenções
            </Button>
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
        <h4 className="font-extrabold text-fg-heading mb-4 flex items-center gap-2">
          <Star className="text-yellow-400" /> Avaliações Recebidas
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
            <h4 className="font-bold text-fg-heading mb-2">Eliminar Anúncio</h4>
            <p className="text-sm text-fg-muted mb-4">
              Tem certeza que deseja eliminar <strong>{confirmDelete.titulo}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                tipo="secundario"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                tipo="perigo"
                icone={<Trash />}
                onClick={handleDelete}
                disabled={deleting}
                carregando={deleting}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
