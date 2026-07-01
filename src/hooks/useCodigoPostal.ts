'use client';

import { useState, useCallback, useRef } from 'react';

interface GeoApiResponse {
  CP: string;
  CP4: string;
  CP3: string;
  Distrito: string;
  Concelho: string;
  Localidade: string;
  'Designação Postal': string;
  partes: { Artéria: string; Local: string; Troço: string; Porta: string; Cliente: string }[];
  ruas: string[];
  municipio: string;
  codigoineDistrito: string;
  codigoineMunicipio: string;
}

interface CodigoPostalResult {
  loading: boolean;
  localidade: string;
  distrito: string;
  concelho: string;
  ruas: string[];
  erro: string;
  buscar: (cp: string) => Promise<void>;
}

export function useCodigoPostal(): CodigoPostalResult {
  const [loading, setLoading] = useState(false);
  const [localidade, setLocalidade] = useState('');
  const [distrito, setDistrito] = useState('');
  const [concelho, setConcelho] = useState('');
  const [ruas, setRuas] = useState<string[]>([]);
  const [erro, setErro] = useState('');
  const lastCp = useRef('');

  const buscar = useCallback(async (cp: string) => {
    const trimmed = cp.trim();
    if (!trimmed) return;
    if (!/^\d{4}-\d{3}$/.test(trimmed)) {
      setErro('');
      return;
    }
    if (trimmed === lastCp.current) return;
    lastCp.current = trimmed;

    setLoading(true);
    setErro('');

    const fallback = async () => {
      try {
        const fallbackRes = await fetch(`https://api.zippopotam.us/pt/${trimmed}`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.places && fallbackData.places.length > 0) {
            const place = fallbackData.places[0];
            setLocalidade(place['place name'] || '');
            setDistrito(place['state'] || '');
            setConcelho(place['place name'] || '');
            setRuas([]);
            setErro('');
            return true;
          }
        }
      } catch {
        // ignora erro do fallback e deixa seguir para o erro original
      }
      return false;
    };

    try {
      const res = await fetch(`https://json.geoapi.pt/codigo_postal/${trimmed}`);
      if (!res.ok) {
        // Tenta fallback se o geoapi falhar (ex: erro 429 limite de requests)
        const ok = await fallback();
        if (ok) return;

        if (res.status === 404) {
          setErro('Código postal não encontrado.');
        } else {
          setErro('Erro ao consultar código postal.');
        }
        setLocalidade('');
        setDistrito('');
        setConcelho('');
        setRuas([]);
        return;
      }
      const data: GeoApiResponse = await res.json();
      setLocalidade(data.Localidade || '');
      setDistrito(data.Distrito || '');
      setConcelho(data.Concelho || '');
      setRuas(data.ruas || []);
      setErro('');
    } catch {
      // Tenta fallback se houver erro de rede/CORS ou offline
      const ok = await fallback();
      if (ok) return;

      setErro('Erro de rede ao consultar código postal.');
      setLocalidade('');
      setDistrito('');
      setConcelho('');
      setRuas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, localidade, distrito, concelho, ruas, erro, buscar };
}
