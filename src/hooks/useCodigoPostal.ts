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

    try {
      const res = await fetch(`https://json.geoapi.pt/codigo_postal/${trimmed}`);
      if (!res.ok) {
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
