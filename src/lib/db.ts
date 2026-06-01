import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  where,
  setDoc,
  writeBatch,
  Timestamp,
  onSnapshot,
  increment,
  type DocumentData,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { DB_VERSION, DB_VERSION_KEY } from './constants';
import type { Carro, CarroInput, StatusAnuncio } from '@/types/carro';
import type { Peca, PecaInput } from '@/types/peca';
import type { Usuario, Role } from '@/types/usuario';
import type { Notificacao, TipoNotificacao } from '@/types/notificacao';
import type { Review, ReviewInput, StatusReview } from '@/types/review';
import type { Report, ReportInput, StatusReport } from '@/types/report';
import type { Verification, VerificationInput, StatusVerificacao } from '@/types/verification';
import type { IntencaoCompra, IntencaoCompraInput, ContatoIntencao, ContatoIntencaoInput, DenunciaIntencao } from '@/types/intencao';

type CarroSeed = Omit<CarroInput, 'dataCriacao'> & { dataCriacao: ReturnType<typeof Timestamp.now> };
type PecaSeed = Omit<PecaInput, 'dataCriacao'> & { dataCriacao: ReturnType<typeof Timestamp.now> };

const CARROS_COLLECTION = 'cars';
const PECAS_COLLECTION = 'parts';
const OFICINAS_COLLECTION = 'services';

const defaultCarros: CarroSeed[] = [
  {
    marca: 'Renault',
    modelo: 'Clio 1.5 dCi',
    anoFabricacao: 2007,
    anoModelo: 2008,
    preco: 600,
    km: 210000,
    combustivel: 'Diesel',
    cambio: 'Manual',
    cor: 'Cinzento',
    portas: 5,
    local: 'Braga',
    descricao:
      'Viatura comercial com alguns problemas de motor. **Motor de arranque avariado.**\nIdeal para quem quer reparar.\n\n* Direção assistida\n* Fecho centralizado\n* Vidros elétricos',
    estadoVeiculo: 'manutencao',
    tiposManutencao: ['Mecânica', 'Elétrica'],
    manutencaoOutro: '',
    temOrcamento: true,
    orcamentoTexto:
      'Diagnóstico elétrico e motor de arranque novo: 250€ com mão de obra incluída.',
    incluirMecanicoNome: true,
    mecanicoNome: 'Auto Oficina Rapidez',
    incluirMecanicoTelefone: true,
    mecanicoTelefone: '912345678',
    fotos: ['images/clio.png', '🔧', '⚠️'],
    criador: 'admin@reparauto.pt',
    vendedorNome: 'Admin ReparAuto',
    vendedorTelefone: '912345678',
    vendedorWhatsApp: '351912345678',
    vendedorEmail: 'admin@reparauto.pt',
    rodando: false,
    inspecao: false,
    status: 'aprovado',
    dataCriacao: Timestamp.now(),
  },
  {
    marca: 'Peugeot',
    modelo: '206 1.1',
    anoFabricacao: 2004,
    anoModelo: 2004,
    preco: 450,
    km: 195000,
    combustivel: 'Gasolina',
    cambio: 'Manual',
    cor: 'Azul',
    portas: 3,
    local: 'Porto',
    descricao:
      'Peugeot 206 sinistrado na parte frontal. Ideal para peças ou reparação profunda.\n\n* Motor arranca mas radiador está partido\n* Interiores em bom estado\n* Farol esquerdo partido',
    estadoVeiculo: 'manutencao',
    tiposManutencao: ['Mecânica', 'Pintura e funilaria', 'Lataria / amassados'],
    manutencaoOutro: 'Radiador partido',
    temOrcamento: false,
    orcamentoTexto: '',
    incluirMecanicoNome: false,
    mecanicoNome: '',
    incluirMecanicoTelefone: false,
    mecanicoTelefone: '',
    fotos: ['images/peugeot206.png', '🛠️', '📦'],
    criador: 'admin@reparauto.pt',
    vendedorNome: 'Admin ReparAuto',
    vendedorTelefone: '912345678',
    vendedorWhatsApp: '351912345678',
    vendedorEmail: 'admin@reparauto.pt',
    rodando: false,
    inspecao: false,
    status: 'aprovado',
    dataCriacao: Timestamp.now(),
  },
  {
    marca: 'Volkswagen',
    modelo: 'Golf IV 1.9 TDI',
    anoFabricacao: 2003,
    anoModelo: 2003,
    preco: 900,
    km: 280000,
    combustivel: 'Diesel',
    cambio: 'Manual',
    cor: 'Preto',
    portas: 5,
    local: 'Coimbra',
    descricao:
      'Excelente motor 1.9 TDI de 110cv. Anda diariamente mas precisa de pastilhas e discos novos urgentemente.\n\n* Revisão feita há 5.000 km\n* AC a funcionar\n* Interiores desgastados',
    estadoVeiculo: 'manutencao',
    tiposManutencao: ['Mecânica'],
    manutencaoOutro: '',
    temOrcamento: true,
    orcamentoTexto:
      'Substituição de discos e pastilhas frontais e traseiras: 180€ com mão de obra',
    incluirMecanicoNome: true,
    mecanicoNome: 'Mecânica do Zé',
    incluirMecanicoTelefone: false,
    mecanicoTelefone: '',
    fotos: ['images/golf4.png', '✅', '🔩'],
    criador: 'admin@reparauto.pt',
    vendedorNome: 'Admin ReparAuto',
    vendedorTelefone: '912345678',
    vendedorWhatsApp: '351912345678',
    vendedorEmail: 'admin@reparauto.pt',
    rodando: true,
    inspecao: true,
    status: 'aprovado',
    dataCriacao: Timestamp.now(),
  },
  {
    marca: 'BMW',
    modelo: '320d Coupé (Valor Livre)',
    anoFabricacao: 2011,
    anoModelo: 2012,
    preco: 12400,
    km: 185000,
    combustivel: 'Diesel',
    cambio: 'Manual',
    cor: 'Branco',
    portas: 3,
    local: 'Lisboa',
    descricao:
      'BMW 320d Coupé em excelente estado de conservação. Quilómetros reais e comprovados.\n\n* Estofos em pele\n* Faróis Bi-Xénon\n* Sensores de estacionamento\n* Jantes de liga leve',
    estadoVeiculo: 'pronto',
    tiposManutencao: [],
    manutencaoOutro: '',
    temOrcamento: false,
    orcamentoTexto: '',
    incluirMecanicoNome: false,
    mecanicoNome: '',
    incluirMecanicoTelefone: false,
    mecanicoTelefone: '',
    fotos: ['images/bmw320d.png', '✨', '💎'],
    criador: 'admin@reparauto.pt',
    vendedorNome: 'Admin ReparAuto',
    vendedorTelefone: '912345678',
    vendedorWhatsApp: '351912345678',
    vendedorEmail: 'admin@reparauto.pt',
    status: 'aprovado',
    dataCriacao: Timestamp.now(),
  },
  {
    marca: 'Opel',
    modelo: 'Corsa B 1.2',
    anoFabricacao: 1999,
    anoModelo: 1999,
    preco: 350,
    km: 165000,
    combustivel: 'Gasolina',
    cambio: 'Manual',
    cor: 'Verde',
    portas: 5,
    local: 'Lisboa',
    descricao:
      'Carro parado há 2 anos numa garagem. Não pega, provavelmente bateria ou bomba de combustível avariada.\nTem alguma ferrugem na porta do condutor.\n\n* Pintura queimada do sol\n* Pneus ressequidos',
    estadoVeiculo: 'manutencao',
    tiposManutencao: ['Mecânica', 'Elétrica', 'Pintura e funilaria', 'Lataria / amassados'],
    manutencaoOutro: 'Parado há muito tempo',
    temOrcamento: false,
    orcamentoTexto: '',
    incluirMecanicoNome: false,
    mecanicoNome: '',
    incluirMecanicoTelefone: false,
    mecanicoTelefone: '',
    fotos: ['🚐', '⏳', '🕸️'],
    criador: 'admin@reparauto.pt',
    vendedorNome: 'Admin ReparAuto',
    vendedorTelefone: '912345678',
    vendedorWhatsApp: '351912345678',
    vendedorEmail: 'admin@reparauto.pt',
    rodando: false,
    inspecao: false,
    status: 'aprovado',
    dataCriacao: Timestamp.now(),
  },
  {
    marca: 'Mercedes-Benz',
    modelo: 'C220 CDI (Valor Livre)',
    anoFabricacao: 2009,
    anoModelo: 2009,
    preco: 8900,
    km: 250000,
    combustivel: 'Diesel',
    cambio: 'Automático',
    cor: 'Preto',
    portas: 4,
    local: 'Porto',
    descricao:
      'Mercedes C220 CDI nacional, caixa automática. Anda diariamente sem qualquer problema.\n\n* GPS e Bluetooth\n* Tecto de abrir\n* Bancos elétricos com memória',
    estadoVeiculo: 'pronto',
    tiposManutencao: [],
    manutencaoOutro: '',
    temOrcamento: false,
    orcamentoTexto: '',
    incluirMecanicoNome: false,
    mecanicoNome: '',
    incluirMecanicoTelefone: false,
    mecanicoTelefone: '',
    fotos: ['images/mercedes.png', '🚗', '⚙️'],
    criador: 'admin@reparauto.pt',
    vendedorNome: 'Admin ReparAuto',
    vendedorTelefone: '912345678',
    vendedorWhatsApp: '351912345678',
    vendedorEmail: 'admin@reparauto.pt',
    status: 'aprovado',
    dataCriacao: Timestamp.now(),
  },
  {
    marca: 'Seat',
    modelo: 'Ibiza 1.4',
    anoFabricacao: 2006,
    anoModelo: 2006,
    preco: 750,
    km: 230000,
    combustivel: 'Gasolina',
    cambio: 'Manual',
    cor: 'Vermelho',
    portas: 5,
    local: 'Faro',
    descricao:
      'Seat Ibiza 1.4 a gasolina. Anda diariamente mas apresenta luz de erro de motor no painel (EGR ou sonda lambda) e o ar condicionado não arrefece.\n\n* Jantes especiais\n* Vidros elétricos à frente\n* Fecho central',
    estadoVeiculo: 'manutencao',
    tiposManutencao: ['Eletrônica', 'Ar-condicionado'],
    manutencaoOutro: '',
    temOrcamento: true,
    orcamentoTexto: 'Diagnóstico de erro EGR + carregamento de AC: 120€',
    incluirMecanicoNome: false,
    mecanicoNome: '',
    incluirMecanicoTelefone: true,
    mecanicoTelefone: '933567890',
    fotos: ['🚗', '⚡', '🔌'],
    criador: 'admin@reparauto.pt',
    vendedorNome: 'Admin ReparAuto',
    vendedorTelefone: '912345678',
    vendedorWhatsApp: '351912345678',
    vendedorEmail: 'admin@reparauto.pt',
    rodando: true,
    inspecao: true,
    status: 'aprovado',
    dataCriacao: Timestamp.now(),
  },
];

const defaultPecas: PecaSeed[] = [
  {
    tipo: 'venda',
    titulo: 'Motor 1.9 TDI ASZ 130cv',
    categoria: 'Motor e Transmissão',
    marcaCarro: 'Seat',
    modeloCarro: 'Ibiza 6L',
    preco: 450,
    estado: 'Usado',
    local: 'Braga',
    contacto: '912345678',
    foto: '⚙️',
    criador: 'admin@reparauto.pt',
    vendedorNome: 'Admin ReparAuto',
    vendedorTelefone: '912345678',
    vendedorWhatsApp: '351912345678',
    vendedorEmail: 'admin@reparauto.pt',
    descricao:
      'Motor em excelente estado de funcionamento. Retirado de veículo acidentado na traseira. Tem cerca de 210.000 km. Vendido completo com turbo original.',
    status: 'aprovado',
    dataCriacao: Timestamp.now(),
  },
  {
    tipo: 'desmonte',
    titulo: 'Peugeot 206 1.1 para desmonte completo',
    categoria: 'Carro Completo p/ Desmonte',
    marcaCarro: 'Peugeot',
    modeloCarro: '206',
    preco: 300,
    estado: 'Usado',
    local: 'Porto',
    contacto: '933567890',
    foto: '🚗',
    criador: 'carlos@email.com',
    vendedorNome: 'Carlos Silva',
    vendedorTelefone: '933567890',
    vendedorWhatsApp: '351933567890',
    vendedorEmail: 'carlos@email.com',
    descricao:
      'Carro completo para peças. Chaparia em bom estado, interiores impecáveis. Motor parado. Vendo peças individuais ou o conjunto.',
    status: 'aprovado',
    dataCriacao: Timestamp.now(),
  },
  {
    tipo: 'procura',
    titulo: 'Procuro Farol Frontal Esquerdo Halogéneo',
    categoria: 'Iluminação e Óticas',
    marcaCarro: 'Renault',
    modeloCarro: 'Clio III',
    preco: 0,
    estado: 'Usado',
    local: 'Lisboa',
    contacto: '922456789',
    foto: '🔍',
    criador: 'admin@reparauto.pt',
    vendedorNome: 'Admin ReparAuto',
    vendedorTelefone: '912345678',
    vendedorWhatsApp: '351912345678',
    vendedorEmail: 'admin@reparauto.pt',
    descricao:
      'Procuro farol esquerdo (lado condutor) original e em bom estado para Renault Clio de 2007 (Fase 1).',
    status: 'aprovado',
    dataCriacao: Timestamp.now(),
  },
];

const defaultOficinas = [
  {
    criador: 'admin@reparauto.pt',
    nome: 'Recar Garage & Prep',
    descricao: 'Especialistas em eletrónica, reprogramação e preparação de motores para competição e estrada. Realizamos também serviços de estética automóvel e detalhe completo.',
    responsavel: 'Filipe Antunes',
    telefone: '912345678',
    whatsapp: '351912345678',
    email: 'contacto@recargarage.pt',
    website: 'https://recargarage.pt',
    distrito: 'Lisboa',
    localidade: 'Lisboa',
    morada: 'Avenida da República, 1420',
    coordenadas: { latitude: 38.7436, longitude: -9.1443 },
    especialidades: ['preparacao', 'eletronica', 'estetica_automotiva'],
    logoUrl: '',
    status: 'aprovado',
    mediaAvaliacoes: 4.8,
    totalAvaliacoes: 5,
    dataCriacao: Timestamp.now(),
  },
  {
    criador: 'admin@reparauto.pt',
    nome: 'Oficina Mecânica Central Braga',
    descricao: 'Oficina multimarcas com foco em mecânica convencional, diagnóstico computorizado, carregamento de ar condicionado e substituição de pneus.',
    responsavel: 'João Silva',
    telefone: '923456789',
    whatsapp: '351923456789',
    email: 'braga@mecanicacentral.pt',
    website: 'https://mecanicacentralbraga.pt',
    distrito: 'Braga',
    localidade: 'Braga',
    morada: 'Rua do Caires, 54',
    coordenadas: { latitude: 41.5432, longitude: -8.4285 },
    especialidades: ['mecanica_convencional', 'ar_condicionado', 'pneus'],
    logoUrl: '',
    status: 'aprovado',
    mediaAvaliacoes: 4.5,
    totalAvaliacoes: 3,
    dataCriacao: Timestamp.now(),
  },
  {
    criador: 'admin@reparauto.pt',
    nome: 'Auto Pintura e Restauro Clássicos',
    descricao: 'Oficina premium especializada em pintura automóvel de estufa, reparação de chapa e restauro completo de veículos clássicos.',
    responsavel: 'Manuel Neves',
    telefone: '934567890',
    whatsapp: '351934567890',
    email: 'manuel@autopinturaclassicos.pt',
    distrito: 'Porto',
    localidade: 'Vila Nova de Gaia',
    morada: 'Zona Industrial de Grijó, Lote 12',
    coordenadas: { latitude: 41.0254, longitude: -8.5786 },
    especialidades: ['pintura', 'classicos_restauro'],
    logoUrl: '',
    status: 'aprovado',
    mediaAvaliacoes: 5.0,
    totalAvaliacoes: 8,
    dataCriacao: Timestamp.now(),
  }
];

export async function initDatabase(): Promise<void> {
  try {
    const carrosSnap = await getDocs(collection(db, CARROS_COLLECTION));
    const pecasSnap = await getDocs(collection(db, PECAS_COLLECTION));
    const oficinasSnap = await getDocs(collection(db, OFICINAS_COLLECTION));

    const precisaSeed = carrosSnap.empty || pecasSnap.empty || oficinasSnap.empty;

    if (precisaSeed) {
      if (carrosSnap.empty) {
        for (const carro of defaultCarros) {
          await addDoc(collection(db, CARROS_COLLECTION), carro as DocumentData);
        }
      }
      if (pecasSnap.empty) {
        for (const peca of defaultPecas) {
          await addDoc(collection(db, PECAS_COLLECTION), peca as DocumentData);
        }
      }
      if (oficinasSnap.empty) {
        for (const oficina of defaultOficinas) {
          await addDoc(collection(db, OFICINAS_COLLECTION), oficina as DocumentData);
        }
      }
      localStorage.setItem(DB_VERSION_KEY, DB_VERSION);
      console.log('[DB] Seed data imported to Firestore');
    }
    await migrarMensagens();
  } catch (err) {
    console.error('[DB] Erro ao inicializar:', err);
  }
}

const MENSAGENS_COLLECTION = 'messages';
const MIGRATION_KEY = 'reparauto_migration_participants';

async function migrarMensagens(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) return;
  try {
    const snap = await getDocs(collection(db, MENSAGENS_COLLECTION));
    const batch = writeBatch(db);
    let count = 0;
    snap.docs.forEach((d) => {
      const data = d.data();
      if (!data.participants && data.fromUid && data.toUid) {
        batch.update(d.ref, { participants: [data.fromUid, data.toUid].sort() });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
      console.log(`[DB] Migradas ${count} mensagens com participantes`);
    }
    localStorage.setItem(MIGRATION_KEY, 'done');
  } catch {
    // migration is best-effort
  }
}

export async function getCarros(): Promise<Carro[]> {
  try {
    const q = query(collection(db, CARROS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Carro));
    return todos.filter((c) => c.status === 'aprovado');
  } catch (err) {
    console.error('[DB] Erro ao buscar carros:', err);
    return [];
  }
}

export function subscribeCarros(
  onData: (carros: Carro[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, CARROS_COLLECTION), orderBy('dataCriacao', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Carro);
      onData(todos.filter((c) => c.status === 'aprovado'));
    },
    (err) => {
      console.error('[DB] Erro no snapshot de carros:', err);
      onError?.(err);
    },
  );
}

export async function getCarrosByCreator(email: string): Promise<Carro[]> {
  try {
    const q = query(collection(db, CARROS_COLLECTION), where('criador', '==', email));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Carro));
  } catch (err) {
    console.error('[DB] Erro ao buscar carros do criador:', err);
    return [];
  }
}

export async function getCarroPorId(id: string): Promise<Carro | null> {
  try {
    const docRef = doc(db, CARROS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Carro;
    }
    return null;
  } catch (err) {
    console.error('[DB] Erro ao buscar carro:', err);
    return null;
  }
}

export async function addCarro(dados: Record<string, unknown>): Promise<Carro> {
  try {
    const docRef = await addDoc(collection(db, CARROS_COLLECTION), {
      ...dados,
      status: 'pendente',
      dataCriacao: Timestamp.now(),
    });
    return { id: docRef.id, ...dados, status: 'pendente' } as Carro;
  } catch (err) {
    console.error('[DB] Erro ao adicionar carro:', err);
    throw err;
  }
}

export async function deleteCarro(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CARROS_COLLECTION, id));
  } catch (err) {
    console.error('[DB] Erro ao eliminar carro:', err);
    throw err;
  }
}

export async function getPecas(): Promise<Peca[]> {
  try {
    const q = query(collection(db, PECAS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Peca));
    return todas.filter((p) => p.status === 'aprovado');
  } catch (err) {
    console.error('[DB] Erro ao buscar peças:', err);
    return [];
  }
}

export function subscribePecas(
  onData: (pecas: Peca[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, PECAS_COLLECTION), orderBy('dataCriacao', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Peca);
      onData(todas.filter((p) => p.status === 'aprovado'));
    },
    (err) => {
      console.error('[DB] Erro no snapshot de peças:', err);
      onError?.(err);
    },
  );
}

export async function getPecasByCreator(email: string): Promise<Peca[]> {
  try {
    const q = query(collection(db, PECAS_COLLECTION), where('criador', '==', email));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Peca));
  } catch (err) {
    console.error('[DB] Erro ao buscar peças do criador:', err);
    return [];
  }
}

export async function getPecaPorId(id: string): Promise<Peca | null> {
  try {
    const docRef = doc(db, PECAS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Peca;
    }
    return null;
  } catch (err) {
    console.error('[DB] Erro ao buscar peça:', err);
    return null;
  }
}

export async function addPeca(dados: Record<string, unknown>): Promise<Peca> {
  try {
    const docRef = await addDoc(collection(db, PECAS_COLLECTION), {
      ...dados,
      status: 'pendente',
      dataCriacao: Timestamp.now(),
    });
    return { id: docRef.id, ...dados, status: 'pendente' } as Peca;
  } catch (err) {
    console.error('[DB] Erro ao adicionar peça:', err);
    throw err;
  }
}

export async function deletePeca(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PECAS_COLLECTION, id));
  } catch (err) {
    console.error('[DB] Erro ao eliminar peça:', err);
    throw err;
  }
}

// ============ USERS (PERFIS) ============

const USERS_COLLECTION = 'users';

export async function getUserProfile(uid: string): Promise<Usuario | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { uid: snap.id, ...snap.data() } as Usuario;
    }
    return null;
  } catch (err) {
    console.error('[DB] Erro ao buscar perfil:', err);
    return null;
  }
}

export async function createUserProfile(uid: string, data: Record<string, unknown>): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, {
      ...data,
      dataCriacao: Timestamp.now(),
      dataAtualizacao: Timestamp.now(),
    }, { merge: true });
  } catch (err) {
    console.error('[DB] Erro ao criar perfil:', err);
    throw err;
  }
}

export async function updateUserProfile(uid: string, data: Record<string, unknown>): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, { ...data, dataAtualizacao: Timestamp.now() }, { merge: true });
  } catch (err) {
    console.error('[DB] Erro ao atualizar perfil:', err);
    throw err;
  }
}

export async function getUserByEmail(email: string): Promise<Usuario | null> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { uid: d.id, ...d.data() } as Usuario;
  } catch (err) {
    console.error('[DB] Erro ao buscar utilizador por email:', err);
    return null;
  }
}

// ============ ADMIN ============

export async function getAllUsers(): Promise<Usuario[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as Usuario));
  } catch (err) {
    console.error('[DB] Erro ao buscar utilizadores:', err);
    return [];
  }
}

export async function setUserRole(uid: string, role: Role): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, { role, dataAtualizacao: Timestamp.now() }, { merge: true });
  } catch (err) {
    console.error('[DB] Erro ao alterar role:', err);
    throw err;
  }
}

export async function getAdminUsers(): Promise<Usuario[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as Usuario));
  } catch (err) {
    console.error('[DB] Erro ao buscar admins:', err);
    return [];
  }
}

export async function updateCarro(id: string, dados: Record<string, unknown>): Promise<void> {
  try {
    await updateDoc(doc(db, CARROS_COLLECTION, id) as any, dados as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar carro:', err);
    throw err;
  }
}

export async function updatePeca(id: string, dados: Record<string, unknown>): Promise<void> {
  try {
    await updateDoc(doc(db, PECAS_COLLECTION, id) as any, dados as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar peça:', err);
    throw err;
  }
}

export async function updateCarroStatus(id: string, status: StatusAnuncio): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status };
    if (status === 'aprovado') {
      updates.dataAprovacao = Timestamp.now();
    }
    await updateDoc(doc(db, CARROS_COLLECTION, id) as any, updates as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar status do carro:', err);
    throw err;
  }
}

export async function updatePecaStatus(id: string, status: StatusAnuncio): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status };
    if (status === 'aprovado') {
      updates.dataAprovacao = Timestamp.now();
    }
    await updateDoc(doc(db, PECAS_COLLECTION, id) as any, updates as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar status da peça:', err);
    throw err;
  }
}

export async function getAllCarrosAdmin(): Promise<Carro[]> {
  try {
    const q = query(collection(db, CARROS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Carro));
  } catch (err) {
    console.error('[DB] Erro ao buscar carros (admin):', err);
    return [];
  }
}

export async function getAllPecasAdmin(): Promise<Peca[]> {
  try {
    const q = query(collection(db, PECAS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Peca));
  } catch (err) {
    console.error('[DB] Erro ao buscar peças (admin):', err);
    return [];
  }
}

// ============ NOTIFICAÇÕES ============

const NOTIFICACOES_COLLECTION = 'notifications';

export async function criarNotificacao(
  uid: string,
  tipo: TipoNotificacao,
  titulo: string,
  mensagem: string,
  link?: string,
): Promise<void> {
  try {
    await addDoc(collection(db, NOTIFICACOES_COLLECTION), {
      uid,
      tipo,
      titulo,
      mensagem,
      link: link || null,
      lida: false,
      dataCriacao: Timestamp.now(),
    });
  } catch (err) {
    console.error('[DB] Erro ao criar notificação:', err);
  }
}

export async function getNotificacoes(uid: string): Promise<Notificacao[]> {
  try {
    const q = query(
      collection(db, NOTIFICACOES_COLLECTION),
      where('uid', '==', uid),
    );
    const snap = await getDocs(q);
    const notificacoes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notificacao));
    notificacoes.sort((a, b) => {
      const aTime = a.dataCriacao?.toDate?.()?.getTime() || 0;
      const bTime = b.dataCriacao?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
    return notificacoes;
  } catch (err) {
    console.error('[DB] Erro ao buscar notificações:', err);
    return [];
  }
}

export async function marcarNotificacaoLida(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, NOTIFICACOES_COLLECTION, id), { lida: true });
  } catch (err) {
    console.error('[DB] Erro ao marcar notificação como lida:', err);
  }
}

export async function marcarTodasNotificacoesLidas(uid: string): Promise<void> {
  try {
    const q = query(
      collection(db, NOTIFICACOES_COLLECTION),
      where('uid', '==', uid),
      where('lida', '==', false),
    );
    const snap = await getDocs(q);
    const batch = snap.docs.map((d) => updateDoc(doc(db, NOTIFICACOES_COLLECTION, d.id), { lida: true }));
    await Promise.all(batch);
  } catch (err) {
    console.error('[DB] Erro ao marcar notificações como lidas:', err);
  }
}

export async function incrementCampo(colecao: string, id: string, campo: string): Promise<void> {
  try {
    await updateDoc(doc(db, colecao, id), { [campo]: increment(1) });
  } catch (err) {
    console.error(`[DB] Erro ao incrementar ${campo}:`, err);
  }
}

export async function decrementCampo(colecao: string, id: string, campo: string): Promise<void> {
  try {
    await updateDoc(doc(db, colecao, id), { [campo]: increment(-1) });
  } catch (err) {
    console.error(`[DB] Erro ao decrementar ${campo}:`, err);
  }
}

// ============ REVIEWS ============

const REVIEWS_COLLECTION = 'reviews';

export async function addReview(data: ReviewInput): Promise<Review> {
  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...data,
      status: 'pendente',
      dataCriacao: Timestamp.now(),
    });
    return { id: docRef.id, ...data, status: 'pendente' } as Review;
  } catch (err) {
    console.error('[DB] Erro ao adicionar avaliação:', err);
    throw err;
  }
}

export function subscribeReviews(
  vendedorEmail: string,
  onData: (reviews: Review[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('vendedorEmail', '==', vendedorEmail),
    orderBy('dataCriacao', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
      onData(all.filter((r) => r.status === 'aprovado'));
    },
    (err) => {
      console.error('[DB] Erro no snapshot de avaliações:', err);
      onError?.(err);
    },
  );
}

export function subscribeReviewsOficina(
  oficinaId: string,
  onData: (reviews: Review[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('anuncioId', '==', oficinaId),
    where('anuncioTipo', '==', 'oficina'),
    orderBy('dataCriacao', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
      onData(all.filter((r) => r.status === 'aprovado'));
    },
    (err) => {
      console.error('[DB] Erro no snapshot de avaliações de oficina:', err);
      onError?.(err);
    },
  );
}


export async function getReviewsByVendedor(vendedorEmail: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('vendedorEmail', '==', vendedorEmail),
      orderBy('dataCriacao', 'desc'),
    );
    const snap = await getDocs(q);
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
    return all.filter((r) => r.status === 'aprovado');
  } catch (err) {
    console.error('[DB] Erro ao buscar avaliações:', err);
    return [];
  }
}

export async function getAllReviewsAdmin(): Promise<Review[]> {
  try {
    const q = query(collection(db, REVIEWS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
  } catch (err) {
    console.error('[DB] Erro ao buscar avaliações (admin):', err);
    return [];
  }
}

export async function updateReviewStatus(id: string, status: StatusReview): Promise<void> {
  try {
    await updateDoc(doc(db, REVIEWS_COLLECTION, id) as any, { status } as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar status da avaliação:', err);
    throw err;
  }
}

export async function deleteReview(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, id));
  } catch (err) {
    console.error('[DB] Erro ao eliminar avaliação:', err);
    throw err;
  }
}

export async function updateSellerRating(vendedorUid: string, vendedorEmail: string): Promise<void> {
  try {
    const reviews = await getReviewsByVendedor(vendedorEmail);
    const total = reviews.length;
    const media = total > 0 ? reviews.reduce((sum, r) => sum + r.nota, 0) / total : 0;

    const profile = await getUserProfile(vendedorUid);
    const existingBadges = (profile?.badges || []).filter((b) => b !== 'top_vendedor');
    if (total >= 5 && media >= 4.5) existingBadges.push('top_vendedor');

    await updateUserProfile(vendedorUid, {
      mediaAvaliacoes: Math.round(media * 10) / 10,
      totalAvaliacoes: total,
      badges: existingBadges,
    });
  } catch (err) {
    console.error('[DB] Erro ao atualizar rating do vendedor:', err);
  }
}

// ============ REPORTS ============

const REPORTS_COLLECTION = 'reports';

export async function addReport(data: ReportInput): Promise<Report> {
  try {
    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
      ...data,
      dataCriacao: Timestamp.now(),
    });
    return { id: docRef.id, ...data } as Report;
  } catch (err) {
    console.error('[DB] Erro ao criar denúncia:', err);
    throw err;
  }
}

export async function getAllReports(): Promise<Report[]> {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Report);
  } catch (err) {
    console.error('[DB] Erro ao buscar denúncias:', err);
    return [];
  }
}

export async function updateReportStatus(
  id: string,
  status: StatusReport,
  resolvidoPor: string,
  notasAdmin?: string,
): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status, resolvidoPor };
    if (status === 'resolvido' || status === 'rejeitado') {
      updates.dataResolucao = Timestamp.now();
    }
    if (notasAdmin) updates.notasAdmin = notasAdmin;
    await updateDoc(doc(db, REPORTS_COLLECTION, id) as any, updates as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar denúncia:', err);
    throw err;
  }
}

// ============ VERIFICATIONS ============

const VERIFICATIONS_COLLECTION = 'verifications';

export async function addVerification(data: VerificationInput): Promise<Verification> {
  try {
    const docRef = await addDoc(collection(db, VERIFICATIONS_COLLECTION), {
      ...data,
      dataPedido: Timestamp.now(),
    });
    return { id: docRef.id, ...data } as Verification;
  } catch (err) {
    console.error('[DB] Erro ao criar pedido de verificação:', err);
    throw err;
  }
}

export async function getVerificationByUid(uid: string): Promise<Verification | null> {
  try {
    const q = query(
      collection(db, VERIFICATIONS_COLLECTION),
      where('uid', '==', uid),
      orderBy('dataPedido', 'desc'),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Verification;
  } catch (err) {
    console.error('[DB] Erro ao buscar verificação:', err);
    return null;
  }
}

export async function getAllVerifications(): Promise<Verification[]> {
  try {
    const q = query(collection(db, VERIFICATIONS_COLLECTION), orderBy('dataPedido', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Verification);
  } catch (err) {
    console.error('[DB] Erro ao buscar verificações:', err);
    return [];
  }
}

export async function updateVerificationStatus(
  id: string,
  status: StatusVerificacao,
  resolvidoPor: string,
  notasAdmin?: string,
): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status, resolvidoPor };
    if (status === 'aprovado' || status === 'rejeitado') {
      updates.dataResolucao = Timestamp.now();
    }
    if (notasAdmin) updates.notasAdmin = notasAdmin;
    await updateDoc(doc(db, VERIFICATIONS_COLLECTION, id) as any, updates as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar verificação:', err);
    throw err;
  }
}

export async function deleteVerificationFiles(documentoUrl: string, selfieUrl: string): Promise<void> {
  const deleteByUrl = async (url: string) => {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (err) {
      console.error('[DB] Erro ao apagar ficheiro de verificação:', err);
    }
  };
  await Promise.all([deleteByUrl(documentoUrl), deleteByUrl(selfieUrl)]);
}

export async function clearVerificationUrls(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, VERIFICATIONS_COLLECTION, id) as any, {
      documentoUrl: '',
      selfieUrl: '',
    } as any);
  } catch (err) {
    console.error('[DB] Erro ao limpar URLs de verificação:', err);
  }
}

// ============ INTENCOES DE COMPRA ============

function cleanUndefined(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !(value instanceof Timestamp)) {
      result[key] = Array.isArray(value)
        ? value.map((item: any) =>
            item !== null && typeof item === 'object' && !(item instanceof Timestamp)
              ? cleanUndefined(item)
              : item,
          )
        : cleanUndefined(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const INTENCOES_COLLECTION = 'intencoes_compra';
const CONTATOS_INTENCAO_COLLECTION = 'contatos_intencao';
const DENUNCIAS_INTENCAO_COLLECTION = 'denuncias_intencao';

export async function criarIntencaoCompra(dados: IntencaoCompraInput): Promise<string> {
  try {
    const intencaoId = doc(collection(db, INTENCOES_COLLECTION)).id;
    await setDoc(doc(db, INTENCOES_COLLECTION, intencaoId), cleanUndefined({
      id: intencaoId,
      ...dados as any,
      status: 'pendente',
      prioritaria: false,
      stats: {
        visualizacoes: 0,
        visualizacoes7Dias: 0,
        contatos: 0,
        contatos7Dias: 0,
      },
      criadaEm: Timestamp.now(),
      atualizadaEm: Timestamp.now(),
    }));
    return intencaoId;
  } catch (err) {
    console.error('[DB] Erro ao criar intenção de compra:', err);
    throw err;
  }
}

export async function getIntencaoCompra(id: string): Promise<IntencaoCompra | null> {
  try {
    const docRef = doc(db, INTENCOES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    updateDoc(docRef as any, {
      'stats.visualizacoes': increment(1),
      'stats.visualizacoes7Dias': increment(1),
    } as any).catch(() => {});
    return { id: snap.id, ...snap.data() } as IntencaoCompra;
  } catch (err) {
    console.error('[DB] Erro ao buscar intenção:', err);
    return null;
  }
}

export async function getIntencoesPorUsuario(userId: string): Promise<IntencaoCompra[]> {
  try {
    const q = query(
      collection(db, INTENCOES_COLLECTION),
      where('userId', '==', userId),
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as IntencaoCompra));
    results.sort((a, b) => {
      const aTime = a.atualizadaEm?.toDate?.()?.getTime() || 0;
      const bTime = b.atualizadaEm?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
    return results;
  } catch (err) {
    console.error('[DB] Erro ao buscar intenções do utilizador:', err);
    return [];
  }
}

export async function atualizarIntencaoCompra(id: string, userId: string, updates: Record<string, unknown>): Promise<void> {
  try {
    const docRef = doc(db, INTENCOES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Intenção não encontrada');
    const data = snap.data() as IntencaoCompra;
    if (data.userId !== userId) throw new Error('Não autorizado');
    await updateDoc(docRef as any, { ...updates, atualizadaEm: Timestamp.now() } as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar intenção:', err);
    throw err;
  }
}

export async function deletarIntencaoCompra(id: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, INTENCOES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Intenção não encontrada');
    const data = snap.data() as IntencaoCompra;
    if (data.userId !== userId) throw new Error('Não autorizado');
    await updateDoc(docRef as any, {
      status: 'deletada',
      deletadaEm: Timestamp.now(),
      atualizadaEm: Timestamp.now(),
    } as any);
  } catch (err) {
    console.error('[DB] Erro ao deletar intenção:', err);
    throw err;
  }
}

export async function pausarIntencaoCompra(id: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, INTENCOES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Intenção não encontrada');
    const data = snap.data() as IntencaoCompra;
    if (data.userId !== userId) throw new Error('Não autorizado');
    await updateDoc(docRef as any, {
      status: 'pausada',
      expiradoEm: Timestamp.now(),
      atualizadaEm: Timestamp.now(),
    } as any);
  } catch (err) {
    console.error('[DB] Erro ao pausar intenção:', err);
    throw err;
  }
}

export async function reativarIntencaoCompra(id: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, INTENCOES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Intenção não encontrada');
    const data = snap.data() as IntencaoCompra;
    if (data.userId !== userId) throw new Error('Não autorizado');
    await updateDoc(docRef as any, {
      status: 'ativa',
      expiradoEm: null,
      atualizadaEm: Timestamp.now(),
    } as any);
  } catch (err) {
    console.error('[DB] Erro ao reativar intenção:', err);
    throw err;
  }
}

export async function buscarIntencoesMatch(carro: Record<string, any>, usuarioId: string): Promise<IntencaoCompra[]> {
  try {
    const filters: any[] = [where('status', '==', 'ativa')];

    if (carro.categoria && carro.categoria !== 'todos') {
      filters.push(where('categoria', '==', carro.categoria));
    }

    const q = query(
      collection(db, INTENCOES_COLLECTION),
      ...filters,
    );
    const snap = await getDocs(q);
    let resultados = snap.docs.map((d) => ({ id: d.id, ...d.data() } as IntencaoCompra));

    resultados = resultados.filter((intencao) => {
      if (intencao.userId === usuarioId) return false;
      const c = intencao.criterios;
      const cat = intencao.categoria;

      if (cat === 'pecas') return true;

      if (carro.marca && c.marca && c.marca !== carro.marca) return false;
      if (c.anoMinimo && carro.anoFabricacao && carro.anoFabricacao < c.anoMinimo) return false;
      if (c.anoMaximo && carro.anoFabricacao && carro.anoFabricacao > c.anoMaximo) return false;
      if (c.precoMinimo && carro.preco && carro.preco < c.precoMinimo) return false;
      if (carro.preco && carro.preco > c.precoMaximo) return false;
      if (c.combustivel && !c.combustivel.includes('qualquer') && !c.combustivel.includes(carro.combustivel?.toLowerCase())) return false;
      if (c.tipoTransmissao && !c.tipoTransmissao.includes('qualquer') && !c.tipoTransmissao.includes(carro.cambio?.toLowerCase())) return false;
      if (c.quilometragemMaxima && carro.km && carro.km > c.quilometragemMaxima) return false;
      if (c.localizacao?.distrito && c.localizacao.distrito !== 'todo_portugal' && carro.local && carro.local !== c.localizacao.distrito) return false;

      return true;
    });

    return resultados;
  } catch (err) {
    console.error('[DB] Erro ao buscar intenções match:', err);
    return [];
  }
}

export async function iniciarContatoIntencao(
  intencaoId: string,
  vendedorId: string,
  carroId?: string,
  mensagem?: string,
): Promise<string> {
  try {
    const contatoId = doc(collection(db, CONTATOS_INTENCAO_COLLECTION)).id;
    const chatId = doc(collection(db, 'messages')).id;

    await setDoc(doc(db, CONTATOS_INTENCAO_COLLECTION, contatoId), {
      id: contatoId,
      intencaoId,
      vendedorId,
      carroId: carroId || null,
      titulo: carroId ? 'Tenho um carro para você!' : 'Interesse em sua intenção',
      descricao: mensagem || null,
      precoOferido: null,
      status: 'aberto',
      chatId,
      marcadoComoRelevante: false,
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    });

    if (mensagem) {
      await setDoc(doc(db, 'messages', chatId), {
        listingId: intencaoId,
        listingType: 'intencao',
        listingTitle: '',
        fromUid: vendedorId,
        fromNome: '',
        toUid: '',
        toNome: '',
        participants: [vendedorId],
        mensagem,
        lida: false,
        dataCriacao: Timestamp.now(),
      });
    }

    await updateDoc(doc(db, INTENCOES_COLLECTION, intencaoId) as any, {
      'stats.contatos': increment(1),
      'stats.contatos7Dias': increment(1),
    } as any);

    return contatoId;
  } catch (err) {
    console.error('[DB] Erro ao iniciar contato:', err);
    throw err;
  }
}

export async function getContatosPorIntencao(intencaoId: string): Promise<ContatoIntencao[]> {
  try {
    const q = query(
      collection(db, CONTATOS_INTENCAO_COLLECTION),
      where('intencaoId', '==', intencaoId),
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContatoIntencao));
    results.sort((a, b) => {
      const aTime = a.criadoEm?.toDate?.()?.getTime() || 0;
      const bTime = b.criadoEm?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
    return results;
  } catch (err) {
    console.error('[DB] Erro ao buscar contatos:', err);
    return [];
  }
}

export async function marcarContatoRelevante(contatoId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, CONTATOS_INTENCAO_COLLECTION, contatoId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Contato não encontrado');
    await updateDoc(docRef as any, {
      marcadoComoRelevante: true,
      atualizadoEm: Timestamp.now(),
    } as any);
  } catch (err) {
    console.error('[DB] Erro ao marcar contato relevante:', err);
    throw err;
  }
}

export async function rejeitarContato(contatoId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, CONTATOS_INTENCAO_COLLECTION, contatoId);
    await updateDoc(docRef as any, {
      status: 'rejeitado',
      atualizadoEm: Timestamp.now(),
    } as any);
  } catch (err) {
    console.error('[DB] Erro ao rejeitar contato:', err);
    throw err;
  }
}

// ============ DENUNCIAS INTENCAO ============

export async function addDenunciaIntencao(data: {
  intencaoId: string;
  denunciantId: string;
  motivo: string;
  descricao: string;
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, DENUNCIAS_INTENCAO_COLLECTION), {
      ...data,
      status: 'aberta',
      criadaEm: Timestamp.now(),
    });
    return docRef.id;
  } catch (err) {
    console.error('[DB] Erro ao criar denúncia de intenção:', err);
    throw err;
  }
}

export async function getDenunciasIntencao(): Promise<DenunciaIntencao[]> {
  try {
    const q = query(collection(db, DENUNCIAS_INTENCAO_COLLECTION), orderBy('criadaEm', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DenunciaIntencao));
  } catch (err) {
    console.error('[DB] Erro ao buscar denúncias:', err);
    return [];
  }
}

export async function updateDenunciaIntencaoStatus(
  id: string,
  status: string,
  investigadorId: string,
  acaoTomada?: string,
  notas?: string,
): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status, investigadorId };
    if (status === 'resolvida') {
      updates.resolvidaEm = Timestamp.now();
    }
    if (acaoTomada) updates.acaoTomada = acaoTomada;
    if (notas) updates.notas = notas;
    await updateDoc(doc(db, DENUNCIAS_INTENCAO_COLLECTION, id) as any, updates as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar denúncia:', err);
    throw err;
  }
}

export async function getAllIntencoesAdmin(): Promise<IntencaoCompra[]> {
  try {
    const snap = await getDocs(collection(db, INTENCOES_COLLECTION));
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as IntencaoCompra));
    results.sort((a, b) => {
      const aTime = a.atualizadaEm?.toDate?.()?.getTime() || 0;
      const bTime = b.atualizadaEm?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
    return results;
  } catch (err) {
    console.error('[DB] Erro ao buscar intenções (admin):', err);
    return [];
  }
}

export async function getIntencoesAtivas(): Promise<IntencaoCompra[]> {
  try {
    const q = query(
      collection(db, INTENCOES_COLLECTION),
      where('status', '==', 'ativa'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as IntencaoCompra));
  } catch (err) {
    console.error('[DB] Erro ao buscar intenções ativas:', err);
    return [];
  }
}

export async function updateIntencaoStatus(id: string, status: string): Promise<void> {
  try {
    await updateDoc(doc(db, INTENCOES_COLLECTION, id) as any, { status, atualizadaEm: Timestamp.now() } as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar status da intenção:', err);
    throw err;
  }
}

// ============ OFICINAS E MECÂNICOS ============
import type { OficinaMecanico } from '@/types/oficina';

export async function getOficinas(): Promise<OficinaMecanico[]> {
  try {
    const q = query(collection(db, OFICINAS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OficinaMecanico));
    return todas.filter((c) => c.status === 'aprovado');
  } catch (err) {
    console.error('[DB] Erro ao buscar oficinas:', err);
    return [];
  }
}

export function subscribeOficinas(
  onData: (oficinas: OficinaMecanico[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, OFICINAS_COLLECTION), orderBy('dataCriacao', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OficinaMecanico);
      onData(todas.filter((c) => c.status === 'aprovado'));
    },
    (err) => {
      console.error('[DB] Erro no snapshot de oficinas:', err);
      onError?.(err);
    },
  );
}

export async function getOficinaPorId(id: string): Promise<OficinaMecanico | null> {
  try {
    const docRef = doc(db, OFICINAS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as OficinaMecanico;
    }
    return null;
  } catch (err) {
    console.error('[DB] Erro ao buscar oficina:', err);
    return null;
  }
}

export async function addOficina(dados: Record<string, unknown>): Promise<OficinaMecanico> {
  try {
    const docRef = await addDoc(collection(db, OFICINAS_COLLECTION), {
      ...dados,
      status: 'pendente',
      dataCriacao: Timestamp.now(),
    });
    return { id: docRef.id, ...dados, status: 'pendente' } as OficinaMecanico;
  } catch (err) {
    console.error('[DB] Erro ao adicionar oficina:', err);
    throw err;
  }
}

export async function updateOficina(id: string, dados: Record<string, unknown>): Promise<void> {
  try {
    await updateDoc(doc(db, OFICINAS_COLLECTION, id) as any, dados as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar oficina:', err);
    throw err;
  }
}

export async function updateOficinaStatus(id: string, status: 'pendente' | 'aprovado' | 'rejeitado'): Promise<void> {
  try {
    await updateDoc(doc(db, OFICINAS_COLLECTION, id) as any, { status } as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar status da oficina:', err);
    throw err;
  }
}

export async function getOficinasByCreator(email: string): Promise<OficinaMecanico[]> {
  try {
    const q = query(collection(db, OFICINAS_COLLECTION), where('criador', '==', email));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OficinaMecanico));
  } catch (err) {
    console.error('[DB] Erro ao buscar oficinas do criador:', err);
    return [];
  }
}

export async function deleteOficina(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, OFICINAS_COLLECTION, id));
  } catch (err) {
    console.error('[DB] Erro ao eliminar oficina:', err);
    throw err;
  }
}

export async function getAllOficinasAdmin(): Promise<OficinaMecanico[]> {
  try {
    const q = query(collection(db, OFICINAS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OficinaMecanico));
  } catch (err) {
    console.error('[DB] Erro ao buscar oficinas (admin):', err);
    return [];
  }
}

