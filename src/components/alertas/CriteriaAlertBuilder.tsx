'use client';

import { useState } from 'react';
import { BellRinging, Car, Gear, Wrench } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SegmentedControl from '@/components/ui/SegmentedControl';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import { useToast } from '@/components/ui/Toast';
import { addAlertSubscription, ALERT_INVALID_ERROR, ALERT_LIMIT_ERROR } from '@/lib/db';
import { MAX_ALERT_SUBSCRIPTIONS } from '@/lib/alerts';
import type { CategoriaAlerta } from '@/types/alertas';

interface CriteriaAlertBuilderProps {
  uid: string;
  onCreated?: () => void;
}

const TIPOS_ANUNCIO = [
  { value: '', label: 'Todos' },
  { value: 'venda', label: 'Venda' },
  { value: 'desmonte', label: 'Desmonte' },
  { value: 'procura', label: 'Procura' },
];

/**
 * Builds a criteria alert: category (cars/parts/workshops), optional brand
 * and optional region. The matching itself runs server-side (Cloud
 * Functions) when new listings are approved.
 */
export default function CriteriaAlertBuilder({ uid, onCreated }: CriteriaAlertBuilderProps) {
  const [categoria, setCategoria] = useState<CategoriaAlerta>('carros');
  const [tipoAnuncio, setTipoAnuncio] = useState('');
  const [marca, setMarca] = useState('');
  const [distrito, setDistrito] = useState('');
  const [concelho, setConcelho] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await addAlertSubscription(uid, {
        tipo: 'criterio',
        nome: '',
        ativo: true,
        criteria: {
          categoria,
          tipoAnuncio: categoria === 'pecas' && tipoAnuncio ? tipoAnuncio : undefined,
          marca: marca || undefined,
          distrito: distrito || undefined,
          concelho: concelho || undefined,
        },
      });
      toast?.sucesso('Alerta criado! Avisamos quando surgirem novos anúncios.');
      onCreated?.();
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === ALERT_LIMIT_ERROR) {
        toast?.erro(`Atingiu o limite de ${MAX_ALERT_SUBSCRIPTIONS} alertas. Apague um para criar outro.`);
      } else if (code === ALERT_INVALID_ERROR) {
        toast?.erro('Não foi possível criar o alerta com estes critérios.');
      } else {
        toast?.erro('Não foi possível criar o alerta. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      <div>
        <p className="text-xs font-bold text-fg mb-1.5">Categoria</p>
        <SegmentedControl
          ariaLabel="Categoria do alerta"
          value={categoria}
          onChange={(value) => setCategoria(value as CategoriaAlerta)}
          options={[
            { value: 'carros', label: 'Carros', icone: <Car /> },
            { value: 'pecas', label: 'Peças', icone: <Gear /> },
            { value: 'oficinas', label: 'Oficinas', icone: <Wrench /> },
          ]}
        />
      </div>

      {categoria === 'pecas' && (
        <div>
          <label className="block text-xs font-bold text-fg mb-1.5" htmlFor="alert-tipo-anuncio">
            Tipo de anúncio
          </label>
          <select
            id="alert-tipo-anuncio"
            value={tipoAnuncio}
            onChange={(e) => setTipoAnuncio(e.target.value)}
            className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-3 text-sm text-fg-strong focus:outline-none focus:ring-3 focus:ring-accent/25 focus:border-accent transition"
          >
            {TIPOS_ANUNCIO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {categoria !== 'oficinas' && (
        <Input
          label="Marca (opcional)"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          placeholder="Ex.: BMW, Renault…"
          maxLength={60}
        />
      )}

      <SeletorLocalizacao
        distrito={distrito}
        concelho={concelho}
        onChange={(d, c) => {
          setDistrito(d);
          setConcelho(c);
        }}
      />
      <p className="text-xs text-fg-muted">
        Deixe a localização vazia para receber alertas de todo o país.
      </p>

      <Button
        type="submit"
        tipo="primario"
        blocoCompleto
        carregando={saving}
        icone={<BellRinging />}
      >
        Criar alerta
      </Button>
    </form>
  );
}
