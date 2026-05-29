'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TIPOS_COMBUSTIVEL, TIPOS_CAMBIO } from '@/lib/constants';
import { getDistritoForConcelho, getCoordenadas } from '@/lib/geo';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import type { Carro } from '@/types/carro';

interface EditarCarroModalProps {
  show: boolean;
  onClose: () => void;
  carro: Carro;
  onSave: (id: string, dados: Record<string, unknown>) => Promise<void>;
}

export default function EditarCarroModal({ show, onClose, carro, onSave }: EditarCarroModalProps) {
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
    local: carro.local,
    distrito: carro.distrito ?? getDistritoForConcelho(carro.local) ?? '',
    descricao: carro.descricao,
    estadoVeiculo: carro.estadoVeiculo,
  });
  const [saving, setSaving] = useState(false);

  const atualizar = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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
        local: form.local,
        distrito: form.distrito || undefined,
        coordenadas: form.local ? getCoordenadas(form.local) : undefined,
        descricao: form.descricao,
        estadoVeiculo: form.estadoVeiculo,
      });
      onClose();
    } catch (err) {
      console.error('[EditarCarro] Erro:', err);
    } finally {
      setSaving(false);
    }
  };

  const campo = (
    label: string,
    campoId: string,
    type = 'text',
    options: string[] | null = null
  ) => (
    <div>
      <label className="block text-xs font-semibold text-fg-subtle mb-1">{label}</label>
      {options ? (
        <select
          value={form[campoId as keyof typeof form] as string}
          onChange={(e) => atualizar(campoId, e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={form[campoId as keyof typeof form] as string}
          onChange={(e) => atualizar(campoId, e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
        />
      )}
    </div>
  );

  return (
    <Modal show={show} onClose={onClose} titulo={`Editar Carro — ${carro.marca} ${carro.modelo}`} tamanho="lg">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {campo('Marca', 'marca')}
        {campo('Modelo', 'modelo')}
        {campo('Ano Fabricação', 'anoFabricacao', 'number')}
        {campo('Ano Modelo', 'anoModelo', 'number')}
        {campo('Preço (€)', 'preco', 'number')}
        {campo('Quilómetros', 'km', 'number')}
        {campo('Combustível', 'combustivel', 'text', TIPOS_COMBUSTIVEL)}
        {campo('Câmbio', 'cambio', 'text', TIPOS_CAMBIO)}
        {campo('Cor', 'cor')}
        {campo('Nº Portas', 'portas', 'number')}
        <div className="col-span-2">
          <SeletorLocalizacao
            distrito={form.distrito}
            concelho={form.local}
            onChange={(d, c) => setForm((prev) => ({ ...prev, distrito: d, local: c }))}
          />
        </div>
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
          disabled={saving}
          carregando={saving}
        >
          {saving ? 'A guardar...' : 'Guardar Alterações'}
        </Button>
      </div>
    </Modal>
  );
}
