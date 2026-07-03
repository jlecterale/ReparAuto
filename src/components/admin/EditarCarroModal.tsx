'use client';

import { useState, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import {
  TIPOS_COMBUSTIVEL,
  TIPOS_CAMBIO,
  TIPOS_CARROCERIA,
  CONDICOES_VEICULO,
  TIPOS_TRACAO,
  EQUIPAMENTOS_CARRO,
  MAX_FOTOS_CARRO,
} from '@/lib/constants';
import { CAR_PRICE_MAX, validarDadosVeiculo } from '@/lib/carSpec';
import { getDistritoForConcelho, getCoordenadas } from '@/lib/geo';
import { toggleInList, parsePositiveInt } from '@/lib/utils';
import { buildPhotoAngles, toAngleByPhoto, type SpinAngle } from '@/lib/spin360';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import ToggleChip from '@/components/ui/ToggleChip';
import FotosEditor from '@/components/anunciar/FotosEditor';
import { uploadFileToStorage } from '@/lib/upload';
import type { Carro } from '@/types/carro';

interface EditarCarroModalProps {
  show: boolean;
  onClose: () => void;
  carro: Carro;
  onSave: (id: string, dados: Record<string, unknown>) => Promise<void>;
}

export default function EditarCarroModal({ show, onClose, carro, onSave }: EditarCarroModalProps) {
  const { auth } = useApp();
  const toast = useToast();
  const pendingFilesRef = useRef<Map<string, File>>(new Map());

  const [form, setForm] = useState({
    marca: carro.marca,
    modelo: carro.modelo,
    anoFabricacao: String(carro.anoFabricacao),
    anoModelo: carro.anoModelo ? String(carro.anoModelo) : '',
    preco: String(carro.preco),
    km: String(carro.km),
    combustivel: carro.combustivel,
    cambio: carro.cambio,
    cor: carro.cor,
    portas: String(carro.portas),
    bodyType: carro.bodyType ?? '',
    seats: carro.seats != null ? String(carro.seats) : '',
    // Condition is always meaningful (a car is Novo/Usado/Para peças) — legacy
    // listings without one get backfilled as 'Usado' on save, matching mobile.
    condition: carro.condition ?? 'Usado',
    power: carro.power != null ? String(carro.power) : '',
    displacement: carro.displacement != null ? String(carro.displacement) : '',
    traction: carro.traction ?? '',
    local: carro.local,
    distrito: carro.distrito ?? getDistritoForConcelho(carro.local) ?? '',
    descricao: carro.descricao,
    videoUrl: carro.videoUrl ?? '',
    estadoVeiculo: carro.estadoVeiculo,
  });
  const [features, setFeatures] = useState<string[]>(carro.features ?? []);
  const [fotos, setFotos] = useState<string[]>(carro.fotos || []);
  const [angleByPhoto, setAngleByPhoto] = useState<Record<string, SpinAngle>>(() =>
    toAngleByPhoto(carro.fotos || [], carro.photoAngles),
  );
  const [erros, setErros] = useState<Record<string, string>>({});

  const toggleFeature = (feature: string) => {
    setFeatures((prev) => toggleInList(prev, feature));
  };
  const [saving, setSaving] = useState(false);

  const atualizar = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => ({ ...prev, [campo]: '' }));
  };

  // Full error map: vehicle specs + price (validarDadosVeiculo doesn't cover price).
  const computarErros = () => {
    const todos = validarDadosVeiculo(form);
    const precoNum = Number(form.preco);
    if (!form.preco || !Number.isFinite(precoNum) || precoNum <= 0 || precoNum > CAR_PRICE_MAX) {
      todos.preco = `O preço deve estar entre 1 € e ${CAR_PRICE_MAX.toLocaleString('pt-PT')} €.`;
    }
    return todos;
  };

  // Validate a single field on blur for immediate feedback (not only on save).
  const validarCampo = (campoId: string) => {
    const todos = computarErros();
    setErros((prev) => ({ ...prev, [campoId]: todos[campoId] ?? '' }));
  };

  const handleSave = async () => {
    const novosErros = computarErros();
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      toast?.erro('Corrija os campos destacados antes de guardar.');
      return;
    }
    setErros({});
    setSaving(true);
    try {
      // original → uploaded pairs so angle tags (keyed by photo string) can
      // follow each photo to its storage URL.
      const fotosProcessadas = await Promise.all(
        fotos.map(async (foto, index) => {
          if (foto.startsWith('blob:')) {
            const file = pendingFilesRef.current.get(foto);
            if (file) {
              const folder = `ads/${auth.user?.uid || 'admin'}`;
              const ext = file.name.split('.').pop() || 'jpg';
              const fileName = `${Date.now()}_${index}.${ext}`;
              const downloadUrl = await uploadFileToStorage(file, folder, fileName);
              URL.revokeObjectURL(foto);
              pendingFilesRef.current.delete(foto);
              return { original: foto, final: downloadUrl };
            }
          }
          return { original: foto, final: foto };
        }),
      );
      const fotosFinais = fotosProcessadas.map((f) => f.final);
      const photoAngles = buildPhotoAngles(fotosProcessadas, angleByPhoto);

      await onSave(carro.id, {
        marca: form.marca,
        modelo: form.modelo,
        anoFabricacao: Number(form.anoFabricacao),
        anoModelo: form.anoModelo ? Number(form.anoModelo) : null,
        preco: Number(form.preco),
        km: Number(form.km),
        combustivel: form.combustivel,
        cambio: form.cambio,
        cor: form.cor,
        portas: Number(form.portas),
        bodyType: form.bodyType || null,
        seats: parsePositiveInt(form.seats),
        condition: form.condition || null,
        power: parsePositiveInt(form.power),
        displacement: parsePositiveInt(form.displacement),
        traction: form.traction || null,
        features: features.length ? features : null,
        local: form.local,
        // updateDoc rejects undefined (no ignoreUndefinedProperties), so empty
        // optionals must be null — undefined here throws and aborts the save.
        distrito: form.distrito || null,
        coordenadas: (form.local ? getCoordenadas(form.local) : null) ?? null,
        descricao: form.descricao,
        videoUrl: form.videoUrl.trim() || null,
        estadoVeiculo: form.estadoVeiculo,
        fotos: fotosFinais,
        photoAngles,
      });
      onClose();
    } catch (err) {
      console.error('[EditarCarro] Erro:', err);
      toast?.erro('Erro ao guardar as alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const campo = (
    label: string,
    campoId: string,
    type = 'text',
    options: readonly string[] | null = null,
    allowEmpty = false,
    maxLength?: number,
  ) => {
    const numeric = type === 'number';
    return (
    <div>
      <label className="block text-xs font-semibold text-fg-subtle mb-1">{label}</label>
      {options ? (
        <select
          value={form[campoId as keyof typeof form] as string}
          onChange={(e) => atualizar(campoId, e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
        >
          {allowEmpty && <option value="">—</option>}
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          // Numeric fields are digit-only text inputs so maxLength is honoured
          // (type=number ignores it).
          type={numeric ? 'text' : type}
          inputMode={numeric ? 'numeric' : undefined}
          pattern={numeric ? '[0-9]*' : undefined}
          maxLength={maxLength}
          value={form[campoId as keyof typeof form] as string}
          onChange={(e) =>
            atualizar(campoId, numeric ? e.target.value.replace(/\D/g, '').slice(0, maxLength) : e.target.value)
          }
          onBlur={() => validarCampo(campoId)}
          className={`w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent ${
            erros[campoId] ? 'border-red-400' : 'border-gray-300'
          }`}
        />
      )}
      {erros[campoId] && <span className="text-xs text-red-500 mt-1 block">{erros[campoId]}</span>}
    </div>
    );
  };

  return (
    <Modal show={show} onClose={onClose} titulo={`Editar Carro — ${carro.marca} ${carro.modelo}`} tamanho="lg">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {campo('Marca', 'marca')}
        {campo('Modelo', 'modelo')}
        {campo('Ano Fabricação', 'anoFabricacao', 'number', null, false, 4)}
        {campo('Ano Modelo', 'anoModelo', 'number', null, false, 4)}
        {campo('Preço (€)', 'preco', 'number', null, false, 8)}
        {campo('Quilómetros', 'km', 'number', null, false, 6)}
        {campo('Combustível', 'combustivel', 'text', TIPOS_COMBUSTIVEL)}
        {campo('Câmbio', 'cambio', 'text', TIPOS_CAMBIO)}
        {campo('Cor', 'cor', 'text', null, false, 30)}
        {campo('Nº Portas', 'portas', 'number', null, false, 1)}
        {campo('Categoria', 'bodyType', 'text', TIPOS_CARROCERIA, true)}
        {campo('Condição', 'condition', 'text', CONDICOES_VEICULO)}
        {campo('Lugares', 'seats', 'number', null, false, 2)}
        {campo('Potência (cv)', 'power', 'number', null, false, 4)}
        {campo('Cilindrada (cc)', 'displacement', 'number', null, false, 5)}
        {campo('Tração', 'traction', 'text', TIPOS_TRACAO, true)}
        <div className="col-span-2">
          <SeletorLocalizacao
            distrito={form.distrito}
            concelho={form.local}
            onChange={(d, c) => setForm((prev) => ({ ...prev, distrito: d, local: c }))}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-fg-subtle mb-2">Equipamento / Extras</label>
        <div className="flex flex-wrap gap-2">
          {EQUIPAMENTOS_CARRO.map((feature) => (
            <ToggleChip
              key={feature}
              active={features.includes(feature)}
              onClick={() => toggleFeature(feature)}
            >
              {feature}
            </ToggleChip>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-fg-subtle mb-2">Fotos</label>
        <FotosEditor
          fotos={fotos}
          setFotos={setFotos}
          max={MAX_FOTOS_CARRO}
          filesRef={pendingFilesRef}
          angleByPhoto={angleByPhoto}
          onAngleByPhotoChange={setAngleByPhoto}
        />
        {fotos.length === 0 && (
          <p className="text-xs text-red-700 mt-2">Adicione pelo menos 1 foto do veículo.</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-fg-subtle mb-1">Descrição</label>
        <textarea
          rows={4}
          value={form.descricao}
          onChange={(e) => atualizar('descricao', e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-fg-subtle mb-1">Vídeo do YouTube (opcional)</label>
        <input
          type="url"
          value={form.videoUrl}
          onChange={(e) => atualizar('videoUrl', e.target.value)}
          placeholder="Ex: https://www.youtube.com/watch?v=..."
          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-fg-subtle mb-2">Estado do Veículo</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-fg">
            <input
              type="radio"
              name="estadoVeiculo"
              value="pronto"
              checked={form.estadoVeiculo === 'pronto'}
              onChange={() => atualizar('estadoVeiculo', 'pronto')}
              className="text-accent focus:ring-accent w-4 h-4"
            />
            Pronto para rodar
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-fg">
            <input
              type="radio"
              name="estadoVeiculo"
              value="manutencao"
              checked={form.estadoVeiculo === 'manutencao'}
              onChange={() => atualizar('estadoVeiculo', 'manutencao')}
              className="text-accent focus:ring-accent w-4 h-4"
            />
            Precisa de manutenção
          </label>
        </div>
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
          disabled={saving || fotos.length === 0}
          carregando={saving}
        >
          {saving ? 'A guardar...' : 'Guardar Alterações'}
        </Button>
      </div>
    </Modal>
  );
}
