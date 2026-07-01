'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { IntencaoCompra, IntencaoCompraInput, IntencaoContextValue, ContatoIntencao } from '@/types/intencao';
import {
  criarIntencaoCompra,
  getIntencoesPorUsuario,
  getIntencaoCompra,
  atualizarIntencaoCompra,
  deletarIntencaoCompra,
  pausarIntencaoCompra,
  reativarIntencaoCompra,
  buscarIntencoesMatch,
  iniciarContatoIntencao,
  getContatosPorIntencao,
} from '@/lib/db';

export function useIntencoes(userId: string | null): IntencaoContextValue {
  const [intencoes, setIntencoes] = useState<IntencaoCompra[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarIntencoes = useCallback(async () => {
    if (!userId) {
      setIntencoes([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getIntencoesPorUsuario(userId);
      setIntencoes(data.filter((i) => i.status !== 'deletada'));
    } catch (err) {
      console.error('[useIntencoes] Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    carregarIntencoes();
  }, [carregarIntencoes]);

  const criar = useCallback(async (dados: IntencaoCompraInput): Promise<string> => {
    if (!userId) throw new Error('Utilizador não autenticado');
    const id = await criarIntencaoCompra(dados);
    await carregarIntencoes();
    return id;
  }, [carregarIntencoes]);

  const getPorUsuario = useCallback(async (uid: string): Promise<IntencaoCompra[]> => {
    return getIntencoesPorUsuario(uid);
  }, []);

  const getPorId = useCallback(async (id: string): Promise<IntencaoCompra | null> => {
    return getIntencaoCompra(id);
  }, []);

  const atualizar = useCallback(async (id: string, uid: string, updates: Partial<IntencaoCompra>) => {
    await atualizarIntencaoCompra(id, uid, updates as Record<string, unknown>);
    await carregarIntencoes();
  }, [carregarIntencoes]);

  const pausar = useCallback(async (id: string, uid: string) => {
    await pausarIntencaoCompra(id, uid);
    await carregarIntencoes();
  }, [carregarIntencoes]);

  const reativar = useCallback(async (id: string, uid: string) => {
    await reativarIntencaoCompra(id, uid);
    await carregarIntencoes();
  }, [carregarIntencoes]);

  const deletar = useCallback(async (id: string, uid: string) => {
    await deletarIntencaoCompra(id, uid);
    await carregarIntencoes();
  }, [carregarIntencoes]);

  const buscarMatch = useCallback(async (carro: any, usuarioId: string): Promise<IntencaoCompra[]> => {
    return buscarIntencoesMatch(carro, usuarioId);
  }, []);

  const iniciarContato = useCallback(async (
    intencaoId: string,
    vendedorId: string,
    carroId?: string,
    mensagem?: string,
  ): Promise<string> => {
    return iniciarContatoIntencao(intencaoId, vendedorId, carroId, mensagem);
  }, []);

  const listarContatos = useCallback(async (intencaoId: string): Promise<ContatoIntencao[]> => {
    return getContatosPorIntencao(intencaoId);
  }, []);

  return useMemo(() => ({
    intencoes,
    loading,
    criarIntencao: criar,
    getIntencoesPorUsuario: getPorUsuario,
    getIntencaoPorId: getPorId,
    atualizarIntencao: atualizar,
    pausarIntencao: pausar,
    reativarIntencao: reativar,
    deletarIntencao: deletar,
    buscarIntencoesMatch: buscarMatch,
    iniciarContato,
    getContatosPorIntencao: listarContatos,
  }), [
    intencoes,
    loading,
    criar,
    getPorUsuario,
    getPorId,
    atualizar,
    pausar,
    reativar,
    deletar,
    buscarMatch,
    iniciarContato,
    listarContatos,
  ]);
}
