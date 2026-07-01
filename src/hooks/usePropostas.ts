'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getPropostasPorVendedor,
  getPropostasPorComprador,
  criarProposta,
  atualizarProposta,
} from '@/lib/db';
import type { Proposta, PropostaInput, StatusProposta } from '@/types/proposal';

export default function usePropostas(uid: string | undefined) {
  const [enviadas, setEnviadas] = useState<Proposta[]>([]);
  const [recebidas, setRecebidas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!uid) {
      setEnviadas([]);
      setRecebidas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [env, rec] = await Promise.all([
        getPropostasPorVendedor(uid),
        getPropostasPorComprador(uid),
      ]);
      setEnviadas(env);
      setRecebidas(rec);
    } catch (err) {
      console.error('[usePropostas] Erro ao carregar propostas:', err);
    }
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criar = useCallback(async (dados: PropostaInput): Promise<Proposta> => {
    const proposta = await criarProposta(dados);
    setEnviadas((prev) => [proposta, ...prev]);
    return proposta;
  }, []);

  const responder = useCallback(async (id: string, status: StatusProposta) => {
    await atualizarProposta(id, status);
    setRecebidas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p)),
    );
    setEnviadas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p)),
    );
  }, []);

  return {
    enviadas,
    recebidas,
    loading,
    criar,
    responder,
    recarregar: carregar,
  };
}
