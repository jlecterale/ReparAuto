import { useState, useCallback } from 'react';

export interface VinResult {
  vin: string;
  valido: boolean;
  marca?: string;
  modelo?: string;
  ano?: number;
  pais?: string;
  erro?: string;
}

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

function decodeVinBasic(vin: string): Partial<VinResult> {
  const wmi: Record<string, string> = {
    'WBA': 'BMW', 'WBS': 'BMW M', 'WDB': 'Mercedes-Benz', 'WDD': 'Mercedes-Benz',
    'WF0': 'Ford', 'WVW': 'Volkswagen', 'WV2': 'Volkswagen', 'WAU': 'Audi',
    'WP0': 'Porsche', 'VSS': 'SEAT', 'VF1': 'Renault', 'VF3': 'Peugeot',
    'VF7': 'Citroën', 'ZFA': 'Fiat', 'ZAR': 'Alfa Romeo', 'SAL': 'Land Rover',
    'SAJ': 'Jaguar', 'TMA': 'Hyundai', 'KNA': 'Kia', 'JTD': 'Toyota',
    'JHM': 'Honda', 'JN1': 'Nissan', 'JS1': 'Suzuki', 'MA3': 'Suzuki',
    'SHH': 'Honda UK', 'TMB': 'Škoda', 'UU1': 'Dacia', 'W0L': 'Opel',
    'XTA': 'Lada', 'YV1': 'Volvo',
  };

  const prefix = vin.substring(0, 3).toUpperCase();
  const marca = wmi[prefix];

  const yearChar = vin[9]?.toUpperCase();
  const yearMap: Record<string, number> = {
    '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
    '6': 2006, '7': 2007, '8': 2008, '9': 2009,
    'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015,
    'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
    'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025, 'T': 2026,
    'V': 2027, 'W': 2028, 'X': 2029, 'Y': 2030,
  };
  const ano = yearMap[yearChar];

  const countryFirst = vin[0]?.toUpperCase();
  const paisMap: Record<string, string> = {
    'W': 'Alemanha', 'V': 'França/Espanha', 'Z': 'Itália', 'S': 'Reino Unido',
    'J': 'Japão', 'K': 'Coreia do Sul', '1': 'EUA', '2': 'Canadá',
    '3': 'México', 'Y': 'Suécia/Finlândia', 'T': 'Suíça/Hungria/Portugal',
    'U': 'Roménia/França', 'X': 'Rússia', 'M': 'Índia/Indonésia',
  };
  const pais = paisMap[countryFirst];

  return { marca, ano, pais };
}

export default function useVinCheck() {
  const [resultado, setResultado] = useState<VinResult | null>(null);
  const [loading, setLoading] = useState(false);

  const verificar = useCallback((vin: string) => {
    const vinClean = vin.trim().toUpperCase();

    if (!VIN_REGEX.test(vinClean)) {
      setResultado({
        vin: vinClean,
        valido: false,
        erro: 'O VIN deve ter exatamente 17 caracteres alfanuméricos (sem I, O ou Q).',
      });
      return;
    }

    setLoading(true);
    try {
      const decoded = decodeVinBasic(vinClean);
      setResultado({
        vin: vinClean,
        valido: true,
        marca: decoded.marca,
        ano: decoded.ano,
        pais: decoded.pais,
      });
    } catch {
      setResultado({
        vin: vinClean,
        valido: false,
        erro: 'Erro ao verificar o VIN. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const limpar = useCallback(() => {
    setResultado(null);
  }, []);

  return {
    resultado,
    loading,
    verificar,
    limpar,
  };
}
