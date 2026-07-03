'use client';

import { useState } from 'react';
import { BellRinging } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { addAlertSubscription, ALERT_INVALID_ERROR, ALERT_LIMIT_ERROR } from '@/lib/db';
import { MAX_ALERT_SUBSCRIPTIONS, MIN_KEYWORD_LENGTH } from '@/lib/alerts';
import type { CategoriaAlerta } from '@/types/alertas';

interface KeywordAlertInputProps {
  uid: string;
  initialKeyword?: string;
  categoria?: CategoriaAlerta;
  onCreated?: () => void;
}

/**
 * Creates a keyword alert ("avise-me quando aparecer …"). Used from the
 * search box entry point and from the "Meus Alertas" section in the profile.
 */
export default function KeywordAlertInput({
  uid,
  initialKeyword = '',
  categoria,
  onCreated,
}: KeywordAlertInputProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const canSave = keyword.trim().length >= MIN_KEYWORD_LENGTH && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await addAlertSubscription(uid, { tipo: 'palavra_chave', nome: '', ativo: true, keyword, categoria });
      toast?.sucesso(`Alerta criado! Avisamos quando surgir "${keyword.trim()}".`);
      setKeyword('');
      onCreated?.();
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === ALERT_LIMIT_ERROR) {
        toast?.erro(`Atingiu o limite de ${MAX_ALERT_SUBSCRIPTIONS} alertas. Apague um para criar outro.`);
      } else if (code === ALERT_INVALID_ERROR) {
        toast?.erro('Palavra-chave inválida. Use pelo menos 2 caracteres.');
      } else {
        toast?.erro('Não foi possível criar o alerta. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      <Input
        label="Palavra-chave"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder='Ex.: "Golf GTI", "farol Clio"…'
        maxLength={60}
        autoFocus
      />
      <p className="text-xs text-fg-muted">
        Avisamos quando um novo anúncio corresponder a esta pesquisa.
      </p>
      <Button
        type="submit"
        tipo="primario"
        blocoCompleto
        disabled={!canSave}
        carregando={saving}
        icone={<BellRinging />}
      >
        Criar alerta
      </Button>
    </form>
  );
}
