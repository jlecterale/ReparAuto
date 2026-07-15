import type { Timestamp } from 'firebase/firestore';
import type { Carro } from '@/types/carro';
import type { Peca } from '@/types/peca';

// Duck-typed Firestore Timestamp for tests — same shape the app consumes
// (both the Web SDK class and the REST-fallback objects satisfy it).
export function timestampLike(ms: number): Timestamp {
  return {
    toDate: () => new Date(ms),
    toMillis: () => ms,
    seconds: Math.floor(ms / 1000),
    nanoseconds: (ms % 1000) * 1_000_000,
  } as unknown as Timestamp;
}

export function buildCarro(overrides: Partial<Carro> = {}): Carro {
  return {
    id: 'car-1',
    marca: 'Renault',
    modelo: 'Clio',
    anoFabricacao: 2005,
    preco: 1500,
    km: 180000,
    combustivel: 'Gasolina',
    cambio: 'Manual',
    cor: 'Azul',
    portas: 5,
    local: 'Braga',
    descricao: 'Bom estado',
    estadoVeiculo: 'pronto',
    tiposManutencao: [],
    fotos: ['https://example.com/foto.jpg'],
    criador: 'seller@example.com',
    status: 'aprovado',
    dataCriacao: timestampLike(1719830000000),
    ...overrides,
  };
}

export function buildPeca(overrides: Partial<Peca> = {}): Peca {
  return {
    id: 'peca-1',
    tipo: 'venda',
    titulo: 'Farol esquerdo',
    categoria: 'Iluminação e Óticas',
    marcaCarro: 'Renault',
    preco: 40,
    estado: 'Usado',
    local: 'Porto',
    criador: 'seller@example.com',
    descricao: 'Em bom estado',
    status: 'aprovado',
    dataCriacao: timestampLike(1719830000000),
    ...overrides,
  };
}
