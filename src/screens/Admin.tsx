'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChartBar, Users, List, StarHalf, MagnifyingGlass, Flag, ShieldCheck, CircleNotch, ArrowsClockwise, type Icon } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import {
  getAllUsers,
  setUserRole,
  getAllCarrosAdmin,
  getAllPecasAdmin,
  deleteCarro,
  deletePeca,
  updateCarroStatus,
  updatePecaStatus,
  updateCarro,
  updatePeca,
  criarNotificacao,
  getAllIntencoesAdmin,
  updateIntencaoStatus,
  getDenunciasIntencao,
  updateDenunciaIntencaoStatus,
} from '@/lib/db';
import Button from '@/components/ui/Button';
import AdminStats from '@/components/admin/AdminStats';
import UserTable from '@/components/admin/UserTable';
import ListingsTable from '@/components/admin/ListingsTable';
import ReportsQueue from '@/components/admin/ReportsQueue';
import VerificationsQueue from '@/components/admin/VerificationsQueue';
import ReviewsQueue from '@/components/admin/ReviewsQueue';
import useReports from '@/hooks/useReports';
import { useReviewsAdmin } from '@/hooks/useReviews';
import { useVerificationsAdmin } from '@/hooks/useVerification';
import type { Usuario, Role } from '@/types/usuario';
import type { Carro} from '@/types/carro';
import type { Peca } from '@/types/peca';
import type { StatusAnuncio } from '@/types/carro';
import type { IntencaoCompra, DenunciaIntencao } from '@/types/intencao';

type TabAdmin = 'visao-geral' | 'utilizadores' | 'anuncios' | 'denuncias' | 'verificacoes' | 'avaliacoes' | 'intencoes';

export default function Admin() {
  const { auth } = useApp();
  const { isAdmin, loading: authLoading } = auth;
  const router = useRouter();
  const toast = useToast();

  const [tab, setTab] = useState<TabAdmin>('visao-geral');
  const [subTabAnuncios, setSubTabAnuncios] = useState<'carros' | 'pecas'>('carros');
  const [statusFilter, setStatusFilter] = useState<StatusAnuncio | null>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [carros, setCarros] = useState<Carro[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [intencoesAdmin, setIntencoesAdmin] = useState<IntencaoCompra[]>([]);
  const [denunciasIntencao, setDenunciasIntencao] = useState<DenunciaIntencao[]>([]);
  const [loading, setLoading] = useState(true);
  const { reports, loading: reportsLoading, carregar: carregarReports, atualizarStatus: atualizarStatusReport } = useReports();
  const { reviews: adminReviews, loading: reviewsAdminLoading, carregar: carregarReviews, atualizarStatus: atualizarStatusReview, remover: removerReview } = useReviewsAdmin();
  const { verifications, loading: verificationsLoading, carregar: carregarVerifications, atualizarStatus: atualizarStatusVerification } = useVerificationsAdmin();

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/');
      return;
    }
    carregarDados();
  }, [authLoading, isAdmin]);

  const sortPendentesTop = useCallback(<T extends { status: StatusAnuncio; dataCriacao: unknown }>(lista: T[]): T[] => {
    const ordem: Record<StatusAnuncio, number> = { pendente: 0, rejeitado: 1, aprovado: 2 };
    return [...lista].sort((a, b) => {
      const diff = ordem[a.status] - ordem[b.status];
      if (diff !== 0) return diff;
      const da = a.dataCriacao as unknown as { seconds?: number; toMillis?: () => number };
      const db = b.dataCriacao as unknown as { seconds?: number; toMillis?: () => number };
      const ta = da?.seconds ? da.seconds * 1000 : da?.toMillis ? da.toMillis() : 0;
      const tb = db?.seconds ? db.seconds * 1000 : db?.toMillis ? db.toMillis() : 0;
      return tb - ta;
    });
  }, []);

  const carrosOrdenados = sortPendentesTop(carros);
  const pecasOrdenados = sortPendentesTop(pecas);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [u, c, p, i, d] = await Promise.all([
        getAllUsers(),
        getAllCarrosAdmin(),
        getAllPecasAdmin(),
        getAllIntencoesAdmin(),
        getDenunciasIntencao(),
      ]);
      setUsers(u);
      setCarros(c);
      setPecas(p);
      setIntencoesAdmin(i);
      setDenunciasIntencao(d);
      carregarReports();
      carregarReviews();
      carregarVerifications();
    } catch (err) {
      console.error('[Admin] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, role: Role) => {
    try {
      await setUserRole(uid, role);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
      toast?.sucesso('Role alterado com sucesso.');
    } catch {
      toast?.erro('Erro ao alterar role.');
    }
  };

  const handleDeleteCarro = async (id: string) => {
    try {
      await deleteCarro(id);
      setCarros((prev) => prev.filter((c) => c.id !== id));
      toast?.sucesso('Carro eliminado.');
    } catch {
      toast?.erro('Erro ao eliminar carro.');
    }
  };

  const handleDeletePeca = async (id: string) => {
    try {
      await deletePeca(id);
      setPecas((prev) => prev.filter((p) => p.id !== id));
      toast?.sucesso('Peça eliminada.');
    } catch {
      toast?.erro('Erro ao eliminar peça.');
    }
  };

  const handleUpdateCarro = async (id: string, dados: Record<string, unknown>) => {
    try {
      await updateCarro(id, dados);
      setCarros((prev) => prev.map((c) => (c.id === id ? { ...c, ...dados } as Carro : c)));
      toast?.sucesso('Carro atualizado.');
    } catch {
      toast?.erro('Erro ao atualizar carro.');
    }
  };

  const handleUpdatePeca = async (id: string, dados: Record<string, unknown>) => {
    try {
      await updatePeca(id, dados);
      setPecas((prev) => prev.map((p) => (p.id === id ? { ...p, ...dados } as Peca : p)));
      toast?.sucesso('Peça atualizada.');
    } catch {
      toast?.erro('Erro ao atualizar peça.');
    }
  };

  const notificarUtilizador = async (email: string, tipo: 'aprovado' | 'rejeitado', titulo: string, link?: string) => {
    const user = users.find((u) => u.email === email);
    if (!user) return;
    const label = tipo === 'aprovado' ? 'aprovado' : 'rejeitado';
    await criarNotificacao(
      user.uid,
      tipo,
      `Anúncio ${label}!`,
      `O seu anúncio "${titulo}" foi ${label}.`,
      link,
    );
  };

  const handleApproveCarro = async (id: string) => {
    try {
      const c = carros.find((c) => c.id === id);
      await updateCarroStatus(id, 'aprovado');
      setCarros((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'aprovado' } : c)));
      toast?.sucesso('Carro aprovado!');
      if (c) await notificarUtilizador(c.criador, 'aprovado', `${c.marca} ${c.modelo}`, `/detalhes/${id}`);
    } catch {
      toast?.erro('Erro ao aprovar carro.');
    }
  };

  const handleRejectCarro = async (id: string) => {
    try {
      const c = carros.find((c) => c.id === id);
      await updateCarroStatus(id, 'rejeitado');
      setCarros((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'rejeitado' } : c)));
      toast?.sucesso('Carro rejeitado.');
      if (c) await notificarUtilizador(c.criador, 'rejeitado', `${c.marca} ${c.modelo}`);
    } catch {
      toast?.erro('Erro ao rejeitar carro.');
    }
  };

  const handleApprovePeca = async (id: string) => {
    try {
      const p = pecas.find((p) => p.id === id);
      await updatePecaStatus(id, 'aprovado');
      setPecas((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'aprovado' } : p)));
      toast?.sucesso('Peça aprovada!');
      if (p) await notificarUtilizador(p.criador, 'aprovado', p.titulo);
    } catch {
      toast?.erro('Erro ao aprovar peça.');
    }
  };

  const handleRejectPeca = async (id: string) => {
    try {
      const p = pecas.find((p) => p.id === id);
      await updatePecaStatus(id, 'rejeitado');
      setPecas((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'rejeitado' } : p)));
      toast?.sucesso('Peça rejeitada.');
      if (p) await notificarUtilizador(p.criador, 'rejeitado', p.titulo);
    } catch {
      toast?.erro('Erro ao rejeitar peça.');
    }
  };

  const handleNavigateStats = (targetTab: 'utilizadores' | 'anuncios', subTab?: 'carros' | 'pecas', filter?: StatusAnuncio) => {
    setTab(targetTab);
    if (subTab) setSubTabAnuncios(subTab);
    setStatusFilter(filter ?? null);
  };

  const handleUpdateIntencaoStatus = async (id: string, status: string) => {
    try {
      await updateIntencaoStatus(id, status);
      setIntencoesAdmin((prev) => prev.map((i) => (i.id === id ? { ...i, status: status as any } : i)));
      toast?.sucesso(`Intenção ${status}.`);
    } catch { toast?.erro('Erro ao atualizar intenção.'); }
  };

  const intencoesDenunciasPendentes = denunciasIntencao.filter((d) => d.status === 'aberta').length;

  const reportsPendentes = reports.filter((r) => r.status === 'pendente').length;
  const reviewsPendentes = adminReviews.filter((r) => r.status === 'pendente').length;
  const verificationsPendentes = verifications.filter((v) => v.status === 'pendente').length;

  const handleApproveReview = async (id: string) => {
    try {
      const review = adminReviews.find((r) => r.id === id);
      if (!review) return;
      await atualizarStatusReview(id, 'aprovado', review.vendedorUid, review.vendedorEmail);
      toast?.sucesso('Avaliação aprovada!');
      const vendedor = users.find((u) => u.email === review.vendedorEmail);
      if (vendedor) {
        await criarNotificacao(vendedor.uid, 'info', 'Nova avaliação!', `Recebeu uma avaliação de ${review.nota} estrelas de ${review.autorNome}.`);
      }
    } catch {
      toast?.erro('Erro ao aprovar avaliação.');
    }
  };

  const handleRejectReview = async (id: string) => {
    try {
      const review = adminReviews.find((r) => r.id === id);
      if (!review) return;
      await atualizarStatusReview(id, 'rejeitado', review.vendedorUid, review.vendedorEmail);
      toast?.sucesso('Avaliação rejeitada.');
    } catch {
      toast?.erro('Erro ao rejeitar avaliação.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      const review = adminReviews.find((r) => r.id === id);
      if (!review) return;
      await removerReview(id, review.vendedorUid, review.vendedorEmail);
      toast?.sucesso('Avaliação eliminada.');
    } catch {
      toast?.erro('Erro ao eliminar avaliação.');
    }
  };

  const handleReportStatusUpdate = async (id: string, status: import('@/types/report').StatusReport, notasAdmin?: string) => {
    try {
      await atualizarStatusReport(id, status, auth.user?.email || 'admin', notasAdmin);
      toast?.sucesso(`Denúncia ${status === 'resolvido' ? 'resolvida' : status === 'rejeitado' ? 'rejeitada' : 'atualizada'}.`);
    } catch {
      toast?.erro('Erro ao atualizar denúncia.');
    }
  };

  const handleVerificationStatusUpdate = async (id: string, uid: string, status: import('@/types/verification').StatusVerificacao, notasAdmin?: string) => {
    try {
      await atualizarStatusVerification(id, uid, status, auth.user?.email || 'admin', notasAdmin);
      const u = users.find((u) => u.uid === uid);
      if (u && status === 'aprovado') {
        await criarNotificacao(uid, 'info', 'Conta Verificada!', 'A sua conta foi verificada com sucesso pela equipa ReparAuto.');
      } else if (u && status === 'rejeitado') {
        await criarNotificacao(uid, 'info', 'Verificação Rejeitada', 'O seu pedido de verificação foi rejeitado.' + (notasAdmin ? ` Motivo: ${notasAdmin}` : ''));
      }
      toast?.sucesso(`Verificação ${status === 'aprovado' ? 'aprovada' : 'rejeitada'}.`);
    } catch {
      toast?.erro('Erro ao atualizar verificação.');
    }
  };

  const tabs: { key: TabAdmin; label: string; Icon: Icon }[] = [
    { key: 'visao-geral', label: 'Visão Geral', Icon: ChartBar },
    { key: 'utilizadores', label: 'Utilizadores', Icon: Users },
    { key: 'anuncios', label: 'Anúncios', Icon: List },
    { key: 'avaliacoes', label: `Avaliações${reviewsPendentes > 0 ? ` (${reviewsPendentes})` : ''}`, Icon: StarHalf },
    { key: 'intencoes', label: `Intenções${intencoesDenunciasPendentes > 0 ? ` (${intencoesDenunciasPendentes})` : ''}`, Icon: MagnifyingGlass },
    { key: 'denuncias', label: `Denúncias${reportsPendentes > 0 ? ` (${reportsPendentes})` : ''}`, Icon: Flag },
    { key: 'verificacoes', label: `Verificações${verificationsPendentes > 0 ? ` (${verificationsPendentes})` : ''}`, Icon: ShieldCheck },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CircleNotch className="animate-spin text-3xl text-accent" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-fg-heading flex items-center gap-2">
          <ShieldCheck className="text-accent" /> Painel de Administração
        </h1>
        <Button
          tipo="secundario"
          tamanho="sm"
          icone={<ArrowsClockwise />}
          onClick={carregarDados}
        >
          Atualizar
        </Button>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition ${
              tab === t.key ? 'bg-white text-accent shadow-sm' : 'text-fg-subtle hover:text-fg-heading'
            }`}
          >
            <t.Icon /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'visao-geral' && (
        <AdminStats
          totalUsers={users.length}
          totalCarros={carros.length}
          totalPecas={pecas.length}
          carrosPendentes={carros.filter((c) => c.status === 'pendente').length}
          pecasPendentes={pecas.filter((p) => p.status === 'pendente').length}
          onNavigate={handleNavigateStats}
        />
      )}

      {tab === 'utilizadores' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-lg font-extrabold text-fg-heading mb-4">
            <Users className="mr-2 text-accent" /> Gestão de Utilizadores
          </h2>
          <UserTable users={users} onRoleChange={handleRoleChange} />
        </div>
      )}

      {tab === 'anuncios' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-lg font-extrabold text-fg-heading mb-4">
            <List className="mr-2 text-accent" /> Gestão de Anúncios
          </h2>
          <ListingsTable
            carros={carrosOrdenados}
            pecas={pecasOrdenados}
            defaultTab={subTabAnuncios}
            statusFilter={statusFilter}
            onDeleteCarro={handleDeleteCarro}
            onDeletePeca={handleDeletePeca}
            onApproveCarro={handleApproveCarro}
            onRejectCarro={handleRejectCarro}
            onApprovePeca={handleApprovePeca}
            onRejectPeca={handleRejectPeca}
            onUpdateCarro={handleUpdateCarro}
            onUpdatePeca={handleUpdatePeca}
          />
        </div>
      )}

      {tab === 'avaliacoes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <ReviewsQueue
            reviews={adminReviews}
            loading={reviewsAdminLoading}
            onApprove={handleApproveReview}
            onReject={handleRejectReview}
            onDelete={handleDeleteReview}
          />
        </div>
      )}

      {tab === 'intencoes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-extrabold text-fg-heading mb-4 flex items-center gap-2">
              <MagnifyingGlass className="text-accent" /> Gestão de Intenções de Compra
            </h2>
            {intencoesAdmin.length === 0 ? (
              <p className="text-sm text-fg-subtle">Nenhuma intenção encontrada.</p>
            ) : (
              <div className="space-y-2">
                {intencoesAdmin.map((intencao) => (
                  <div key={intencao.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-fg-heading truncate">{intencao.titulo}</p>
                      <p className="text-xs text-fg-subtle">
                        {intencao.criterios.marca} {intencao.criterios.modelo} • {intencao.status} • {intencao.stats.visualizacoes} visualizações
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {intencao.status === 'ativa' && (
                        <Button tipo="aviso" tamanho="sm" onClick={() => handleUpdateIntencaoStatus(intencao.id, 'pausada')}>Pausar</Button>
                      )}
                      {intencao.status === 'pausada' && (
                        <Button tipo="verde" tamanho="sm" onClick={() => handleUpdateIntencaoStatus(intencao.id, 'ativa')}>Ativar</Button>
                      )}
                      <Button tipo="perigo" tamanho="sm" onClick={() => handleUpdateIntencaoStatus(intencao.id, 'deletada')}>Remover</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-extrabold text-fg-heading mb-4 flex items-center gap-2">
              <Flag className="text-red-600" /> Denúncias de Intenções
            </h2>
            {denunciasIntencao.length === 0 ? (
              <p className="text-sm text-fg-subtle">Nenhuma denúncia pendente.</p>
            ) : (
              <div className="space-y-2">
                {denunciasIntencao.map((denuncia) => (
                  <div key={denuncia.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-fg-heading">Motivo: {denuncia.motivo}</p>
                      <p className="text-xs text-fg-subtle">{denuncia.descricao} • Status: {denuncia.status}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <Button tipo="perigo" tamanho="sm" onClick={() => updateDenunciaIntencaoStatus(denuncia.id, 'resolvida', auth.user?.email || 'admin', 'remocao')}>Remover Intenção</Button>
                      <Button tipo="aviso" tamanho="sm" onClick={() => updateDenunciaIntencaoStatus(denuncia.id, 'resolvida', auth.user?.email || 'admin', 'aviso')}>Avisar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'denuncias' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <ReportsQueue
            reports={reports}
            loading={reportsLoading}
            onUpdateStatus={handleReportStatusUpdate}
          />
        </div>
      )}

      {tab === 'verificacoes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <VerificationsQueue
            verifications={verifications}
            loading={verificationsLoading}
            onUpdateStatus={handleVerificationStatusUpdate}
          />
        </div>
      )}
    </div>
  );
}
