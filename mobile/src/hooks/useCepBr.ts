import { useCallback, useRef, useState } from 'react';
import { estadoForUf, toTitleCasePt } from '@/lib/ibge';

// Brazil CEP → address lookup. Given a complete CEP it returns the state
// (mapped to its full name to match the picker), the city, the neighbourhood
// and the street, so the profile form can auto-fill them. Uses BrasilAPI.
// Mirrors the web `src/hooks/useCepBr.ts`.
interface CepBrResult {
  loading: boolean;
  localidade: string;
  distrito: string;
  /** Neighbourhood ("bairro") — first-class in BR addresses; empty on CEP geral. */
  bairro: string;
  ruas: string[];
  erro: string;
  buscar: (cep: string) => Promise<void>;
}

export function useCepBr(): CepBrResult {
  const [loading, setLoading] = useState(false);
  const [localidade, setLocalidade] = useState('');
  const [distrito, setDistrito] = useState('');
  const [bairro, setBairro] = useState('');
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
      setBairro(data.neighborhood ?? '');
      setRuas(data.street ? [data.street] : []);
    } catch {
      // Unknown/invalid CEP — leave the fields for manual entry.
      setErro('CEP não encontrado. Preencha manualmente.');
      lastCep.current = '';
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, localidade, distrito, bairro, ruas, erro, buscar };
}
