'use client';

import { useState, useEffect } from 'react';
import { subscribeBanners, addBanner, updateBanner, deleteBanner } from '@/lib/db';
import type { Banner, BannerInput } from '@/types/banner';
import { useToast } from '@/components/ui/Toast';
import { useApp } from '@/providers/AppProvider';
import { Plus, PencilSimpleLine, Trash, CircleNotch, Eye, EyeSlash, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

const BADGE_CORES = [
  { value: 'brand', label: 'Marca (Azul Recar Garage)' },
  { value: 'accent', label: 'Destaque (Laranja/Amarelo)' },
  { value: 'green', label: 'Verde (Sucesso)' },
  { value: 'blue', label: 'Azul (Info)' },
  { value: 'yellow', label: 'Amarelo' },
  { value: 'gray', label: 'Cinza' },
] as const;

const GRADIENTES_PADRAO = [
  { value: 'from-brand-600 via-brand-700 to-brand-900', label: 'Azul Recar Garage' },
  { value: 'from-amber-600 via-orange-700 to-orange-950', label: 'Laranja Quente' },
  { value: 'from-blue-600 via-blue-700 to-indigo-900', label: 'Índigo Profundo' },
  { value: 'from-emerald-600 via-teal-700 to-emerald-900', label: 'Verde Esmeralda' },
  { value: 'from-purple-600 via-pink-700 to-rose-950', label: 'Púrpura Imperial' },
  { value: 'from-slate-800 via-slate-900 to-zinc-950', label: 'Escuro Metálico' },
];

export default function BannersTab() {
  const toast = useToast();
  const { auth } = useApp();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Banner | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [form, setForm] = useState({
    title: '',
    description: '',
    badge: '',
    badgeCor: 'brand' as Banner['badgeCor'],
    price: '',
    ctaText: '',
    link: '',
    gradient: 'from-brand-600 via-brand-700 to-brand-900',
    ativo: true,
    ordem: 0,
  });

  useEffect(() => {
    const unsub = subscribeBanners(
      (data) => {
        setBanners(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast?.erro('Erro ao carregar banners.');
        setLoading(false);
      }
    );
    return unsub;
  }, [toast]);

  const openAddModal = () => {
    setEditingBanner(null);
    setForm({
      title: '',
      description: '',
      badge: '',
      badgeCor: 'brand',
      price: '',
      ctaText: 'Ver Detalhes',
      link: '',
      gradient: 'from-brand-600 via-brand-700 to-brand-900',
      ativo: true,
      ordem: banners.length > 0 ? Math.max(...banners.map((b) => b.ordem)) + 10 : 10,
    });
    setModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      description: banner.description,
      badge: banner.badge,
      badgeCor: banner.badgeCor,
      price: banner.price || '',
      ctaText: banner.ctaText,
      link: banner.link,
      gradient: banner.gradient,
      ativo: banner.ativo,
      ordem: banner.ordem,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.user) return;
    setActionLoading(true);

    const bannerData: BannerInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      badge: form.badge.trim(),
      badgeCor: form.badgeCor,
      price: form.price.trim() || undefined,
      ctaText: form.ctaText.trim(),
      link: form.link.trim(),
      gradient: form.gradient,
      ativo: form.ativo,
      ordem: Number(form.ordem),
    };

    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerData);
        toast?.sucesso('Banner atualizado com sucesso!');
      } else {
        await addBanner(bannerData);
        toast?.sucesso('Banner adicionado com sucesso!');
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      toast?.erro('Erro ao guardar banner.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await deleteBanner(confirmDelete.id);
      toast?.sucesso('Banner eliminado com sucesso!');
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      toast?.erro('Erro ao eliminar banner.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAtivo = async (banner: Banner) => {
    try {
      await updateBanner(banner.id, { ativo: !banner.ativo });
      toast?.sucesso(`Banner ${!banner.ativo ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (err) {
      console.error(err);
      toast?.erro('Erro ao alterar estado do banner.');
    }
  };

  const handleMoveOrder = async (banner: Banner, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex((b) => b.id === banner.id);
    if (currentIndex === -1) return;

    let targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const targetBanner = banners[targetIndex];
    
    // Swap ordres
    const tempOrdem = banner.ordem;
    try {
      await Promise.all([
        updateBanner(banner.id, { ordem: targetBanner.ordem }),
        updateBanner(targetBanner.id, { ordem: tempOrdem }),
      ]);
      toast?.sucesso('Ordem atualizada.');
    } catch (err) {
      console.error(err);
      toast?.erro('Erro ao ordenar.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg-heading">Gestão de Banners Promocionais</h2>
          <p className="text-xs text-fg-muted">Crie, edite ou ordene os banners rotativos que aparecem no topo da página principal.</p>
        </div>
        <Button tipo="premium" icone={<Plus />} onClick={openAddModal}>
          Adicionar Banner
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <CircleNotch size={32} className="animate-spin text-accent" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <p className="text-fg-muted mb-4">Ainda não existem banners criados.</p>
          <Button tipo="premium" icone={<Plus />} onClick={openAddModal}>
            Criar Primeiro Banner
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-fg-subtle uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                  <th className="p-4 w-16">Ordem</th>
                  <th className="p-4">Visualização Rápida (Preview)</th>
                  <th className="p-4">Badge / Categoria</th>
                  <th className="p-4">Ações / Destino</th>
                  <th className="p-4 w-28 text-center">Estado</th>
                  <th className="p-4 w-36 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {banners.map((b, index) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-fg-heading">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-fg-muted">#{b.ordem}</span>
                        <div className="flex gap-0.5">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveOrder(b, 'up')}
                            className="p-1 rounded hover:bg-slate-200 text-fg-muted disabled:opacity-30"
                            title="Mover para cima"
                          >
                            <ArrowUp size={12} weight="bold" />
                          </button>
                          <button
                            disabled={index === banners.length - 1}
                            onClick={() => handleMoveOrder(b, 'down')}
                            className="p-1 rounded hover:bg-slate-200 text-fg-muted disabled:opacity-30"
                            title="Mover para baixo"
                          >
                            <ArrowDown size={12} weight="bold" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className={`p-4 rounded-xl text-white bg-gradient-to-r ${b.gradient} relative overflow-hidden shadow-inner`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge cor={b.badgeCor} variante="solid" tamanho="sm">
                            {b.badge}
                          </Badge>
                          {b.price && (
                            <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">
                              {b.price}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs truncate">{b.title}</h4>
                        <p className="text-[10px] text-white/80 line-clamp-1 mt-0.5">{b.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-fg-heading text-xs">{b.badge}</span>
                        <span className="text-[10px] text-fg-muted capitalize">Cor: {b.badgeCor}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="font-semibold text-fg-heading">{b.ctaText}</div>
                        <div className="text-[10px] text-accent truncate max-w-[150px]" title={b.link}>
                          {b.link}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleAtivo(b)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                          b.ativo
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-slate-100 text-fg-muted hover:bg-slate-200'
                        }`}
                        title={b.ativo ? 'Clique para desativar' : 'Clique para ativar'}
                      >
                        {b.ativo ? (
                          <>
                            <Eye size={14} /> Ativo
                          </>
                        ) : (
                          <>
                            <EyeSlash size={14} /> Inativo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          tipo="terciario"
                          tamanho="sm"
                          onClick={() => openEditModal(b)}
                          icone={<PencilSimpleLine />}
                          title="Editar"
                        >
                          Editar
                        </Button>
                        <Button
                          tipo="perigo"
                          tamanho="sm"
                          onClick={() => setConfirmDelete(b)}
                          icone={<Trash />}
                          title="Eliminar"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar */}
      <Modal
        show={modalOpen}
        onClose={() => !actionLoading && setModalOpen(false)}
        titulo={editingBanner ? 'Editar Banner' : 'Adicionar Novo Banner'}
        tamanho="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="banner-title" className="block text-xs font-bold text-fg-heading uppercase mb-1">Título do Banner</label>
              <input
                id="banner-title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Destaque a sua Oficina e Receba Mais Clientes"
                className="w-full text-sm rounded-xl border-slate-200 focus:border-accent focus:ring-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="banner-desc" className="block text-xs font-bold text-fg-heading uppercase mb-1">Descrição</label>
              <textarea
                id="banner-desc"
                required
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Adira ao plano 'Oficina Verificada' para aparecer no topo das buscas..."
                className="w-full text-sm rounded-xl border-slate-200 focus:border-accent focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="banner-badge" className="block text-xs font-bold text-fg-heading uppercase mb-1">Texto da Badge</label>
              <input
                id="banner-badge"
                type="text"
                required
                value={form.badge}
                onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                placeholder="Ex: Stands & Lojas"
                className="w-full text-sm rounded-xl border-slate-200 focus:border-accent focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="banner-badge-cor" className="block text-xs font-bold text-fg-heading uppercase mb-1">Cor da Badge</label>
              <select
                id="banner-badge-cor"
                value={form.badgeCor}
                onChange={(e) => setForm((p) => ({ ...p, badgeCor: e.target.value as Banner['badgeCor'] }))}
                className="w-full text-sm rounded-xl border-slate-200 focus:border-accent focus:ring-accent"
              >
                {BADGE_CORES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="banner-price" className="block text-xs font-bold text-fg-heading uppercase mb-1">Subtexto de Preço (Opcional)</label>
              <input
                id="banner-price"
                type="text"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="Ex: Desde €15/mês ou Simulação Grátis"
                className="w-full text-sm rounded-xl border-slate-200 focus:border-accent focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="banner-ordem" className="block text-xs font-bold text-fg-heading uppercase mb-1">Ordem de Exibição</label>
              <input
                id="banner-ordem"
                type="number"
                required
                value={form.ordem}
                onChange={(e) => setForm((p) => ({ ...p, ordem: Number(e.target.value) }))}
                placeholder="Ex: 10"
                className="w-full text-sm rounded-xl border-slate-200 focus:border-accent focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="banner-cta" className="block text-xs font-bold text-fg-heading uppercase mb-1">Texto do Botão (CTA)</label>
              <input
                id="banner-cta"
                type="text"
                required
                value={form.ctaText}
                onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))}
                placeholder="Ex: Ver Planos"
                className="w-full text-sm rounded-xl border-slate-200 focus:border-accent focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="banner-link" className="block text-xs font-bold text-fg-heading uppercase mb-1">Link de Destino</label>
              <input
                id="banner-link"
                type="text"
                required
                value={form.link}
                onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                placeholder="Ex: /oficinas/registar ou #"
                className="w-full text-sm rounded-xl border-slate-200 focus:border-accent focus:ring-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="banner-gradient" className="block text-xs font-bold text-fg-heading uppercase mb-1">Fundo (Degradê)</label>
              <select
                id="banner-gradient"
                value={form.gradient}
                onChange={(e) => setForm((p) => ({ ...p, gradient: e.target.value }))}
                className="w-full text-sm rounded-xl border-slate-200 focus:border-accent focus:ring-accent mb-2"
              >
                {GRADIENTES_PADRAO.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
                <option value="custom">-- Introduzir classe CSS personalizada --</option>
              </select>
              {form.gradient === 'custom' || !GRADIENTES_PADRAO.some(g => g.value === form.gradient) ? (
                <input
                  type="text"
                  required
                  value={form.gradient === 'custom' ? '' : form.gradient}
                  onChange={(e) => setForm((p) => ({ ...p, gradient: e.target.value }))}
                  placeholder="Ex: from-rose-500 via-red-600 to-red-800"
                  className="w-full text-sm rounded-xl border-slate-200 focus:border-accent focus:ring-accent"
                />
              ) : null}
            </div>

            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <input
                id="banner-ativo"
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
                className="rounded text-accent focus:ring-accent"
              />
              <label htmlFor="banner-ativo" className="text-sm font-bold text-fg-heading cursor-pointer">
                Exibir banner imediatamente na homepage (Ativo)
              </label>
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h5 className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">Pré-visualização em tempo real</h5>
            <div className={`p-6 rounded-2xl text-white bg-gradient-to-r ${form.gradient === 'custom' ? 'from-brand-600 to-brand-900' : form.gradient} relative overflow-hidden shadow-lg h-[180px] flex flex-col justify-between`}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  {form.badge && (
                    <Badge cor={form.badgeCor} variante="solid">
                      {form.badge}
                    </Badge>
                  )}
                  {form.price && (
                    <span className="text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                      {form.price}
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold leading-tight">
                  {form.title || 'Título do seu Banner'}
                </h3>
                <p className="mt-1 text-white/85 text-xs line-clamp-2">
                  {form.description || 'Descrição detalhada do banner promocional...'}
                </p>
              </div>
              <div className="relative z-10">
                <Button tipo="premium" tamanho="sm" disabled>
                  {form.ctaText || 'Botão'}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button tipo="terciario" onClick={() => setModalOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button tipo="premium" type="submit" carregando={actionLoading} disabled={actionLoading}>
              Guardar Banner
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        show={confirmDelete !== null}
        onClose={() => !actionLoading && setConfirmDelete(null)}
        titulo="Eliminar Banner"
      >
        <div className="space-y-4">
          <p className="text-sm text-fg-muted">
            Tem a certeza de que deseja eliminar o banner <span className="font-bold text-fg-heading">"{confirmDelete?.title}"</span>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <Button tipo="terciario" onClick={() => setConfirmDelete(null)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button tipo="perigo" onClick={handleDelete} carregando={actionLoading} disabled={actionLoading}>
              Eliminar Permanentemente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
