'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChartBar, Users, List, StarHalf, MagnifyingGlass, Flag, ShieldCheck, CircleNotch, ArrowsClockwise, Wrench, Crown, Handshake, Clock, House, type Icon } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  getAllOficinasAdmin,
  updateOficinaStatus,
  deleteOficina,
  setUserPlan,
  revokeUserPlan,
  getAdminDashboardStats,
  updateUserProfile,
  type PlanInfo,
  type AdminDashboardStats,
} from '@/lib/db';
import Button from '@/components/ui/Button';
import UserTable from '@/components/admin/UserTable';
import ListingsTable from '@/components/admin/ListingsTable';
import ReportsQueue from '@/components/admin/ReportsQueue';
import VerificationsQueue from '@/components/admin/VerificationsQueue';
import ReviewsQueue from '@/components/admin/ReviewsQueue';
import PremiumTogglePanel from '@/components/admin/PremiumTogglePanel';
import PortugalMap from '@/components/admin/PortugalMap';
import SeguroFinanciamentoTab from '@/components/admin/SeguroFinanciamentoTab';
import BannersTab from '@/components/admin/BannersTab';
import useReports from '@/hooks/useReports';
import { useReviewsAdmin } from '@/hooks/useReviews';
import { useVerificationsAdmin } from '@/hooks/useVerification';
import type { Usuario, Role } from '@/types/usuario';
import type { Carro} from '@/types/carro';
import type { Peca } from '@/types/peca';
import type { StatusAnuncio } from '@/types/carro';
import type { IntencaoCompra, DenunciaIntencao } from '@/types/intencao';
import type { OficinaMecanico } from '@/types/oficina';
import { ESPECIALIDADES_LABELS } from '@/types/oficina';


type TabAdmin = 'visao-geral' | 'utilizadores' | 'anuncios' | 'intencoes' | 'oficinas' | 'premium' | 'seguro-financiamento' | 'pendentes' | 'banners';

export default function Admin() {
  const { auth } = useApp();
  const { isAdmin, loading: authLoading } = auth;
  const router = useRouter();
  const toast = useToast();

  const [tab, setTab] = useState<TabAdmin>('visao-geral');
  const [subTabAnuncios, setSubTabAnuncios] = useState<'carros' | 'pecas'>('carros');
  const [subTabPendentes, setSubTabPendentes] = useState<'anuncios' | 'oficinas' | 'avaliacoes' | 'denuncias' | 'verificacoes'>('anuncios');
  const [statusFilter, setStatusFilter] = useState<StatusAnuncio | null>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [carros, setCarros] = useState<Carro[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [intencoesAdmin, setIntencoesAdmin] = useState<IntencaoCompra[]>([]);
  const [denunciasIntencao, setDenunciasIntencao] = useState<DenunciaIntencao[]>([]);
  const [oficinasAdmin, setOficinasAdmin] = useState<OficinaMecanico[]>([]);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { reports, loading: reportsLoading, carregar: carregarReports, atualizarStatus: atualizarStatusReport } = useReports();
  const { reviews: adminReviews, loading: reviewsAdminLoading, carregar: carregarReviews, atualizarStatus: atualizarStatusReview, remover: removerReview } = useReviewsAdmin();
  const { verifications, loading: verificationsLoading, carregar: carregarVerifications, atualizarStatus: atualizarStatusVerification } = useVerificationsAdmin();

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/app');
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

  const intencoesOrdenadas = [...intencoesAdmin].sort((a, b) => {
    const ordem: Record<string, number> = { pendente: 0, ativa: 1, pausada: 2, expirada: 3, deletada: 4 };
    const diff = (ordem[a.status] ?? 99) - (ordem[b.status] ?? 99);
    if (diff !== 0) return diff;
    const aTime = a.atualizadaEm?.toDate?.()?.getTime() || 0;
    const bTime = b.atualizadaEm?.toDate?.()?.getTime() || 0;
    return bTime - aTime;
  });

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [u, c, p, i, d, o] = await Promise.all([
        getAllUsers(),
        getAllCarrosAdmin(),
        getAllPecasAdmin(),
        getAllIntencoesAdmin(),
        getDenunciasIntencao(),
        getAllOficinasAdmin(),
      ]);
      setUsers(u);
      setCarros(c);
      setPecas(p);
      setIntencoesAdmin(i);
      setDenunciasIntencao(d);
      setOficinasAdmin(o);
      // Carregar estatísticas reais da dashboard
      const stats = await getAdminDashboardStats(u, c, p, o, i);
      setDashboardStats(stats);
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

  const handleUpdateUserProfile = async (uid: string, updates: Partial<Usuario>) => {
    try {
      await updateUserProfile(uid, updates);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, ...updates } : u)));
      toast?.sucesso('Utilizador atualizado com sucesso.');
    } catch {
      toast?.erro('Erro ao atualizar utilizador.');
    }
  };

  const handleGrantPlan = async (uid: string, planoId: string, nome: string, categoria: 'anuncios' | 'oficinas' | 'leads', dias: number) => {
    try {
      await setUserPlan(uid, { planoId, nome, categoria } as PlanInfo, auth.user?.uid || '', auth.user?.nome || '', dias);
      setUsers((prev) => prev.map((u) => {
        if (u.uid !== uid) return u;
        const agora = new Date();
        const exp = new Date(agora.getTime() + dias * 86400000);
        return {
          ...u,
          planoAtivo: {
            planoId,
            nome,
            categoria,
            dataAtribuicao: { seconds: Math.floor(agora.getTime() / 1000), nanoseconds: 0 } as any,
            dataExpiracao: { seconds: Math.floor(exp.getTime() / 1000), nanoseconds: 0 } as any,
            atribuidoPor: 'admin' as const,
            adminUid: auth.user?.uid,
            adminNome: auth.user?.nome,
          },
        };
      }));
      const target = users.find((u) => u.uid === uid);
      if (target) {
        await criarNotificacao(uid, 'info', 'Plano Premium Ativado!',
          `Recebeu o plano "${nome}" cortesia da equipa RecarGarage. Válido por ${dias} dias.`,
          '/admin');
      }
      toast?.sucesso(`Plano "${nome}" concedido com sucesso!`);
    } catch {
      toast?.erro('Erro ao conceder plano.');
    }
  };

  const handleRevokePlan = async (uid: string) => {
    try {
      await revokeUserPlan(uid);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, planoAtivo: undefined } : u)));
      await criarNotificacao(uid, 'info', 'Plano Premium Removido',
        'O seu plano premium foi removido pela administração.');
      toast?.sucesso('Plano removido com sucesso.');
    } catch {
      toast?.erro('Erro ao remover plano.');
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

  // Bulk actions over multiple selected listings (approve / reject / delete)
  const handleBulkAction = async (tipo: 'carro' | 'peca', action: 'aprovar' | 'rejeitar' | 'eliminar', ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const plural = ids.length !== 1;
    try {
      if (action === 'eliminar') {
        await Promise.all(ids.map((id) => (tipo === 'carro' ? deleteCarro(id) : deletePeca(id))));
        if (tipo === 'carro') setCarros((prev) => prev.filter((c) => !idSet.has(c.id)));
        else setPecas((prev) => prev.filter((p) => !idSet.has(p.id)));
        toast?.sucesso(`${ids.length} anúncio${plural ? 's' : ''} eliminado${plural ? 's' : ''}.`);
        return;
      }
      const novoStatus = action === 'aprovar' ? ('aprovado' as const) : ('rejeitado' as const);
      if (tipo === 'carro') {
        const alvos = carros.filter((c) => idSet.has(c.id));
        await Promise.all(alvos.map((c) => updateCarroStatus(c.id, novoStatus)));
        setCarros((prev) => prev.map((c) => (idSet.has(c.id) ? { ...c, status: novoStatus } : c)));
        await Promise.all(alvos.map((c) => notificarUtilizador(c.criador, novoStatus, `${c.marca} ${c.modelo}`, novoStatus === 'aprovado' ? `/detalhes/${c.id}` : undefined)));
      } else {
        const alvos = pecas.filter((p) => idSet.has(p.id));
        await Promise.all(alvos.map((p) => updatePecaStatus(p.id, novoStatus)));
        setPecas((prev) => prev.map((p) => (idSet.has(p.id) ? { ...p, status: novoStatus } : p)));
        await Promise.all(alvos.map((p) => notificarUtilizador(p.criador, novoStatus, p.titulo)));
      }
      toast?.sucesso(`${ids.length} anúncio${plural ? 's' : ''} ${novoStatus}${plural ? 's' : ''}.`);
    } catch {
      toast?.erro('Erro ao executar ação em massa.');
    }
  };

  const handleNavigateStats = (targetTab: 'utilizadores' | 'anuncios' | 'oficinas' | 'intencoes' | 'avaliacoes' | 'pendentes', subTab?: 'carros' | 'pecas', filter?: StatusAnuncio) => {
    if (targetTab === 'avaliacoes') {
      setTab('pendentes');
      setSubTabPendentes('avaliacoes');
    } else {
      setTab(targetTab as TabAdmin);
    }
    if (subTab) setSubTabAnuncios(subTab);
    setStatusFilter(filter ?? null);
  };

  const handleUpdateIntencaoStatus = async (id: string, status: string) => {
    try {
      await updateIntencaoStatus(id, status);
      if (status === 'deletada') {
        setIntencoesAdmin((prev) => prev.filter((i) => i.id !== id));
      } else {
        setIntencoesAdmin((prev) => prev.map((i) => (i.id === id ? { ...i, status: status as any } : i)));
      }
      toast?.sucesso(`Intenção ${status}.`);
    } catch { toast?.erro('Erro ao atualizar intenção.'); }
  };

  const handleApproveIntencao = async (id: string) => {
    try {
      const intencao = intencoesAdmin.find((i) => i.id === id);
      await updateIntencaoStatus(id, 'ativa');
      setIntencoesAdmin((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'ativa' as any } : i)));
      toast?.sucesso('Intenção aprovada!');
      if (intencao) {
        const user = users.find((u) => u.uid === intencao.userId);
        if (user) {
          await criarNotificacao(user.uid, 'aprovado', 'Intenção aprovada!',
            `A sua intenção de compra "${intencao.titulo}" foi aprovada e já está visível para vendedores.`,
            `/minhas-intencoes`);
        }
      }
    } catch { toast?.erro('Erro ao aprovar intenção.'); }
  };

  const handleRejectIntencao = async (id: string) => {
    try {
      const intencao = intencoesAdmin.find((i) => i.id === id);
      await updateIntencaoStatus(id, 'deletada');
      setIntencoesAdmin((prev) => prev.filter((i) => i.id !== id));
      toast?.sucesso('Intenção rejeitada.');
      if (intencao) {
        const user = users.find((u) => u.uid === intencao.userId);
        if (user) {
          await criarNotificacao(user.uid, 'rejeitado', 'Intenção rejeitada',
            `A sua intenção de compra "${intencao.titulo}" foi rejeitada.`);
        }
      }
    } catch { toast?.erro('Erro ao rejeitar intenção.'); }
  };

  const handleApproveOficina = async (id: string) => {
    try {
      const o = oficinasAdmin.find((of) => of.id === id);
      await updateOficinaStatus(id, 'aprovado');
      setOficinasAdmin((prev) => prev.map((of) => (of.id === id ? { ...of, status: 'aprovado' } : of)));
      toast?.sucesso('Oficina aprovada!');
      if (o) {
        const criadorUser = users.find((u) => u.email === o.criador);
        if (criadorUser) {
          await criarNotificacao(
            criadorUser.uid,
            'info',
            'Oficina aprovada!',
            `A sua oficina "${o.nome}" foi aprovada e já está pública no diretório.`,
            `/oficinas/detalhes/${id}`
          );
        }
      }
    } catch {
      toast?.erro('Erro ao aprovar oficina.');
    }
  };

  const handleRejectOficina = async (id: string) => {
    try {
      const o = oficinasAdmin.find((of) => of.id === id);
      await updateOficinaStatus(id, 'rejeitado');
      setOficinasAdmin((prev) => prev.map((of) => (of.id === id ? { ...of, status: 'rejeitado' } : of)));
      toast?.sucesso('Oficina rejeitada.');
      if (o) {
        const criadorUser = users.find((u) => u.email === o.criador);
        if (criadorUser) {
          await criarNotificacao(
            criadorUser.uid,
            'info',
            'Oficina rejeitada',
            `O registo da sua oficina "${o.nome}" foi rejeitado pela administração.`
          );
        }
      }
    } catch {
      toast?.erro('Erro ao rejeitar oficina.');
    }
  };

  const handleDeleteOficina = async (id: string) => {
    try {
      await deleteOficina(id);
      setOficinasAdmin((prev) => prev.filter((o) => o.id !== id));
      toast?.sucesso('Oficina eliminada.');
    } catch {
      toast?.erro('Erro ao eliminar oficina.');
    }
  };

  const totalCarrosPendentes = carros.filter((c) => c.status === 'pendente').length;
  const totalPecasPendentes = pecas.filter((p) => p.status === 'pendente').length;
  const totalAnunciosPendentes = totalCarrosPendentes + totalPecasPendentes;
  const totalOficinasPendentes = oficinasAdmin.filter((o) => o.status === 'pendente').length;
  const intencoesDenunciasPendentes = denunciasIntencao.filter((d) => d.status === 'aberta').length;
  const reportsPendentes = reports.filter((r) => r.status === 'pendente').length;
  const reviewsPendentes = adminReviews.filter((r) => r.status === 'pendente').length;
  const verificationsPendentes = verifications.filter((v) => v.status === 'pendente').length;
  const totalPendentes = totalCarrosPendentes + totalPecasPendentes + totalOficinasPendentes + reviewsPendentes + reportsPendentes + verificationsPendentes + intencoesDenunciasPendentes;

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
        await criarNotificacao(uid, 'info', 'Conta Verificada!', 'A sua conta foi verificada com sucesso pela equipa RecarGarage.');
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
    { key: 'oficinas', label: 'Oficinas', Icon: Wrench },
    { key: 'intencoes', label: 'Intenções', Icon: MagnifyingGlass },
    { key: 'premium', label: 'Premium', Icon: Crown },
    { key: 'seguro-financiamento', label: 'Seguro & Financiamento', Icon: Handshake },
    { key: 'pendentes', label: 'Pendentes', Icon: Clock }
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-neutral-50 min-h-screen">
        <CircleNotch className="animate-spin text-3xl text-pink-700" />
      </div>
    );
  }

  const sidebarButtons = [
    {
      key: 'visao-geral' as TabAdmin,
      label: 'Visão Geral',
      Icon: ChartBar,
      value: null,
      gradient: 'from-slate-100 to-slate-50',
      borderClass: 'border-neutral-200',
      activeGradient: 'from-primary-600 to-primary-700',
      activeBorder: 'border-primary-700',
      textColor: 'text-primary-700',
      activeTextColor: 'text-white',
    },
    {
      key: 'utilizadores' as TabAdmin,
      label: 'Utilizadores',
      Icon: Users,
      value: users.length,
      gradient: 'from-pink-500/10 via-purple-500/5 to-transparent',
      borderClass: 'border-pink-500/10',
      activeGradient: 'from-pink-500 via-purple-500 to-indigo-600',
      activeBorder: 'border-pink-400/30',
      textColor: 'text-pink-700',
      activeTextColor: 'text-white',
    },
    {
      key: 'anuncios' as TabAdmin,
      label: 'Anúncios',
      Icon: List,
      value: carros.length + pecas.length,
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      borderClass: 'border-amber-500/10',
      activeGradient: 'from-amber-500 via-orange-500 to-red-600',
      activeBorder: 'border-amber-400/30',
      textColor: 'text-amber-700',
      activeTextColor: 'text-white',
    },
    {
      key: 'oficinas' as TabAdmin,
      label: 'Oficinas',
      Icon: Wrench,
      value: oficinasAdmin.length,
      gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
      borderClass: 'border-blue-500/10',
      activeGradient: 'from-blue-500 via-indigo-500 to-violet-600',
      activeBorder: 'border-blue-400/30',
      textColor: 'text-blue-700',
      activeTextColor: 'text-white',
    },
    {
      key: 'intencoes' as TabAdmin,
      label: 'Intenções',
      Icon: MagnifyingGlass,
      value: intencoesAdmin.length,
      gradient: 'from-purple-500/10 via-fuchsia-500/5 to-transparent',
      borderClass: 'border-purple-500/10',
      activeGradient: 'from-purple-500 via-fuchsia-500 to-rose-600',
      activeBorder: 'border-purple-400/30',
      textColor: 'text-purple-700',
      activeTextColor: 'text-white',
    },
    {
      key: 'premium' as TabAdmin,
      label: 'Premium',
      Icon: Crown,
      value: null,
      gradient: 'from-yellow-500/10 via-amber-500/5 to-transparent',
      borderClass: 'border-yellow-500/10',
      activeGradient: 'from-yellow-500 to-amber-600',
      activeBorder: 'border-yellow-400/30',
      textColor: 'text-yellow-700',
      activeTextColor: 'text-white',
    },
    {
      key: 'seguro-financiamento' as TabAdmin,
      label: 'Seguro & Fin.',
      Icon: Handshake,
      value: null,
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      borderClass: 'border-emerald-500/10',
      activeGradient: 'from-emerald-500 to-teal-600',
      activeBorder: 'border-emerald-400/30',
      textColor: 'text-emerald-700',
      activeTextColor: 'text-white',
    },
    {
      key: 'banners' as TabAdmin,
      label: 'Banners',
      Icon: House,
      value: null,
      gradient: 'from-blue-500/10 via-cyan-500/5 to-transparent',
      borderClass: 'border-blue-500/10',
      activeGradient: 'from-blue-600 via-cyan-500 to-indigo-650',
      activeBorder: 'border-blue-400/30',
      textColor: 'text-blue-700',
      activeTextColor: 'text-white',
    },
    {
      key: 'pendentes' as TabAdmin,
      label: 'Pendentes',
      Icon: Clock,
      value: totalPendentes,
      gradient: 'from-red-500/10 via-rose-500/5 to-transparent',
      borderClass: 'border-red-500/25',
      activeGradient: 'from-red-600 via-rose-600 to-orange-600',
      activeBorder: 'border-red-400/40',
      textColor: 'text-red-700',
      activeTextColor: 'text-white',
    },
  ];

  return (
    <div className="flex h-screen bg-neutral-50 text-fg font-sans overflow-hidden">
      
      {/* Sleek Left Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col justify-between flex-shrink-0 z-30">
        <div className="p-5 flex flex-col h-full justify-between">
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-200">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-pink-500/25 text-white font-black text-lg">
                R
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-fg-heading tracking-tight">RecarGarage</h1>
                <p className="text-[9px] text-pink-700 font-extrabold uppercase tracking-wider">Painel Admin</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-2 overflow-y-auto max-h-[calc(100vh-210px)] pr-1 scrollbar-thin scrollbar-thumb-slate-300">
              {sidebarButtons.map((btn) => {
                const isActive = tab === btn.key;
                return (
                  <button
                    key={btn.key}
                    onClick={() => setTab(btn.key)}
                    className={`w-full relative rounded-xl p-2.5 flex items-center justify-between text-left transition-all duration-200 border group ${
                      isActive
                        ? `bg-gradient-to-r ${btn.activeGradient} ${btn.activeBorder} shadow-lg shadow-black/20 text-white scale-[1.01]`
                        : `bg-white ${btn.borderClass} text-fg-muted hover:text-fg-strong hover:bg-slate-50 hover:scale-[1.005]`
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/10' : 'bg-white border border-neutral-200 group-hover:bg-slate-100'} transition-colors flex items-center justify-center shrink-0`}>
                        <btn.Icon
                          className={`text-sm shrink-0 ${
                            isActive ? 'text-white' : btn.textColor
                          }`}
                          weight={isActive ? 'bold' : 'regular'}
                        />
                      </div>
                      <span className={`text-[11px] font-bold tracking-tight truncate ${isActive ? 'text-white' : 'text-fg'}`}>
                        {btn.label}
                      </span>
                    </div>
                    {btn.value !== null && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : `bg-white border border-neutral-200 ${btn.textColor}`
                        }`}
                      >
                        {btn.value}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User profile & exit section in sidebar footer */}
          <div className="space-y-2 mt-4 pt-3 border-t border-neutral-200">
            <Link
              href="/app"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold bg-white hover:bg-slate-100 border border-neutral-200 hover:border-neutral-300 text-fg hover:text-fg-heading transition-all duration-200"
            >
              <House className="text-sm text-pink-700" />
              <span>Voltar ao Site</span>
            </Link>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-fg border border-neutral-300 font-extrabold uppercase text-xs shrink-0">
                {auth.user?.nome ? auth.user.nome.substring(0, 2) : 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-fg-strong truncate">{auth.user?.nome || 'Administrador'}</p>
                <p className="text-[9px] text-fg-muted font-semibold truncate">{auth.user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content viewport */}
      <main className="flex-1 bg-neutral-50 overflow-y-auto flex flex-col z-10 relative">
        
        {/* Header bar */}
        <header className="sticky top-0 bg-white backdrop-blur-md border-b border-neutral-200 p-5 flex items-center justify-between z-20">
          <h2 className="text-lg font-black text-fg-heading flex items-center gap-2 capitalize">
            {tabs.find(t => t.key === tab)?.label.split(' (')[0]}
          </h2>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-pink-50 border border-pink-200 text-pink-700 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" /> Live Admin
            </span>
            <Button
              tipo="secundario"
              tamanho="sm"
              icone={<ArrowsClockwise />}
              onClick={carregarDados}
            >
              Sincronizar
            </Button>
          </div>
        </header>

        {/* Content wrapper */}
        <div className="p-6 flex-1">

          {tab === 'visao-geral' && (
            <div className="space-y-6">
              
              {/* Summary Cards with real totals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
                  <span className="text-[9px] font-bold text-fg-muted uppercase tracking-wider">Utilizadores</span>
                  <p className="text-xl font-black text-pink-700 mt-0.5">{users.length}</p>
                </div>
                <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
                  <span className="text-[9px] font-bold text-fg-muted uppercase tracking-wider">Anúncios</span>
                  <p className="text-xl font-black text-amber-700 mt-0.5">{carros.length + pecas.length}</p>
                </div>
                <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
                  <span className="text-[9px] font-bold text-fg-muted uppercase tracking-wider">Oficinas</span>
                  <p className="text-xl font-black text-blue-700 mt-0.5">{oficinasAdmin.length}</p>
                </div>
                <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
                  <span className="text-[9px] font-bold text-fg-muted uppercase tracking-wider">Intenções</span>
                  <p className="text-xl font-black text-purple-700 mt-0.5">{intencoesAdmin.length}</p>
                </div>
              </div>

              {/* Charts & Map Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left & Middle: CSS/SVG Demographics Charts */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* District Distribution Chart */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-fg-heading">Clientes por Distrito</h4>
                      <p className="text-[10px] text-fg-muted">Distribuição com base nas moradas de registo.</p>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(
                        users.reduce((acc, u) => {
                          const dist = u.distrito || 'Não Especificado';
                          acc[dist] = (acc[dist] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([dist, count], idx) => {
                          const percentage = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-fg">{dist}</span>
                                <span className="text-pink-700">{percentage}% ({count})</span>
                              </div>
                              <div className="w-full bg-neutral-50 h-2 rounded-full overflow-hidden border border-neutral-200">
                                <div 
                                  className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Account Age Distribution (real data) */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-fg-heading">Tempo na Plataforma</h4>
                      <p className="text-[10px] text-fg-muted">Antiguidade dos utilizadores com base na data de registo.</p>
                    </div>
                    <div className="space-y-3">
                      {(dashboardStats?.antiguidade ?? []).map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-fg">{item.range}</span>
                            <span className="text-purple-700">{item.percent}% ({item.count})</span>
                          </div>
                          <div className="w-full bg-neutral-50 h-2 rounded-full overflow-hidden border border-neutral-200">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {(!dashboardStats || dashboardStats.antiguidade.every(a => a.count === 0)) && (
                        <p className="text-xs text-fg-muted text-center py-2">A aguardar dados de antiguidade...</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right: SVG Interactive Portugal Map */}
                <div className="md:col-span-1">
                  <PortugalMap 
                    userCountsByDistrict={users.reduce((acc, u) => {
                      const dist = u.distrito || 'Não Especificado';
                      acc[dist] = (acc[dist] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)}
                  />
                </div>

              </div>

              {/* Activity Metrics (real data replacing mock downloads) */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-fg-heading">Métricas de Atividade</h4>
                    <p className="text-[10px] text-fg-muted">Engajamento real dos utilizadores na plataforma.</p>
                  </div>
                  <div className="flex gap-4 text-xs font-bold text-fg-muted">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Anúncios</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Utilizadores</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  
                  <div className="bg-slate-50 border border-neutral-200 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-fg-muted font-bold uppercase tracking-wider">Utilizadores Ativos</span>
                      <p className="text-xl font-black text-emerald-700 mt-1">{dashboardStats?.utilizadoresAtivos ?? '—'} <span className="text-[10px] font-normal text-fg-muted">criaram anúncios</span></p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-black">
                      UA
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-neutral-200 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-fg-muted font-bold uppercase tracking-wider">Média Anúncios / Utilizador</span>
                      <p className="text-xl font-black text-blue-700 mt-1">{dashboardStats?.mediaAnunciosPorUtilizador ?? '—'} <span className="text-[10px] font-normal text-fg-muted">anúncios</span></p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-black">
                      MÉD
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-neutral-200 p-4 rounded-xl flex items-center justify-between sm:col-span-2 md:col-span-1">
                    <div>
                      <span className="text-[10px] text-fg-muted font-bold uppercase tracking-wider">Visualizações Totais</span>
                      <p className="text-xl font-black text-pink-700 mt-1">
                        {dashboardStats ? (dashboardStats.totalVisualizacoes >= 1000 ? `${(dashboardStats.totalVisualizacoes / 1000).toFixed(1)}k` : dashboardStats.totalVisualizacoes) : '—'} 
                        <span className="text-[10px] font-normal text-fg-muted"> views</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-200 flex items-center justify-center text-pink-700 text-xs font-black">
                      VIEW
                    </div>
                  </div>

                </div>

                {/* Real Evolution Chart (last 6 months) */}
                <div className="bg-slate-50 border border-neutral-200 rounded-xl p-4">
                  <h5 className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-3">Evolução Mensal (últimos 6 meses)</h5>
                  <div className="h-36 relative">
                    {dashboardStats ? (
                      <>
                        {/* Y-axis labels */}
                        <div className="absolute -left-0.5 top-0 bottom-5 flex flex-col justify-between text-[8px] font-bold text-fg-muted pr-1">
                          {[100, 75, 50, 25, 0].map((pct) => {
                            const maxVal = Math.max(
                              1,
                              ...dashboardStats.evolucaoMensal.flatMap(m => [m.utilizadores, m.carros + m.pecas])
                            );
                            return (
                              <span key={pct}>{Math.round(maxVal * pct / 100)}</span>
                            );
                          })}
                        </div>
                        {/* Chart area */}
                        <div className="ml-8 h-full flex items-end gap-2">
                          {dashboardStats.evolucaoMensal.map((m, idx) => {
                            const maxVal = Math.max(
                              1,
                              ...dashboardStats.evolucaoMensal.flatMap(mm => [mm.utilizadores, mm.carros + mm.pecas])
                            );
                            const anunciosH = ((m.carros + m.pecas) / maxVal) * 100;
                            const usersH = (m.utilizadores / maxVal) * 100;
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                <div className="w-full flex gap-0.5 items-end h-full max-h-28">
                                  <div
                                    className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all duration-500 min-h-[2px]"
                                    style={{ height: `${Math.max(anunciosH, 0.5)}%` }}
                                    title={`Anúncios: ${m.carros + m.pecas}`}
                                  />
                                  <div
                                    className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-500 min-h-[2px]"
                                    style={{ height: `${Math.max(usersH, 0.5)}%` }}
                                    title={`Utilizadores: ${m.utilizadores}`}
                                  />
                                </div>
                                <span className="text-[8px] font-bold text-fg-muted shrink-0">{m.mes}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-xs text-fg-muted">A carregar dados de evolução...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'utilizadores' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5">
              <h2 className="text-lg font-extrabold text-fg-heading mb-4 flex items-center gap-2">
                <Users className="text-pink-700" /> Gestão de Utilizadores
              </h2>
              <UserTable
                users={users}
                onRoleChange={handleRoleChange}
                adminUid={auth.user?.uid || ''}
                adminNome={auth.user?.nome || 'Admin'}
                onGrantPlan={handleGrantPlan}
                onRevokePlan={handleRevokePlan}
                onUpdateUserProfile={handleUpdateUserProfile}
              />
            </div>
          )}

          {tab === 'anuncios' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 text-fg-heading">
              <h2 className="text-lg font-extrabold text-fg-heading mb-4 flex items-center gap-2">
                <List className="text-pink-700" /> Gestão de Anúncios
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
                onBulkAction={handleBulkAction}
              />
            </div>
          )}



          {tab === 'intencoes' && (
            <div className="space-y-6 text-fg-heading">
              <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                <h2 className="text-lg font-extrabold text-fg-heading mb-4 flex items-center gap-2">
                  <MagnifyingGlass className="text-pink-700" /> Gestão de Intenções de Compra
                </h2>
                {intencoesAdmin.length === 0 ? (
                  <p className="text-sm text-fg-muted">Nenhuma intenção encontrada.</p>
                ) : (
                  <div className="space-y-2">
                    {intencoesOrdenadas.filter((i) => i.status !== 'deletada').map((intencao) => (
                      <div key={intencao.id} className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-fg-strong truncate">{intencao.titulo}</p>
                          <p className="text-xs text-fg-muted mt-0.5">
                            {intencao.criterios.marca} {intencao.criterios.modelo} • {intencao.status} • {intencao.stats.visualizacoes} visualizações
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          {intencao.status === 'pendente' && (
                            <>
                              <Button tipo="verde" tamanho="sm" onClick={() => handleApproveIntencao(intencao.id)}>Aprovar</Button>
                              <Button tipo="perigo" tamanho="sm" onClick={() => handleRejectIntencao(intencao.id)}>Rejeitar</Button>
                            </>
                          )}
                          {intencao.status === 'ativa' && (
                            <Button tipo="aviso" tamanho="sm" onClick={() => handleUpdateIntencaoStatus(intencao.id, 'pausada')}>Pausar</Button>
                          )}
                          {intencao.status === 'pausada' && (
                            <Button tipo="verde" tamanho="sm" onClick={() => handleUpdateIntencaoStatus(intencao.id, 'ativa')}>Ativar</Button>
                          )}
                          {intencao.status !== 'pendente' && (
                            <Button tipo="perigo" tamanho="sm" onClick={() => handleUpdateIntencaoStatus(intencao.id, 'deletada')}>Remover</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                <h2 className="text-lg font-extrabold text-fg-heading mb-4 flex items-center gap-2">
                  <Flag className="text-red-700" /> Denúncias de Intenções
                </h2>
                {denunciasIntencao.length === 0 ? (
                  <p className="text-sm text-fg-muted">Nenhuma denúncia pendente.</p>
                ) : (
                  <div className="space-y-2">
                    {denunciasIntencao.map((denuncia) => (
                      <div key={denuncia.id} className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-fg-strong">Motivo: {denuncia.motivo}</p>
                          <p className="text-xs text-fg-muted mt-0.5">{denuncia.descricao} • Status: {denuncia.status}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <Button tipo="perigo" tamanho="sm" onClick={async () => { await updateIntencaoStatus(denuncia.intencaoId, 'deletada'); await updateDenunciaIntencaoStatus(denuncia.id, 'resolvida', auth.user?.email || 'admin', 'remocao'); setIntencoesAdmin((prev) => prev.filter((i) => i.id !== denuncia.intencaoId)); }}>Remover Intenção</Button>
                          <Button tipo="aviso" tamanho="sm" onClick={() => updateDenunciaIntencaoStatus(denuncia.id, 'resolvida', auth.user?.email || 'admin', 'aviso')}>Avisar</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'oficinas' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 text-fg-heading">
              <h2 className="text-lg font-extrabold text-fg-heading mb-4 flex items-center gap-2">
                <Wrench className="text-pink-700" /> Moderação de Oficinas & Mecânicos
              </h2>
              {oficinasAdmin.length === 0 ? (
                <p className="text-sm text-fg-muted">Nenhuma oficina registada.</p>
              ) : (
                <div className="space-y-4">
                  {oficinasAdmin.map((oficina) => (
                    <div key={oficina.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-50 border border-neutral-200 rounded-2xl p-4 gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-fg-strong truncate">{oficina.nome}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            oficina.status === 'aprovado' ? 'bg-green-50 text-green-700 border-green-200' :
                            oficina.status === 'rejeitado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {oficina.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-fg-muted mt-1">
                          Responsável: {oficina.responsavel} • Contacto: {oficina.telefone} • Criador: {oficina.criador}
                        </p>
                        <p className="text-xs text-fg-muted mt-0.5 font-medium">
                          Especialidades: {oficina.especialidades.map(e => ESPECIALIDADES_LABELS[e]).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {oficina.status === 'pendente' && (
                          <>
                            <Button tipo="verde" tamanho="sm" onClick={() => handleApproveOficina(oficina.id)}>Aprovar</Button>
                            <Button tipo="perigo" tamanho="sm" onClick={() => handleRejectOficina(oficina.id)}>Rejeitar</Button>
                          </>
                        )}
                        {oficina.status === 'aprovado' && (
                          <Button tipo="aviso" tamanho="sm" onClick={() => handleRejectOficina(oficina.id)}>Desativar</Button>
                        )}
                        {oficina.status === 'rejeitado' && (
                          <Button tipo="verde" tamanho="sm" onClick={() => handleApproveOficina(oficina.id)}>Ativar</Button>
                        )}
                        <Button tipo="perigo" tamanho="sm" onClick={() => handleDeleteOficina(oficina.id)}>Eliminar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'pendentes' && (
            <div className="space-y-6 text-fg-heading">
              
              {/* Header/Subtabs for Pendentes */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSubTabPendentes('anuncios')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                    subTabPendentes === 'anuncios'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                      : 'bg-slate-50 text-fg-muted hover:text-fg-strong border border-neutral-200'
                  }`}
                >
                  <List className="text-sm" /> Anúncios ({totalAnunciosPendentes})
                </button>

                <button
                  onClick={() => setSubTabPendentes('oficinas')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                    subTabPendentes === 'oficinas'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-50 text-fg-muted hover:text-fg-strong border border-neutral-200'
                  }`}
                >
                  <Wrench className="text-sm" /> Oficinas ({totalOficinasPendentes})
                </button>

                <button
                  onClick={() => setSubTabPendentes('avaliacoes')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                    subTabPendentes === 'avaliacoes'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                      : 'bg-slate-50 text-fg-muted hover:text-fg-strong border border-neutral-200'
                  }`}
                >
                  <StarHalf className="text-sm" /> Avaliações ({reviewsPendentes})
                </button>

                <button
                  onClick={() => setSubTabPendentes('denuncias')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                    subTabPendentes === 'denuncias'
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                      : 'bg-slate-50 text-fg-muted hover:text-fg-strong border border-neutral-200'
                  }`}
                >
                  <Flag className="text-sm" /> Denúncias ({reportsPendentes + intencoesDenunciasPendentes})
                </button>

                <button
                  onClick={() => setSubTabPendentes('verificacoes')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                    subTabPendentes === 'verificacoes'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'bg-slate-50 text-fg-muted hover:text-fg-strong border border-neutral-200'
                  }`}
                >
                  <ShieldCheck className="text-sm" /> Verificações ({verificationsPendentes})
                </button>
              </div>

              {/* Subtab content */}
              {subTabPendentes === 'anuncios' && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                  <h3 className="text-sm font-extrabold text-fg-heading mb-4 flex items-center gap-2">
                    <List className="text-amber-700" /> Anúncios Pendentes de Moderação
                  </h3>
                  <ListingsTable
                    carros={carrosOrdenados}
                    pecas={pecasOrdenados}
                    defaultTab="carros"
                    statusFilter="pendente"
                    onDeleteCarro={handleDeleteCarro}
                    onDeletePeca={handleDeletePeca}
                    onApproveCarro={handleApproveCarro}
                    onRejectCarro={handleRejectCarro}
                    onApprovePeca={handleApprovePeca}
                    onRejectPeca={handleRejectPeca}
                    onUpdateCarro={handleUpdateCarro}
                    onUpdatePeca={handleUpdatePeca}
                    onBulkAction={handleBulkAction}
                  />
                </div>
              )}

              {subTabPendentes === 'oficinas' && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                  <h3 className="text-sm font-extrabold text-fg-heading mb-4 flex items-center gap-2">
                    <Wrench className="text-blue-700" /> Oficinas & Mecânicos Pendentes
                  </h3>
                  {oficinasAdmin.filter(o => o.status === 'pendente').length === 0 ? (
                    <p className="text-xs text-fg-muted">Nenhuma oficina pendente de moderação.</p>
                  ) : (
                    <div className="space-y-4">
                      {oficinasAdmin.filter(o => o.status === 'pendente').map((oficina) => (
                        <div key={oficina.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-50 border border-neutral-200 rounded-2xl p-4 gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-fg-strong truncate">{oficina.nome}</p>
                            <p className="text-xs text-fg-muted mt-1">
                              Responsável: {oficina.responsavel} • Contacto: {oficina.telefone} • Criador: {oficina.criador}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button tipo="verde" tamanho="sm" onClick={() => handleApproveOficina(oficina.id)}>Aprovar</Button>
                            <Button tipo="perigo" tamanho="sm" onClick={() => handleRejectOficina(oficina.id)}>Rejeitar</Button>
                            <Button tipo="perigo" tamanho="sm" onClick={() => handleDeleteOficina(oficina.id)}>Eliminar</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {subTabPendentes === 'avaliacoes' && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                  <ReviewsQueue
                    reviews={adminReviews}
                    loading={reviewsAdminLoading}
                    onApprove={handleApproveReview}
                    onReject={handleRejectReview}
                    onDelete={handleDeleteReview}
                  />
                </div>
              )}

              {subTabPendentes === 'denuncias' && (
                <div className="space-y-6">
                  <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                    <ReportsQueue
                      reports={reports}
                      loading={reportsLoading}
                      onUpdateStatus={handleReportStatusUpdate}
                    />
                  </div>

                  {denunciasIntencao.length > 0 && (
                    <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                      <h3 className="text-sm font-extrabold text-fg-heading mb-4 flex items-center gap-2">
                        <Flag className="text-red-700" /> Denúncias de Intenções
                      </h3>
                      <div className="space-y-2">
                        {denunciasIntencao.map((denuncia) => (
                          <div key={denuncia.id} className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-fg-strong">Motivo: {denuncia.motivo}</p>
                              <p className="text-xs text-fg-muted mt-0.5">{denuncia.descricao} • Status: {denuncia.status}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                              <Button tipo="perigo" tamanho="sm" onClick={async () => { await updateIntencaoStatus(denuncia.intencaoId, 'deletada'); await updateDenunciaIntencaoStatus(denuncia.id, 'resolvida', auth.user?.email || 'admin', 'remocao'); setIntencoesAdmin((prev) => prev.filter((i) => i.id !== denuncia.intencaoId)); }}>Remover Intenção</Button>
                              <Button tipo="aviso" tamanho="sm" onClick={() => updateDenunciaIntencaoStatus(denuncia.id, 'resolvida', auth.user?.email || 'admin', 'aviso')}>Avisar</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {subTabPendentes === 'verificacoes' && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                  <VerificationsQueue
                    verifications={verifications}
                    loading={verificationsLoading}
                    onUpdateStatus={handleVerificationStatusUpdate}
                  />
                </div>
              )}
            </div>
          )}

          {tab === 'premium' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 text-fg-heading">
              <h2 className="text-lg font-extrabold text-fg-heading mb-4 flex items-center gap-2">
                <Crown className="text-pink-700 shrink-0" weight="fill" /> Controlo de Módulos Premium
              </h2>
              <PremiumTogglePanel />
            </div>
          )}

          {tab === 'seguro-financiamento' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 text-fg-heading">
              <SeguroFinanciamentoTab />
            </div>
          )}

          {tab === 'banners' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 text-fg-heading">
              <BannersTab />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
