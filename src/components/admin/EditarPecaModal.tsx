'use client';

import { useState, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CATEGORIAS_PECAS } from '@/lib/constants';
import { useApp } from '@/providers/AppProvider';
import FotosEditor from '@/components/anunciar/FotosEditor';
import { uploadFileToStorage } from '@/lib/upload';
import type { Peca, TipoPeca } from '@/types/peca';

interface EditarPecaModalProps {
  show: boolean;
  onClose: () => void;
  peca: Peca;
  onSave: (id: string, dados: Record<string, unknown>) => Promise<void>;
}

export default function EditarPecaModal({ show, onClose, peca, onSave }: EditarPecaModalProps) {
  const { auth } = useApp();
  const pendingFilesRef = useRef<Map<string, File>>(new Map());

  const [form, setForm] = useState({
    tipo: peca.tipo,
    titulo: peca.titulo,
    categoria: peca.categoria,
    estado: peca.estado,
    marcaCarro: peca.marcaCarro,
    modeloCarro: peca.modeloCarro || '',
    preco: peca.preco != null ? String(peca.preco) : '',
    local: peca.local,
    descricao: peca.descricao,
  });
  const [fotos, setFotos] = useState<string[]>(peca.foto ? [peca.foto] : []);
  const [saving, setSaving] = useState(false);

  const atualizar = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let fotoFinal: string | null = null;
      if (fotos[0]) {
        if (fotos[0].startsWith('blob:')) {
          const file = pendingFilesRef.current.get(fotos[0]);
          if (file) {
            const folder = `ads/${auth.user?.uid || 'admin'}`;
            const ext = file.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}_peca.${ext}`;
            fotoFinal = await uploadFileToStorage(file, folder, fileName);
            URL.revokeObjectURL(fotos[0]);
            pendingFilesRef.current.delete(fotos[0]);
          } else {
            fotoFinal = fotos[0];
          }
        } else {
          fotoFinal = fotos[0];
        }
      }

      await onSave(peca.id, {
        tipo: form.tipo,
        titulo: form.titulo,
        categoria: form.categoria,
        estado: form.estado,
        marcaCarro: form.marcaCarro,
        modeloCarro: form.modeloCarro || null,
        preco: form.preco ? Number(form.preco) : null,
        local: form.local,
        descricao: form.descricao,
        foto: fotoFinal,
      });
      onClose();
    } catch (err) {
      console.error('[EditarPeca] Erro:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} titulo={`Editar Peça — ${peca.titulo}`} tamanho="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-fg-subtle mb-2">Tipo</label>
          <div className="flex gap-2">
            {(['venda', 'desmonte', 'procura'] as TipoPeca[]).map((opt) => (
              <label
                key={opt}
                className={`flex-1 flex items-center justify-center p-2 border-2 rounded-xl cursor-pointer transition text-center select-none text-xs font-bold ${
                  form.tipo === opt
                    ? 'border-accent bg-orange-50/30 text-accent'
                    : 'border-slate-200 bg-slate-50 text-fg-muted'
                }`}
              >
                <input
                  type="radio"
                  name="pecaTipo"
                  value={opt}
                  checked={form.tipo === opt}
                  onChange={() => atualizar('tipo', opt)}
                  className="hidden"
                />
                {opt === 'venda' ? 'Venda' : opt === 'desmonte' ? 'Desmonte' : 'Procura'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-fg-subtle mb-1">Título</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => atualizar('titulo', e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-fg-subtle mb-1">Categoria</label>
            <select
              value={form.categoria}
              onChange={(e) => atualizar('categoria', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
            >
              {CATEGORIAS_PECAS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-fg-subtle mb-1">Estado</label>
            <input
              type="text"
              value={form.estado}
              onChange={(e) => atualizar('estado', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-fg-subtle mb-1">Marca Carro</label>
            <input
              type="text"
              value={form.marcaCarro}
              onChange={(e) => atualizar('marcaCarro', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-fg-subtle mb-1">Modelo (opcional)</label>
            <input
              type="text"
              value={form.modeloCarro}
              onChange={(e) => atualizar('modeloCarro', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-fg-subtle mb-1">Preço (€)</label>
            <input
              type="number"
              value={form.preco}
              onChange={(e) => atualizar('preco', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-fg-subtle mb-1">Local</label>
            <input
              type="text"
              value={form.local}
              onChange={(e) => atualizar('local', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-fg-subtle mb-2">Foto</label>
          <FotosEditor fotos={fotos} setFotos={setFotos} max={1} filesRef={pendingFilesRef} mostrarEmoji={false} />
        </div>

        <div>
          <label className="block text-xs font-bold text-fg-subtle mb-1">Descrição</label>
          <textarea
            rows={4}
            value={form.descricao}
            onChange={(e) => atualizar('descricao', e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-3 justify-end border-t border-slate-200 pt-4">
          <Button
            tipo="secundario"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            tipo="primario"
            onClick={handleSave}
            disabled={saving}
            carregando={saving}
          >
            {saving ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
