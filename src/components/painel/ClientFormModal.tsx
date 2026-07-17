'use client';

import { useState, useEffect } from 'react';
import { Check } from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { CLIENT_STAGE_LABELS } from '@/types/client';
import type { Client, ClientInput, ClientStage } from '@/types/client';

interface Props {
  show: boolean;
  onClose: () => void;
  /** Existing client to edit, or null to create a new one. */
  client: Client | null;
  onSave: (data: ClientInput) => Promise<void>;
}

const STAGES: ClientStage[] = ['lead', 'ativo', 'inativo'];

export default function ClientFormModal({ show, onClose, client, onSave }: Props) {
  const toast = useToast();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [morada, setMorada] = useState('');
  const [distrito, setDistrito] = useState('');
  const [estado, setEstado] = useState<ClientStage>('lead');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [matricula, setMatricula] = useState('');
  const [notas, setNotas] = useState('');
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    const v = client?.veiculos?.[0];
    setNome(client?.nome || '');
    setEmail(client?.email || '');
    setTelefone(client?.telefone || '');
    setMorada(client?.morada || '');
    setDistrito(client?.distrito || '');
    setEstado(client?.estado || 'lead');
    setMarca(v?.marca || '');
    setModelo(v?.modelo || '');
    setAno(v?.ano ? String(v.ano) : '');
    setMatricula(v?.matricula || '');
    setNotas(client?.notas || '');
    setErro('');
  }, [show, client]);

  const handleSave = async () => {
    if (!nome.trim()) {
      setErro('O nome é obrigatório.');
      return;
    }
    setSaving(true);
    // Merge over the existing first vehicle (preserving fields the form doesn't
    // edit, like km/notas) and keep any extra vehicles untouched.
    const existing = client?.veiculos?.[0];
    const rest = client?.veiculos?.slice(1) || [];
    const veiculos = marca.trim() || modelo.trim()
      ? [
          {
            ...existing,
            marca: marca.trim(),
            modelo: modelo.trim(),
            ano: /^\d{4}$/.test(ano.trim()) ? Number(ano.trim()) : undefined,
            matricula: matricula.trim() || undefined,
          },
          ...rest,
        ]
      : rest.length > 0
        ? rest
        : undefined;
    const data: ClientInput = {
      nome: nome.trim(),
      email: email.trim() || undefined,
      telefone: telefone.trim() || undefined,
      morada: morada.trim() || undefined,
      distrito: distrito.trim() || undefined,
      estado,
      origem: client?.origem || 'manual',
      veiculos,
      notas: notas.trim() || undefined,
    };
    try {
      await onSave(data);
      toast?.sucesso(client ? 'Cliente atualizado.' : 'Cliente adicionado.');
      onClose();
    } catch {
      setErro('Erro ao guardar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} titulo={client ? 'Editar cliente' : 'Novo cliente'} tamanho="md">
      <div className="space-y-3">
        <Input label="Nome *" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.pt" />
          <Input label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="912 345 678" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Morada" value={morada} onChange={(e) => setMorada(e.target.value)} placeholder="Rua, nº" />
          <Input label="Distrito" value={distrito} onChange={(e) => setDistrito(e.target.value)} placeholder="Porto" />
        </div>

        <div>
          <label className="block text-xs font-bold text-fg mb-1.5">Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as ClientStage)}
            className="w-full bg-white rounded-xl px-3.5 py-3 text-sm text-fg-strong border border-neutral-300 focus:outline-none focus:ring-3 focus:ring-accent/25 focus:border-accent"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {CLIENT_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="border border-neutral-200 rounded-xl p-3">
          <legend className="text-xs font-bold text-fg-muted px-1">Veículo (opcional)</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="VW" />
            <Input label="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Golf" />
            <Input label="Ano" inputMode="numeric" maxLength={4} value={ano} onChange={(e) => setAno(e.target.value)} placeholder="2018" />
            <Input label="Matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="00-AA-00" />
          </div>
        </fieldset>

        <div>
          <label className="block text-xs font-bold text-fg mb-1.5">Notas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full border border-neutral-300 rounded-xl p-3 text-sm focus:outline-none focus:border-accent resize-none"
            placeholder="Histórico, preferências, próximo serviço…"
          />
        </div>

        {erro && (
          <Alert tipo="erro" className="!p-3 !rounded-lg !items-center font-semibold">
            {erro}
          </Alert>
        )}

        <Button tipo="primario" tamanho="lg" blocoCompleto icone={<Check />} onClick={handleSave} disabled={saving} carregando={saving}>
          {saving ? 'A guardar...' : 'Guardar'}
        </Button>
      </div>
    </Modal>
  );
}
