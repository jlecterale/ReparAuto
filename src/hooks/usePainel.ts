'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCarrosByCreator,
  getPecasByCreator,
  getOficinasByCreator,
  getSellerDailyRange,
} from '@/lib/db';
import type { Carro } from '@/types/carro';
import type { Peca } from '@/types/peca';
import type { OficinaMecanico } from '@/types/oficina';
import type { Usuario } from '@/types/usuario';
import type { DashboardPeriod, DashboardSummary, MetricPoint } from '@/types/dashboard';

interface PainelData {
  carros: Carro[];
  pecas: Peca[];
  oficinas: OficinaMecanico[];
  points: MetricPoint[];
  summary: DashboardSummary;
  loading: boolean;
  reload: () => void;
}

const EMPTY_SUMMARY: DashboardSummary = {
  anunciosAtivos: 0,
  anunciosPendentes: 0,
  visualizacoesTotais: 0,
  contactosTotais: 0,
  favoritosTotais: 0,
  viewsPeriodo: 0,
  viewsPeriodoAnterior: 0,
  contactsPeriodo: 0,
  contactsPeriodoAnterior: 0,
};

export default function usePainel(user: Usuario | null, period: DashboardPeriod): PainelData {
  const [carros, setCarros] = useState<Carro[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [oficinas, setOficinas] = useState<OficinaMecanico[]>([]);
  const [allPoints, setAllPoints] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const email = user?.email;
  const uid = user?.uid;

  useEffect(() => {
    if (!email || !uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      // Fetch 180 days so any period (≤90) has a full preceding window to
      // compare against, and switching periods needs no refetch.
      const [c, p, o, pts] = await Promise.all([
        getCarrosByCreator(email),
        getPecasByCreator(email),
        getOficinasByCreator(email),
        getSellerDailyRange(uid, 180),
      ]);
      if (cancelled) return;
      setCarros(c);
      setPecas(p);
      setOficinas(o);
      setAllPoints(pts);
      setLoading(false);
    })().catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [email, uid, nonce]);

  const points = useMemo(() => allPoints.slice(-period), [allPoints, period]);

  const summary = useMemo<DashboardSummary>(() => {
    if (!email && !uid) return EMPTY_SUMMARY;
    const listings = [...carros, ...pecas];
    const anunciosAtivos = listings.filter((l) => l.status === 'aprovado').length;
    const anunciosPendentes = listings.filter((l) => l.status === 'pendente').length;
    const visualizacoesTotais = listings.reduce((acc, l) => acc + (l.visualizacoes || 0), 0);
    const contactosTotais = listings.reduce((acc, l) => acc + (l.contagemMensagens || 0), 0);
    const favoritosTotais =
      carros.reduce((acc, c) => acc + (c.contagemFavoritos || 0), 0) +
      oficinas.reduce((acc, o) => acc + (o.contagemFavoritos || 0), 0);

    // Current window vs. the equally-sized window before it.
    const current = allPoints.slice(-period);
    const previous = allPoints.slice(-period * 2, -period);
    const sumViews = (arr: MetricPoint[]) => arr.reduce((a, b) => a + b.views, 0);
    const sumContacts = (arr: MetricPoint[]) => arr.reduce((a, b) => a + b.contacts, 0);

    return {
      anunciosAtivos,
      anunciosPendentes,
      visualizacoesTotais,
      contactosTotais,
      favoritosTotais,
      viewsPeriodo: sumViews(current),
      viewsPeriodoAnterior: sumViews(previous),
      contactsPeriodo: sumContacts(current),
      contactsPeriodoAnterior: sumContacts(previous),
    };
  }, [carros, pecas, oficinas, allPoints, period, email, uid]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { carros, pecas, oficinas, points, summary, loading, reload };
}
