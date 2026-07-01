/**
 * Counts the open moderation work across every admin queue. Used by the admin
 * dashboard (per-queue counts) and the profile screen (total badge). Reads are
 * kept light — one filtered `.get()` per queue — and only run when `enabled`
 * (i.e. the current user is an admin), so regular users never trigger them.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  getAllReports,
  getAllVerifications,
  getPendingCarros,
  getPendingOficinas,
  getPendingPecas,
} from '@/lib/admin';

export interface AdminPendencias {
  carros: number;
  pecas: number;
  oficinas: number;
  denuncias: number;
  verificacoes: number;
}

const ZERO: AdminPendencias = {
  carros: 0,
  pecas: 0,
  oficinas: 0,
  denuncias: 0,
  verificacoes: 0,
};

export function useAdminPendencias(enabled: boolean) {
  const [contagens, setContagens] = useState<AdminPendencias>(ZERO);
  const [loading, setLoading] = useState(enabled);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    const [carros, pecas, oficinas, reports, verifications] = await Promise.all([
      getPendingCarros(),
      getPendingPecas(),
      getPendingOficinas(),
      getAllReports(),
      getAllVerifications(),
    ]);
    setContagens({
      carros: carros.length,
      pecas: pecas.length,
      oficinas: oficinas.length,
      denuncias: reports.filter((r) => r.status === 'pendente' || r.status === 'em_analise').length,
      verificacoes: verifications.filter((v) => v.status === 'pendente').length,
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setContagens(ZERO);
      setLoading(false);
      return;
    }
    setLoading(true);
    refetch().finally(() => setLoading(false));
  }, [enabled, refetch]);

  const total =
    contagens.carros +
    contagens.pecas +
    contagens.oficinas +
    contagens.denuncias +
    contagens.verificacoes;

  return { contagens, total, loading, refetch };
}
