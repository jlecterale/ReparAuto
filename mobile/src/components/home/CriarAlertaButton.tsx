import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAlertSubscriptions } from '@/hooks/useAlertSubscriptions';
import { sanitizeAlertFiltros } from '@/lib/alertsSanitize';
import { ALERT_INVALID_ERROR, ALERT_LIMIT_ERROR } from '@/lib/alerts';
import type { CarAdvFilters } from '@/hooks/useCarFilters';
import type { AlertFiltros } from '@/types';
import { colors } from '@/theme/colors';

/** Converts the search-screen filter state into the shape the backend matcher understands. */
function toAlertFiltros(busca: string, f: CarAdvFilters): AlertFiltros {
  const n = (v: string): number | undefined => {
    const x = Number(v);
    return v.trim() && !Number.isNaN(x) ? x : undefined;
  };
  return {
    texto: busca || undefined,
    marca: f.marca || undefined,
    modelo: f.modelo || undefined,
    precoMin: n(f.precoMin),
    precoMax: n(f.precoMax),
    kmMin: n(f.kmMin),
    kmMax: n(f.kmMax),
    anoMin: n(f.anoMin),
    anoMax: n(f.anoMax),
    // The backend matcher only supports a single combustível — use the first
    // one selected if the user picked more than one.
    combustivel: f.combustiveis[0],
    estadoVeiculo: f.estado || undefined,
    // Radius search has no server-side equivalent (the matcher compares
    // concelho/distrito equality, not geodistance) — skip location in that mode.
    distrito: f.raioMode ? undefined : f.distrito || undefined,
    concelho: f.raioMode ? undefined : f.concelho || undefined,
  };
}

interface CriarAlertaButtonProps {
  busca: string;
  filters: CarAdvFilters;
}

/**
 * "Criar Alerta" — saves the current search as a saved-filter alert
 * immediately (no naming step). Disables itself right after success and
 * only re-enables once the filters actually change. Mirrors the web app's
 * SaveAlertButton so both platforms share the same instant-create UX.
 */
export function CriarAlertaButton({ busca, filters }: CriarAlertaButtonProps) {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const { showToast } = useToast();
  const { criar, atLimit, limite } = useAlertSubscriptions(user?.uid);
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  const cleanFilters = useMemo(
    () => sanitizeAlertFiltros(toAlertFiltros(busca, filters)),
    [busca, filters],
  );
  const hasFilters = Object.keys(cleanFilters).length > 0;
  const snapshot = useMemo(() => JSON.stringify(cleanFilters), [cleanFilters]);
  const justCreated = savedSnapshot === snapshot;
  const disabled = !hasFilters || justCreated || atLimit || saving;

  function handlePress() {
    requireAuth(async () => {
      if (disabled) return;
      setSaving(true);
      try {
        await criar({ tipo: 'filtro_salvo', nome: '', ativo: true, filters: cleanFilters });
        showToast('Alerta criado!', 'success');
        setSavedSnapshot(snapshot);
      } catch (err) {
        const code = err instanceof Error ? err.message : '';
        if (code === ALERT_LIMIT_ERROR) {
          showToast(`Atingiu o limite de ${limite} alertas. Apague um para criar outro.`, 'error');
        } else if (code === ALERT_INVALID_ERROR) {
          showToast('Defina pelo menos um filtro antes de criar o alerta.', 'error');
        } else {
          showToast('Não foi possível criar o alerta. Tente novamente.', 'error');
        }
      } finally {
        setSaving(false);
      }
    });
  }

  return (
    <View className="mt-4 items-center">
      <Button
        label={justCreated ? 'Alerta criado' : 'Criar Alerta'}
        variant="outline"
        icon={
          <Ionicons
            name={justCreated ? 'checkmark-circle' : 'notifications-outline'}
            size={18}
            color={justCreated ? colors.success[600] : colors.primary[700]}
          />
        }
        onPress={handlePress}
        disabled={user ? disabled : false}
        loading={saving}
        className="w-full"
      />
      {user && !hasFilters && (
        <Text className="mt-1.5 text-xs text-fg-muted">Defina pelo menos um filtro para criar um alerta.</Text>
      )}
      {user && hasFilters && atLimit && !justCreated && (
        <Text className="mt-1.5 text-xs text-fg-muted">Limite de {limite} alertas atingido.</Text>
      )}
    </View>
  );
}
