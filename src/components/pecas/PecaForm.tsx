'use client';

import { useEffect, useRef, useState } from 'react';
import { GearSix, Car, MagnifyingGlass, IdentificationCard, PlusCircle, PencilSimple, UploadSimple, X, type Icon } from '@phosphor-icons/react';
import { CATEGORIAS_PECAS, ESTADOS_PECA, LISTING_PHOTO_ASPECT, MAX_FOTO_SIZE_BYTES, MAX_FOTO_SIZE_MB } from '@/lib/constants';
import { useApp } from '@/providers/AppProvider';
import { getAdminUsers, criarNotificacao } from '@/lib/db';
import { uploadFileToStorage } from '@/lib/upload';
import ImageCropper from '@/components/ui/ImageCropper';
import { getCoordenadas } from '@/lib/geo';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import CompatibilitySelector from '@/components/pecas/CompatibilitySelector';
import Button from '@/components/ui/Button';
import { pickDefined } from '@/lib/compatibility';
import type { CompatibilityEntry } from '@/types/peca';

interface PecaFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PecaForm({ onSuccess, onCancel }: PecaFormProps) {
  const { pecas, auth } = useApp();
  const { publicarPeca } = pecas;
  const { user } = auth;

  const telefoneInicial = user?.telefone || '';

  const [form, setForm] = useState({
    tipo: 'venda',
    titulo: '',
    categoria: 'Motor e Transmissão',
    estado: 'Usado',
    preco: '',
    precoNovoReferencia: '',
    numeroOEM: '',
    descricao: '',
    localizacao: '',
    localizacaoDistrito: '',
    vendedorTelefone: telefoneInicial,
    vendedorWhatsApp: telefoneInicial,
    vendedorEmail: user?.email || '',
  });

  const [compatibilidades, setCompatibilidades] = useState<CompatibilityEntry[]>([]);
  const [erro, setErro] = useState('');
  const [telefoneDiferente, setTelefoneDiferente] = useState(false);

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoUploading, setFotoUploading] = useState(false);
  // Source image awaiting crop (object URL of the raw pick, or the current preview when re-editing).
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  const atualizar = (campo: string, valor: string) => {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor };
      if (!telefoneDiferente && campo === 'vendedorWhatsApp') {
        next.vendedorTelefone = valor;
      }
      return next;
    });
    setErro('');
  };

  const submit = async () => {
    if (!form.titulo.trim()) {
      setErro('O título é obrigatório.');
      return;
    }
    if (compatibilidades.length === 0) {
      setErro('Adicione pelo menos uma compatibilidade (marca/modelo).');
      return;
    }

    setFotoUploading(true);

    try {
      // Upload photo to Storage if selected
      let fotoUrl: string | undefined;
      if (fotoFile) {
        const folder = `ads/${user?.uid || 'anonimo'}`;
        const ext = fotoFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_peca.${ext}`;
        fotoUrl = await uploadFileToStorage(fotoFile, folder, fileName);
      }

      const primaria = compatibilidades[0];
      const precoNovoNum = form.precoNovoReferencia ? Number(form.precoNovoReferencia) : null;
      const { precoNovoReferencia: _precoRef, localizacao: _loc, localizacaoDistrito: _locDist, numeroOEM: _oem, ...formBase } = form;
      void _precoRef; void _loc; void _locDist; void _oem;
      await publicarPeca(pickDefined({
        ...formBase,
        marcaCarro: primaria.marca,
        modeloCarro: primaria.modelo || undefined,
        compatibilidades,
        numeroOEM: form.numeroOEM.trim() || undefined,
        precoNovoReferencia: precoNovoNum && precoNovoNum > 0 ? precoNovoNum : undefined,
        local: form.localizacao,
        distrito: form.localizacaoDistrito || undefined,
        coordenadas: form.localizacao ? getCoordenadas(form.localizacao) : undefined,
        preco: form.preco ? Number(form.preco) : null,
        foto: fotoUrl || undefined,
        criador: user?.email || '',
        criadorUid: user?.uid || '',
        vendedorNome: user?.nome || 'Anónimo',
        vendedorTelefone: form.vendedorTelefone || null,
        vendedorWhatsApp: form.vendedorWhatsApp || null,
        vendedorEmail: form.vendedorEmail || user?.email || null,
      }));

      getAdminUsers()
        .then((admins) => {
          admins.forEach((a) => {
            criarNotificacao(a.uid, 'info', 'Nova peça pendente', `Uma nova peça foi publicada: ${form.titulo}.`, `/pecas`);
          });
        })
        .catch(() => {});

      if (fotoPreview) URL.revokeObjectURL(fotoPreview);

      setForm({
        tipo: 'venda',
        titulo: '',
        categoria: 'Motor e Transmissão',
        estado: 'Usado',
        preco: '',
        precoNovoReferencia: '',
        numeroOEM: '',
        descricao: '',
        localizacao: '',
        localizacaoDistrito: '',
        vendedorTelefone: '',
        vendedorWhatsApp: '',
        vendedorEmail: '',
      });
      setCompatibilidades([]);
      setFotoFile(null);
      setFotoPreview(null);

      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      const isPermission = msg.includes('permission') || msg.includes('unauthorized');
      const isStorage = msg.includes('storage') || msg.includes('upload');
      if (isPermission) {
        setErro('Erro de permissão. Faça login novamente e tente.');
      } else if (isStorage) {
        setErro('Erro ao enviar foto. Verifique o tamanho da imagem e tente novamente.');
      } else {
        setErro('Erro ao publicar. Tente novamente.');
      }
      console.error('[CriarPeca] Erro:', err);
    } finally {
      setFotoUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-2">
          O QUE PRETENDE ANUNCIAR? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'venda', Icon: GearSix, label: 'Venda de Peça' },
            { value: 'desmonte', Icon: Car, label: 'Desmonte' },
            { value: 'procura', Icon: MagnifyingGlass, label: 'Procura-se' },
          ] as { value: string; Icon: Icon; label: string }[]).map((opt) => (
            <label
              key={opt.value}
              className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl hover:border-accent cursor-pointer transition text-center select-none ${
                form.tipo === opt.value
                  ? 'border-accent bg-orange-50/30'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="pecaTipo"
                value={opt.value}
                checked={form.tipo === opt.value}
                onChange={() => atualizar('tipo', opt.value)}
                className="hidden"
              />
              <opt.Icon size={20} className="text-fg-subtle mb-1" />
              <span className="text-xs font-bold text-fg">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-1">
          Título do Anúncio <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Ex: Motor 1.9 TDI ASZ, Farol BMW E90, etc."
          value={form.titulo}
          onChange={(e) => atualizar('titulo', e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-fg-subtle mb-1">
            Categoria <span className="text-red-500">*</span>
          </label>
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
          <label className="block text-xs font-bold text-fg-subtle mb-1">
            Estado da Peça <span className="text-red-500">*</span>
          </label>
          <select
            value={form.estado}
            onChange={(e) => atualizar('estado', e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
          >
            {ESTADOS_PECA.map((est) => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>
      </div>

      <CompatibilitySelector
        value={compatibilidades}
        onChange={setCompatibilidades}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-fg-subtle mb-1">
            Preço (€) {form.tipo !== 'procura' ? <span className="text-red-500">*</span> : '(opcional)'}
          </label>
          <input
            type="number"
            placeholder={form.tipo === 'procura' ? 'Opcional' : 'Ex: 150'}
            value={form.preco}
            onChange={(e) => atualizar('preco', e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-fg-subtle mb-1">
            Preço de Referência Novo (€) <span className="text-slate-400 font-normal">opcional</span>
          </label>
          <input
            type="number"
            placeholder="Preço novo em catálogo"
            value={form.precoNovoReferencia}
            onChange={(e) => atualizar('precoNovoReferencia', e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-1">
          Referência OEM / Nº Original <span className="text-fg-subtle font-normal">opcional</span>
        </label>
        <input
          type="text"
          placeholder="Ex: 06A115561B"
          value={form.numeroOEM}
          onChange={(e) => atualizar('numeroOEM', e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          O número OEM ajuda compradores a confirmar compatibilidade exata.
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-1">Localização</label>
        <SeletorLocalizacao
          distrito={form.localizacaoDistrito}
          concelho={form.localizacao}
          onChange={(d, c) => {
            atualizar('localizacaoDistrito', d);
            atualizar('localizacao', c);
          }}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-1">Descrição (opcional)</label>
        <textarea
          rows={4}
          placeholder="Descreva o estado da peça, compatibilidade, etc."
          value={form.descricao}
          onChange={(e) => atualizar('descricao', e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-2">Foto do anúncio (opcional)</label>
        <div className="flex items-start gap-3">
          {fotoPreview ? (
            <div className="relative w-24 h-24 flex-shrink-0 group">
              <img
                src={fotoPreview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-xl border border-neutral-200"
              />
              <button
                type="button"
                onClick={() => setCropSrc(fotoPreview)}
                aria-label="Editar foto"
                className="absolute top-1 left-1 w-6 h-6 bg-white/90 text-fg rounded flex items-center justify-center shadow border border-neutral-200 transition hover:bg-white"
              >
                <PencilSimple size={12} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (fotoPreview) URL.revokeObjectURL(fotoPreview);
                  setFotoPreview(null);
                  setFotoFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                aria-label="Remover foto"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger-600 text-white rounded-full flex items-center justify-center shadow"
              >
                <X size={10} weight="bold" />
              </button>
            </div>
          ) : (
            <label className="flex-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 border-dashed text-fg font-semibold px-4 py-6 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer">
              <UploadSimple />
              Carregar Foto
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  if (!file) return;
                  if (file.size > MAX_FOTO_SIZE_BYTES) {
                    setErro(`A imagem excede o limite de ${MAX_FOTO_SIZE_MB} MB.`);
                    return;
                  }
                  setErro('');
                  setCropSrc(URL.createObjectURL(file));
                }}
              />
            </label>
          )}
        </div>

        {cropSrc && (
          <ImageCropper
            src={cropSrc}
            aspect={LISTING_PHOTO_ASPECT}
            titulo={fotoPreview ? 'Editar foto' : 'Ajustar foto'}
            onCancel={() => {
              // Only revoke a freshly-picked source; never the live preview we're re-editing.
              if (cropSrc !== fotoPreview) URL.revokeObjectURL(cropSrc);
              setCropSrc(null);
            }}
            onConfirm={(blob) => {
              const cropped = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
              if (cropSrc !== fotoPreview) URL.revokeObjectURL(cropSrc);
              if (fotoPreview) URL.revokeObjectURL(fotoPreview);
              setFotoFile(cropped);
              setFotoPreview(URL.createObjectURL(cropped));
              setCropSrc(null);
            }}
          />
        )}
        <p className="text-[11px] text-fg-muted mt-1">Formatos JPG, PNG · até {MAX_FOTO_SIZE_MB} MB.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <span className="block text-xs font-bold text-fg-subtle mb-2 flex items-center gap-1">
          <IdentificationCard className="text-blue-600" /> Contacto do Vendedor
        </span>
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] font-semibold text-fg-subtle mb-0.5">WhatsApp / Telefone</label>
            <input
              type="tel"
              placeholder="912345678"
              value={form.vendedorWhatsApp}
              onChange={(e) => atualizar('vendedorWhatsApp', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-fg-muted select-none">
            <input
              type="checkbox"
              checked={telefoneDiferente}
              onChange={(e) => {
                setTelefoneDiferente(e.target.checked);
                if (!e.target.checked) {
                  setForm((prev) => ({ ...prev, vendedorTelefone: prev.vendedorWhatsApp }));
                }
              }}
              className="rounded text-accent focus:ring-accent"
            />
            Telefone diferente do WhatsApp
          </label>
          {telefoneDiferente && (
            <div>
              <label className="block text-[10px] font-semibold text-fg-subtle mb-0.5">Telefone</label>
              <input
                type="tel"
                placeholder="912345678"
                value={form.vendedorTelefone}
                onChange={(e) => atualizar('vendedorTelefone', e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-semibold text-fg-subtle mb-0.5">Email de Contacto</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={form.vendedorEmail}
              onChange={(e) => atualizar('vendedorEmail', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {erro && (
        <p className="text-xs text-red-500 font-semibold">{erro}</p>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <Button
            tipo="secundario"
            onClick={onCancel}
            className="flex-1"
          >
            Voltar
          </Button>
        )}
        <Button
          tipo="primario"
          icone={<PlusCircle />}
          onClick={submit}
          carregando={fotoUploading}
          className="flex-1"
        >
          {fotoUploading ? 'A publicar…' : 'Publicar Anúncio'}
        </Button>
      </div>
    </div>
  );
}
