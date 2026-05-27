import { useState, useEffect, useCallback } from 'react';
import {
  addVerification,
  getVerificationByUid,
  getAllVerifications,
  updateVerificationStatus,
  updateUserProfile,
  getUserProfile,
} from '@/lib/db';
import type { Verification, VerificationInput, StatusVerificacao } from '@/types/verification';

export default function useVerification(uid: string | undefined) {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!uid) {
      setVerification(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getVerificationByUid(uid);
    setVerification(data);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const pedir = useCallback(async (data: VerificationInput) => {
    const v = await addVerification(data);
    setVerification(v);
    return v;
  }, []);

  return {
    verification,
    loading,
    pedir,
    recarregar: carregar,
  };
}

export function useVerificationsAdmin() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const data = await getAllVerifications();
    setVerifications(data);
    setLoading(false);
  }, []);

  const atualizarStatus = useCallback(async (
    id: string,
    uid: string,
    status: StatusVerificacao,
    resolvidoPor: string,
    notasAdmin?: string,
  ) => {
    await updateVerificationStatus(id, status, resolvidoPor, notasAdmin);
    if (status === 'aprovado') {
      const v = verifications.find((v) => v.id === id);
      const updates: Record<string, unknown> = { verificado: true };
      if (v?.tipo === 'profissional') {
        const profile = await getUserProfile(uid);
        const existingBadges = (profile?.badges || []).filter((b) => b !== 'profissional');
        updates.badges = [...existingBadges, 'profissional'];
      }
      await updateUserProfile(uid, updates);
    }
    setVerifications((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status, resolvidoPor, notasAdmin } : v)),
    );
  }, []);

  return {
    verifications,
    loading,
    carregar,
    atualizarStatus,
  };
}
