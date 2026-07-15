'use client';

import { useState, useCallback, useRef } from 'react';
import { estadoForUf, toTitleCasePt } from '@/lib/ibge';

// Brazil CEP → address lookup, mirroring the PT useCodigoPostal interface so the
// profile forms can pick one by market and reuse the same auto-fill wiring.
// Uses BrasilAPI (already allowed by the CSP), returning the state (mapped to
// its full name to match the picker) and the city.
interface CepBrResult {
  loading: boolean;
  localidade: string;
  distrito: string;
  concelho: string;
  ruas: string[];
  erro: string;
  buscar: (cep: string) => Promise<void>;
}

export function useCepBr(): CepBrResult {
  const [loading, setLoading] = useState(false);
  const [localidade, setLocalidade] = useState('');
  const [distrito, setDistrito] = useState('');
  const [ruas, setRuas] = useState<string[]>([]);
  const [erro, setErro] = useState('');
  const lastCep = useRef('');

  const buscar = useCallback(async (cep: string) => {
    const digits = (cep || '').replace(/\D/g, '');
    if (digits.length !== 8) {
      setErro('');
      return;
    }
    if (digits === lastCep.current) return;
    lastCep.current = digits;

    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`);
      if (!res.ok) throw new Error(`CEP lookup failed: ${res.status}`);
      const data = (await res.json()) as {
        state?: string;
        city?: string;
        neighborhood?: string;
        street?: string;
      };
      const estado = data.state ? estadoForUf(data.state) : undefined;
      if (estado) setDistrito(estado);
      if (data.city) setLocalidade(toTitleCasePt(data.city));
      const rua = [data.street, data.neighborhood].filter(Boolean).join(', ');
      setRuas(rua ? [rua] : []);
    } catch {
      // Unknown/invalid CEP — leave the fields for manual entry.
      setErro('CEP não encontrado. Preencha manualmente.');
      lastCep.current = '';
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, localidade, distrito, concelho: localidade, ruas, erro, buscar };
}
