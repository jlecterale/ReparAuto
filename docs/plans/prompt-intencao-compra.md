# Prompt para Implementação: Intenção de Compra

## Instrução

Implemente o sistema de "Intenção de Compra" no ReparAuto conforme o plano em [`docs/plans/15-intencao-de-compra.md`](docs/plans/15-intencao-de-compra.md), com as correções arquiteturais abaixo.

---

## 1. Tipos TypeScript

### 1.1 Criar [`src/types/intencao.ts`](src/types/intencao.ts)

```typescript
import type { Timestamp } from 'firebase/firestore';

export type StatusIntencao = 'ativa' | 'pausada' | 'expirada' | 'deletada';
export type ContatoPreferido = 'chat' | 'whatsapp' | 'ambos';
export type CombustivelIntencao = 'gasolina' | 'diesel' | 'hibrido' | 'eletrico' | 'GPL' | 'qualquer';
export type TransmissaoIntencao = 'manual' | 'automatico' | 'qualquer';
export type CarroceriaIntencao = 'sedan' | 'suv' | 'hatchback' | 'coupe' | 'camionieta' | 'monovolume';
export type StatusContatoIntencao = 'aberto' | 'respondido' | 'aceito' | 'rejeitado' | 'finalizado';
export type StatusDenunciaIntencao = 'aberta' | 'investigando' | 'resolvida';
export type MotivoDenunciaIntencao = 'falsa' | 'spam' | 'golpe' | 'outra';

export interface IntencaoCompra {
  id: string;
  userId: string;
  titulo: string;
  descricao?: string;
  criterios: {
    marca: string;
    modelo: string;
    anoMinimo: number;
    anoMaximo?: number;
    precoMinimo?: number;
    precoMaximo: number;
    combustivel: CombustivelIntencao[];
    tipoTransmissao: TransmissaoIntencao[];
    quilometragemMaxima: number;
    localizacao: {
      distrito: string;
      raio: number;
      latitude?: number;
      longitude?: number;
    };
  };
  preferencias?: {
    cores?: string[];
    tipoCarroceria?: CarroceriaIntencao[];
    itensDesejados?: string[];
    aceitaFinanciamento?: boolean;
    aceitaTroca?: boolean;
    aceitaVeiculo23Registros?: boolean;
  };
  contatoPreferido: ContatoPreferido;
  mostrarTelefone: boolean;
  status: StatusIntencao;
  prioritária: boolean;
  destaque?: {
    ativo: boolean;
    tipo?: 'destacada' | 'superdestacar';
    dataInicio?: Timestamp;
    dataFim?: Timestamp;
    posicao?: number;
    recorrente?: boolean;
  };
  stats: {
    visualizacoes: number;
    visualizacoes7Dias: number;
    contatos: number;
    contatos7Dias: number;
  };
  criadaEm: Timestamp;
  atualizadaEm: Timestamp;
  expiradoEm?: Timestamp;
  deletadaEm?: Timestamp;
}

export type IntencaoCompraInput = Omit<IntencaoCompra, 'id' | 'criadaEm' | 'atualizadaEm' | 'stats' | 'prioritária' | 'destaque'>;

export interface ContatoIntencao {
  id: string;
  intencaoId: string;
  vendedorId: string;
  vendedorNome?: string;
  vendedorAvatar?: string;
  carroId?: string;
  carroMarca?: string;
  carroModelo?: string;
  carroAno?: number;
  titulo: string;
  descricao?: string;
  precoOferido?: number;
  status: StatusContatoIntencao;
  chatId: string;
  ultimaMensagemEm?: Timestamp;
  marcadoComoRelevante: boolean;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export type ContatoIntencaoInput = Omit<ContatoIntencao, 'id' | 'criadoEm' | 'atualizadoEm'>;

export interface DenunciaIntencao {
  id: string;
  intencaoId: string;
  denunciantId: string;
  motivo: MotivoDenunciaIntencao;
  descricao: string;
  status: StatusDenunciaIntencao;
  acaoTomada?: 'aviso' | 'suspensao' | 'remocao';
  investigadorId?: string;
  notas?: string;
  criadaEm: Timestamp;
  resolvidaEm?: Timestamp;
}

export interface IntencaoContextValue {
  intencoes: IntencaoCompra[];
  loading: boolean;
  criarIntencao: (dados: IntencaoCompraInput) => Promise<string>;
  getIntencoesPorUsuario: (userId: string) => Promise<IntencaoCompra[]>;
  getIntencaoPorId: (id: string) => Promise<IntencaoCompra | null>;
  atualizarIntencao: (id: string, userId: string, updates: Partial<IntencaoCompra>) => Promise<void>;
  pausarIntencao: (id: string, userId: string) => Promise<void>;
  reativarIntencao: (id: string, userId: string) => Promise<void>;
  deletarIntencao: (id: string, userId: string) => Promise<void>;
  buscarIntencoesMatch: (carro: any, usuarioId: string) => Promise<IntencaoCompra[]>;
  iniciarContato: (intencaoId: string, vendedorId: string, carroId?: string, mensagem?: string) => Promise<string>;
  getContatosPorIntencao: (intencaoId: string) => Promise<ContatoIntencao[]>;
}
```

### 1.2 Atualizar [`src/types/index.ts`](src/types/index.ts)

Adicione exports:
```typescript
export type {
  IntencaoCompra, IntencaoCompraInput,
  ContatoIntencao, ContatoIntencaoInput,
  DenunciaIntencao,
  IntencaoContextValue,
  StatusIntencao, ContatoPreferido,
  CombustivelIntencao, TransmissaoIntencao, CarroceriaIntencao,
  StatusContatoIntencao,
} from './intencao';
```

### 1.3 Atualizar [`src/types/chat.ts`](src/types/chat.ts)

Mude `ListingType` para:
```typescript
export type ListingType = 'carro' | 'peca' | 'intencao';
```

### 1.4 Atualizar [`src/types/app.ts`](src/types/app.ts)

Adicione no `AppContextValue`:
```typescript
import type { IntencaoContextValue } from './intencao';
// ...
export interface AppContextValue {
  // ...existing
  intencoes: IntencaoContextValue;
}
```

---

## 2. Firestore — [`src/lib/db.ts`](src/lib/db.ts)

Adicione no topo:
```typescript
import type { IntencaoCompra, IntencaoCompraInput, ContatoIntencao, ContatoIntencaoInput, DenunciaIntencao } from '@/types/intencao';
```

### 2.1 CRUD Intenção de Compra

```typescript
const INTENCOES_COLLECTION = 'intencoes_compra';
const CONTATOS_INTENCAO_COLLECTION = 'contatos_intencao';
const DENUNCIAS_INTENCAO_COLLECTION = 'denuncias_intencao';

export async function criarIntencaoCompra(
  userId: string,
  dados: IntencaoCompraInput
): Promise<string> {
  const titulo = `Procuro: ${dados.criterios.marca} ${dados.criterios.modelo} até ${dados.criterios.precoMaximo}€`;
  const intencaoId = doc(collection(db, INTENCOES_COLLECTION)).id;
  await setDoc(doc(db, INTENCOES_COLLECTION, intencaoId), {
    id: intencaoId,
    userId,
    titulo,
    ...dados,
    status: 'ativa',
    prioritária: false,
    stats: {
      visualizacoes: 0,
      visualizacoes7Dias: 0,
      contatos: 0,
      contatos7Dias: 0,
    },
    criadaEm: Timestamp.now(),
    atualizadaEm: Timestamp.now(),
  });
  return intencaoId;
}

export async function getIntencaoCompra(intencaoId: string): Promise<IntencaoCompra | null> {
  const snap = await getDoc(doc(db, INTENCOES_COLLECTION, intencaoId));
  if (!snap.exists()) return null;
  const data = { id: snap.id, ...snap.data() } as IntencaoCompra;
  // Increment visualizações (apenas se não for o próprio dono - controle no frontend)
  return data;
}

export async function getIntencoesPorUsuario(userId: string): Promise<IntencaoCompra[]> {
  const q = query(
    collection(db, INTENCOES_COLLECTION),
    where('userId', '==', userId),
    orderBy('atualizadaEm', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as IntencaoCompra))
    .filter(i => i.status !== 'deletada');
}

export async function atualizarIntencaoCompra(
  intencaoId: string,
  userId: string,
  updates: Partial<IntencaoCompra>
): Promise<void> {
  const intencao = await getIntencaoCompra(intencaoId);
  if (!intencao || intencao.userId !== userId) throw new Error('Não autorizado');
  await updateDoc(doc(db, INTENCOES_COLLECTION, intencaoId), {
    ...updates,
    atualizadaEm: Timestamp.now(),
  });
}

export async function deletarIntencaoCompra(intencaoId: string, userId: string): Promise<void> {
  const intencao = await getIntencaoCompra(intencaoId);
  if (!intencao || intencao.userId !== userId) throw new Error('Não autorizado');
  await updateDoc(doc(db, INTENCOES_COLLECTION, intencaoId), {
    status: 'deletada',
    deletadaEm: Timestamp.now(),
    atualizadaEm: Timestamp.now(),
  });
}

export async function pausarIntencaoCompra(intencaoId: string, userId: string): Promise<void> {
  const intencao = await getIntencaoCompra(intencaoId);
  if (!intencao || intencao.userId !== userId) throw new Error('Não autorizado');
  await updateDoc(doc(db, INTENCOES_COLLECTION, intencaoId), {
    status: 'pausada',
    expiradoEm: Timestamp.now(),
    atualizadaEm: Timestamp.now(),
  });
}

export async function reativarIntencaoCompra(intencaoId: string, userId: string): Promise<void> {
  const intencao = await getIntencaoCompra(intencaoId);
  if (!intencao || intencao.userId !== userId) throw new Error('Não autorizado');
  await updateDoc(doc(db, INTENCOES_COLLECTION, intencaoId), {
    status: 'ativa',
    expiradoEm: null,
    atualizadaEm: Timestamp.now(),
  });
}
```

### 2.2 Matching (CORREÇÃO ARQUITETURAL)

```typescript
export async function buscarIntencoesMatch(
  carro: any,
  usuarioId: string
): Promise<IntencaoCompra[]> {
  // Query apenas por status + marca (Firestore não suporta <= e >= em campos diferentes no mesmo índice)
  const q = query(
    collection(db, INTENCOES_COLLECTION),
    where('status', '==', 'ativa'),
    where('criterios.marca', '==', carro.marca)
  );
  const snap = await getDocs(q);
  let resultados = snap.docs.map(d => ({ id: d.id, ...d.data() } as IntencaoCompra));

  // Filtrar no cliente-side (necessário porque Firestore não suporta range queries em múltiplos campos)
  resultados = resultados.filter(intencao => {
    // Ano
    if (carro.anoFabricacao < intencao.criterios.anoMinimo) return false;
    if (intencao.criterios.anoMaximo && carro.anoFabricacao > intencao.criterios.anoMaximo) return false;
    // Preço
    if (intencao.criterios.precoMinimo && carro.preco < intencao.criterios.precoMinimo) return false;
    if (carro.preco > intencao.criterios.precoMaximo) return false;
    // Combustível (mapear string do carro para o formato da intenção)
    const combMap: Record<string, string> = { 'Gasolina': 'gasolina', 'Diesel': 'diesel', 'Elétrico': 'eletrico', 'Híbrido': 'hibrido', 'GPL': 'GPL' };
    const combCarro = combMap[carro.combustivel] || carro.combustivel?.toLowerCase();
    if (!intencao.criterios.combustivel.includes('qualquer') && !intencao.criterios.combustivel.includes(combCarro)) return false;
    // Transmissão
    const transMap: Record<string, string> = { 'Manual': 'manual', 'Automático': 'automatico', 'CVT': 'automatico' };
    const transCarro = transMap[carro.cambio] || carro.cambio?.toLowerCase();
    if (!intencao.criterios.tipoTransmissao.includes('qualquer') && !intencao.criterios.tipoTransmissao.includes(transCarro)) return false;
    // Quilometragem
    if (carro.km > intencao.criterios.quilometragemMaxima) return false;
    // Localização (aproximada por distrito)
    if (intencao.criterios.localizacao.distrito && carro.distrito) {
      if (intencao.criterios.localizacao.distrito !== carro.distrito && intencao.criterios.localizacao.raio < 200) {
        // Se raio for < 200km, considerar apenas mesmo distrito (simplificação para MVP)
        // Para versão completa, usar geohash ou serviço de geocoding
      }
    }
    // Não mostrar intenções do próprio usuário
    if (intencao.userId === usuarioId) return false;
    return true;
  });

  // Ordenar por destaque
  resultados.sort((a, b) => {
    if (a.destaque?.ativo && !b.destaque?.ativo) return -1;
    if (!a.destaque?.ativo && b.destaque?.ativo) return 1;
    return b.stats.visualizacoes7Dias - a.stats.visualizacoes7Dias;
  });

  return resultados;
}
```

### 2.3 Contatos

```typescript
export async function iniciarContatoIntencao(
  intencaoId: string,
  vendedorId: string,
  vendedorNome: string,
  carroId?: string,
  mensagem?: string
): Promise<string> {
  const intencao = await getIntencaoCompra(intencaoId);
  if (!intencao) throw new Error('Intenção não encontrada');

  // Criar chat
  const chatId = doc(collection(db, 'messages')).id; // Simplificado; idealmente reutilizar lógica existente

  // Registrar contato
  const contatoId = doc(collection(db, CONTATOS_INTENCAO_COLLECTION)).id;
  await setDoc(doc(db, CONTATOS_INTENCAO_COLLECTION, contatoId), {
    id: contatoId,
    intencaoId,
    vendedorId,
    vendedorNome,
    carroId,
    titulo: carroId ? 'Tenho um carro para você!' : 'Interesse em sua intenção',
    descricao: mensagem || '',
    status: 'aberto',
    chatId,
    marcadoComoRelevante: false,
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  });

  // Atualizar stats da intenção
  await updateDoc(doc(db, INTENCOES_COLLECTION, intencaoId), {
    'stats.contatos': increment(1),
    'stats.contatos7Dias': increment(1),
  });

  // Notificar comprador
  await criarNotificacao(
    intencao.userId,
    'mensagem',
    'Novo interessado!',
    `${vendedorNome} está interessado em sua intenção: ${intencao.titulo}`,
    `/intencao/${intencaoId}/contatos`
  );

  return contatoId;
}

export async function getContatosPorIntencao(intencaoId: string): Promise<ContatoIntencao[]> {
  const q = query(
    collection(db, CONTATOS_INTENCAO_COLLECTION),
    where('intencaoId', '==', intencaoId),
    orderBy('criadoEm', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ContatoIntencao));
}

export async function marcarContatoRelevante(contatoId: string, userId: string): Promise<void> {
  const snap = await getDoc(doc(db, CONTATOS_INTENCAO_COLLECTION, contatoId));
  if (!snap.exists()) throw new Error('Contato não encontrado');
  const contato = snap.data() as ContatoIntencao;
  const intencao = await getIntencaoCompra(contato.intencaoId);
  if (!intencao || intencao.userId !== userId) throw new Error('Não autorizado');
  await updateDoc(doc(db, CONTATOS_INTENCAO_COLLECTION, contatoId), {
    marcadoComoRelevante: true,
    atualizadoEm: Timestamp.now(),
  });
}

export async function rejeitarContato(contatoId: string, userId: string): Promise<void> {
  const snap = await getDoc(doc(db, CONTATOS_INTENCAO_COLLECTION, contatoId));
  if (!snap.exists()) throw new Error('Contato não encontrado');
  const contato = snap.data() as ContatoIntencao;
  const intencao = await getIntencaoCompra(contato.intencaoId);
  if (!intencao || intencao.userId !== userId) throw new Error('Não autorizado');
  await updateDoc(doc(db, CONTATOS_INTENCAO_COLLECTION, contatoId), {
    status: 'rejeitado',
    atualizadoEm: Timestamp.now(),
  });
}
```

### 2.4 Denúncias

```typescript
export async function criarDenunciaIntencao(
  intencaoId: string,
  denunciantId: string,
  motivo: MotivoDenunciaIntencao,
  descricao: string
): Promise<string> {
  const denunciaId = doc(collection(db, DENUNCIAS_INTENCAO_COLLECTION)).id;
  await setDoc(doc(db, DENUNCIAS_INTENCAO_COLLECTION, denunciaId), {
    id: denunciaId,
    intencaoId,
    denunciantId,
    motivo,
    descricao,
    status: 'aberta',
    criadaEm: Timestamp.now(),
  });
  return denunciaId;
}

export async function getDenunciasIntencao(): Promise<DenunciaIntencao[]> {
  const q = query(collection(db, DENUNCIAS_INTENCAO_COLLECTION), orderBy('criadaEm', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DenunciaIntencao));
}

export async function atualizarDenunciaIntencao(
  id: string,
  status: StatusDenunciaIntencao,
  acaoTomada?: 'aviso' | 'suspensao' | 'remocao',
  investigadorId?: string,
  notas?: string
): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (acaoTomada) updates.acaoTomada = acaoTomada;
  if (investigadorId) updates.investigadorId = investigadorId;
  if (notas) updates.notas = notas;
  if (status === 'resolvida') updates.resolvidaEm = Timestamp.now();
  await updateDoc(doc(db, DENUNCIAS_INTENCAO_COLLECTION, id) as any, updates as any);
}
```

---

## 3. Firestore Indexes — [`firestore.indexes.json`](firestore.indexes.json)

Adicione:
```json
{
  "collectionGroup": "intencoes_compra",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "userId", "order": "ASCENDING"},
    {"fieldPath": "status", "order": "ASCENDING"},
    {"fieldPath": "atualizadaEm", "order": "DESCENDING"}
  ]
},
{
  "collectionGroup": "intencoes_compra",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "status", "order": "ASCENDING"},
    {"fieldPath": "criterios.marca", "order": "ASCENDING"},
    {"fieldPath": "atualizadaEm", "order": "DESCENDING"}
  ]
},
{
  "collectionGroup": "contatos_intencao",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "intencaoId", "order": "ASCENDING"},
    {"fieldPath": "criadoEm", "order": "DESCENDING"}
  ]
},
{
  "collectionGroup": "contatos_intencao",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "vendedorId", "order": "ASCENDING"},
    {"fieldPath": "status", "order": "ASCENDING"},
    {"fieldPath": "criadoEm", "order": "DESCENDING"}
  ]
}
```

---

## 4. Firestore Rules — [`firestore.rules`](firestore.rules)

Adicione antes do fechamento `}`:
```javascript
match /intencoes_compra/{intencaoId} {
  allow read: if resource.data.status in ['ativa', 'pausada'] ||
                (isAuthenticated() && resource.data.userId == request.auth.uid);
  allow create: if isAuthenticated() &&
                  request.resource.data.userId == request.auth.uid;
  allow update: if isAuthenticated() &&
                  resource.data.userId == request.auth.uid;
  allow delete: if false; // soft delete via update
}

match /contatos_intencao/{contatoId} {
  allow read: if isAuthenticated() && (
    request.auth.uid == resource.data.vendedorId ||
    request.auth.uid == get(/databases/$(database)/documents/intencoes_compra/$(resource.data.intencaoId)).data.userId ||
    isAdmin()
  );
  allow create: if isAuthenticated() &&
                  request.resource.data.vendedorId == request.auth.uid;
  allow update: if isAuthenticated() && (
    request.auth.uid == resource.data.vendedorId ||
    request.auth.uid == get(/databases/$(database)/documents/intencoes_compra/$(resource.data.intencaoId)).data.userId
  );
  allow delete: if false;
}

match /denuncias_intencao/{denunciaId} {
  allow read: if isAuthenticated() && (
    request.auth.uid == resource.data.denunciantId || isAdmin()
  );
  allow create: if isAuthenticated() &&
                  request.resource.data.denunciantId == request.auth.uid;
  allow update: if isAdmin();
  allow delete: if false;
}
```

---

## 5. Hook — [`src/hooks/useIntencoes.ts`](src/hooks/useIntencoes.ts)

```typescript
'use client';

import { useState, useCallback } from 'react';
import type { IntencaoCompra, IntencaoCompraInput, ContatoIntencao, IntencaoContextValue } from '@/types/intencao';
import {
  criarIntencaoCompra,
  getIntencoesPorUsuario,
  getIntencaoCompra,
  atualizarIntencaoCompra,
  pausarIntencaoCompra,
  reativarIntencaoCompra,
  deletarIntencaoCompra,
  buscarIntencoesMatch,
  iniciarContatoIntencao,
  getContatosPorIntencao,
} from '@/lib/db';

export function useIntencoes(user: { uid: string; nome: string } | null): IntencaoContextValue {
  const [intencoes, setIntencoes] = useState<IntencaoCompra[]>([]);
  const [loading, setLoading] = useState(false);

  const criarIntencao = useCallback(async (dados: IntencaoCompraInput): Promise<string> => {
    if (!user) throw new Error('Utilizador não autenticado');
    const id = await criarIntencaoCompra(user.uid, dados);
    // Recarregar lista
    const atualizadas = await getIntencoesPorUsuario(user.uid);
    setIntencoes(atualizadas);
    return id;
  }, [user]);

  const fetchIntencoes = useCallback(async (userId: string) => {
    setLoading(true);
    const data = await getIntencoesPorUsuario(userId);
    setIntencoes(data);
    setLoading(false);
  }, []);

  const getIntencoes = useCallback(async (userId: string) => {
    return getIntencoesPorUsuario(userId);
  }, []);

  const getPorId = useCallback(async (id: string) => {
    return getIntencaoCompra(id);
  }, []);

  const atualizar = useCallback(async (id: string, userId: string, updates: Partial<IntencaoCompra>) => {
    await atualizarIntencaoCompra(id, userId, updates);
    const atualizadas = await getIntencoesPorUsuario(userId);
    setIntencoes(atualizadas);
  }, []);

  const pausar = useCallback(async (id: string, userId: string) => {
    await pausarIntencaoCompra(id, userId);
    const atualizadas = await getIntencoesPorUsuario(userId);
    setIntencoes(atualizadas);
  }, []);

  const reativar = useCallback(async (id: string, userId: string) => {
    await reativarIntencaoCompra(id, userId);
    const atualizadas = await getIntencoesPorUsuario(userId);
    setIntencoes(atualizadas);
  }, []);

  const deletar = useCallback(async (id: string, userId: string) => {
    await deletarIntencaoCompra(id, userId);
    const atualizadas = await getIntencoesPorUsuario(userId);
    setIntencoes(atualizadas);
  }, []);

  const buscarMatch = useCallback(async (carro: any, usuarioId: string) => {
    return buscarIntencoesMatch(carro, usuarioId);
  }, []);

  const iniciarContato = useCallback(async (
    intencaoId: string,
    vendedorId: string,
    carroId?: string,
    mensagem?: string
  ) => {
    return iniciarContatoIntencao(intencaoId, vendedorId, user?.nome || '', carroId, mensagem);
  }, [user]);

  const getContatos = useCallback(async (intencaoId: string) => {
    return getContatosPorIntencao(intencaoId);
  }, []);

  return {
    intencoes,
    loading,
    criarIntencao,
    getIntencoesPorUsuario: getIntencoes,
    getIntencaoPorId: getPorId,
    atualizarIntencao: atualizar,
    pausarIntencao: pausar,
    reativarIntencao: reativar,
    deletarIntencao: deletar,
    buscarIntencoesMatch: buscarMatch,
    iniciarContato,
    getContatosPorIntencao: getContatos,
  };
}
```

---

## 6. Provider — [`src/providers/AppProvider.tsx`](src/providers/AppProvider.tsx)

Adicione:
```typescript
import { useIntencoes } from '@/hooks/useIntencoes';
import type { IntencaoContextValue } from '@/types/intencao';

// Dentro do componente:
const intencoes = useIntencoes(auth.user);

// No value:
const value: AppContextValue = {
  // ...existing
  intencoes,
};
```

---

## 7. Constants — [`src/lib/constants.ts`](src/lib/constants.ts)

Adicione:
```typescript
export const COMBUSTIVEIS_INTENCAO = [
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'eletrico', label: 'Elétrico' },
  { value: 'GPL', label: 'GPL' },
  { value: 'qualquer', label: 'Qualquer' },
];

export const TRANSMISSOES_INTENCAO = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatico', label: 'Automático' },
  { value: 'qualquer', label: 'Qualquer' },
];

export const CORES_INTENCAO = [
  { value: 'branco', label: 'Branco' },
  { value: 'preto', label: 'Preto' },
  { value: 'prata', label: 'Prata' },
  { value: 'azul', label: 'Azul' },
  { value: 'vermelho', label: 'Vermelho' },
  { value: 'verde', label: 'Verde' },
  { value: 'cinzento', label: 'Cinzento' },
  { value: 'outro', label: 'Outro' },
];

export const CARROCERIAS_INTENCAO = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'coupe', label: 'Coupé' },
  { value: 'camionieta', label: 'Camioneta' },
  { value: 'monovolume', label: 'Monovolume' },
];

export const ITENS_SERIE = [
  { value: 'GPS', label: 'GPS' },
  { value: 'teto_panoramico', label: 'Teto panorâmico' },
  { value: 'couro', label: 'Bancos em couro' },
  { value: 'ar_condicionado', label: 'Ar condicionado' },
  { value: 'vidros_eletricos', label: 'Vidros elétricos' },
  { value: 'sensores_estacionamento', label: 'Sensores de estacionamento' },
  { value: 'bluetooth', label: 'Bluetooth' },
];

export const CONTATO_PREFERIDO_OPTIONS = [
  { value: 'chat', label: '💬 Chat do app' },
  { value: 'whatsapp', label: '🟢 WhatsApp' },
  { value: 'ambos', label: '🔄 Ambos' },
];

export const TEMPO_EXPIRACAO_INTENCAO_MS = 90 * 24 * 60 * 60 * 1000; // 90 dias
```

---

## 8. Utils — [`src/lib/utils.ts`](src/lib/utils.ts)

Adicione:
```typescript
export function gerarTituloIntencao(criterios: {
  marca: string;
  modelo: string;
  precoMaximo: number;
}): string {
  return `Procuro: ${criterios.marca} ${criterios.modelo} até ${formatarPreco(criterios.precoMaximo)}`;
}

export interface ValidationResult {
  valido: boolean;
  erros: string[];
}

export function validarIntencaoCompra(dados: any): ValidationResult {
  const erros: string[] = [];
  if (!dados.criterios?.marca) erros.push('Marca é obrigatória');
  if (!dados.criterios?.modelo) erros.push('Modelo é obrigatório');
  if (!dados.criterios?.anoMinimo) erros.push('Ano mínimo é obrigatório');
  if (!dados.criterios?.precoMaximo) erros.push('Orçamento máximo é obrigatório');
  if (dados.criterios?.anoMinimo && dados.criterios?.anoMaximo) {
    if (dados.criterios.anoMinimo > dados.criterios.anoMaximo) erros.push('Ano mínimo não pode ser maior que o máximo');
    if (dados.criterios.anoMinimo < 1990) erros.push('Ano mínimo deve ser 1990 ou depois');
  }
  if (dados.criterios?.precoMinimo && dados.criterios?.precoMaximo) {
    if (dados.criterios.precoMinimo > dados.criterios.precoMaximo) erros.push('Preço mínimo não pode ser maior que o máximo');
  }
  if (!dados.criterios?.combustivel?.length) erros.push('Selecione ao menos um tipo de combustível');
  if (!dados.criterios?.tipoTransmissao?.length) erros.push('Selecione ao menos um tipo de transmissão');
  if (!dados.criterios?.localizacao?.distrito) erros.push('Distrito é obrigatório');
  if (dados.criterios?.localizacao?.raio === undefined) erros.push('Raio de busca é obrigatório');
  if (!dados.contatoPreferido) erros.push('Selecione forma de contacto preferida');
  if (dados.descricao && dados.descricao.length > 500) erros.push('Descrição não pode ter mais de 500 caracteres');
  return { valido: erros.length === 0, erros };
}
```

---

## 9. Componentes do Formulário

### 9.1 Criar pasta [`src/components/intencao/`](src/components/intencao/)

### 9.2 Componentes do Formulário Multi-Step

Crie os seguintes componentes em [`src/components/intencao/`](src/components/intencao/):

**`CriarIntencaoCompra.tsx`** — Container principal com:
- Estado do formulário (useState para cada campo)
- 6 steps controlados por `passo` state
- `StepIndicator` com os passos: Básico → Preço → Localização → Preferências → Contacto → Resumo
- Navegação entre steps (Anterior/Próximo)
- Validação por step (só avança se step atual for válido)
- Submit: chama `criarIntencao()` do hook e redireciona para `/minhas-intencoes`
- Toast de sucesso/erro

**`StepBasico.tsx`**:
- Select Marca (usar `useMarcasModelos`)
- Select Modelo (dependente da marca)
- RangeInput para Ano (min: 1990, max: ano atual)
- Validação: marca, modelo e anoMinimo obrigatórios

**`StepPrecoCombustivel.tsx`**:
- RangeInput para Preço (min: 0, max: 100000, step: 500)
- MultiCheckbox para Combustível (usar `COMBUSTIVEIS_INTENCAO`)
- MultiCheckbox para Transmissão (usar `TRANSMISSOES_INTENCAO`)
- Validação: precoMaximo, pelo menos 1 combustível e 1 transmissão

**`StepLocalizacao.tsx`**:
- Select Distrito (usar `useDistritosConcelhos`)
- RangeInput para Raio (min: 0, max: 200, step: 10)
- NumberInput para Km máximo
- Validação: distrito e raio obrigatórios

**`StepPreferencias.tsx`**:
- MultiCheckbox para Cores (usar `CORES_INTENCAO`)
- MultiCheckbox para Carroceria (usar `CARROCERIAS_INTENCAO`)
- MultiCheckbox para Itens Desejados (usar `ITENS_SERIE`)
- Toggle: Aceita financiamento?
- Toggle: Aceita troca?
- Todos opcionais

**`StepContato.tsx`**:
- RadioGroup para forma de contacto (usar `CONTATO_PREFERIDO_OPTIONS`)
- Toggle: Mostrar telefone?
- TextArea para descrição adicional (max 500 chars)
- Validação: contatoPreferido obrigatório

**`StepResumo.tsx`**:
- Card de resumo com todos os dados preenchidos
- Checkbox "Concordo com os Termos de Serviço"
- Botão "Publicar Intenção de Compra"
- Validação: checkbox obrigatório

### 9.3 Componentes Compartilhados

Se não existirem, crie componentes UI reutilizáveis:
- `MultiCheckbox` — grupo de checkboxes com label
- `RangeInput` — dois inputs (min/max) com label
- `RadioGroup` — grupo de radio buttons

---

## 10. Páginas

### 10.1 [`src/screens/MinhasIntencoes.tsx`](src/screens/MinhasIntencoes.tsx)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { formatarPreco } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { IntencaoCompra } from '@/types/intencao';

export default function MinhasIntencoes() {
  const { auth, intencoes } = useApp();
  const { user } = auth;
  const router = useRouter();
  const [tab, setTab] = useState<'ativas' | 'pausadas' | 'expiradas'>('ativas');

  useEffect(() => {
    if (user) {
      intencoes.getIntencoesPorUsuario(user.uid);
    }
  }, [user]);

  const filtered = intencoes.intencoes.filter(i => {
    if (tab === 'ativas') return i.status === 'ativa';
    if (tab === 'pausadas') return i.status === 'pausada';
    return i.status === 'expirada';
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Faça login para ver suas intenções de compra.</p>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-brand-900">Minhas Intenções de Compra</h1>
        <Button variant="primary" onClick={() => router.push('/anunciar?modo=comprar')}>
          + Nova Intenção
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {(['ativas', 'pausadas', 'expiradas'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              tab === t
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t === 'ativas' && `Ativas (${intencoes.intencoes.filter(i => i.status === 'ativa').length})`}
            {t === 'pausadas' && `Pausadas (${intencoes.intencoes.filter(i => i.status === 'pausada').length})`}
            {t === 'expiradas' && `Expiradas (${intencoes.intencoes.filter(i => i.status === 'expirada').length})`}
          </button>
        ))}
      </div>

      {/* Lista */}
      {intencoes.loading ? (
        <div className="text-center py-8">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-accent"></i>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <i className="fa-solid fa-search text-4xl text-slate-300 mb-3"></i>
          <p className="text-slate-500 font-semibold">Nenhuma intenção {tab}</p>
          <p className="text-sm text-slate-400 mt-1">
            Publique o que procura e receba ofertas de vendedores.
          </p>
          <Button variant="primary" className="mt-4" onClick={() => router.push('/anunciar?modo=comprar')}>
            Criar Intenção de Compra
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(intencao => (
            <IntencaoCard
              key={intencao.id}
              intencao={intencao}
              onViewContatos={() => router.push(`/intencao/${intencao.id}/contatos`)}
              onPause={() => intencoes.pausarIntencao(intencao.id, user.uid)}
              onReactivate={() => intencoes.reativarIntencao(intencao.id, user.uid)}
              onDelete={() => {
                if (confirm('Tem certeza que deseja eliminar esta intenção?')) {
                  intencoes.deletarIntencao(intencao.id, user.uid);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IntencaoCard({
  intencao,
  onViewContatos,
  onPause,
  onReactivate,
  onDelete,
}: {
  intencao: IntencaoCompra;
  onViewContatos: () => void;
  onPause: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-extrabold text-brand-900">
            {intencao.criterios.marca} {intencao.criterios.modelo}
            {intencao.destaque?.ativo && (
              <Badge cor="warning" className="ml-2">⭐ Destacada</Badge>
            )}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">{intencao.titulo}</p>
        </div>
        <Badge cor={intencao.status === 'ativa' ? 'success' : intencao.status === 'pausada' ? 'warning' : 'default'}>
          {intencao.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
        <div>
          <span className="text-slate-400">Ano</span>
          <p className="font-semibold">{intencao.criterios.anoMinimo}–{intencao.criterios.anoMaximo || 'hoje'}</p>
        </div>
        <div>
          <span className="text-slate-400">Preço</span>
          <p className="font-semibold">{formatarPreco(intencao.criterios.precoMinimo || 0)}–{formatarPreco(intencao.criterios.precoMaximo)}</p>
        </div>
        <div>
          <span className="text-slate-400">Combustível</span>
          <p className="font-semibold">{intencao.criterios.combustivel.join(', ')}</p>
        </div>
        <div>
          <span className="text-slate-400">Localização</span>
          <p className="font-semibold">{intencao.criterios.localizacao.distrito} ({intencao.criterios.localizacao.raio}km)</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
        <span>👁 {intencao.stats.visualizacoes} visualizações</span>
        <span>💬 {intencao.stats.contatos} contatos</span>
        <span>📅 {new Date(intencao.criadaEm?.toDate?.() || intencao.criadaEm).toLocaleDateString('pt-PT')}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={onViewContatos}>
          👥 Ver Contatos ({intencao.stats.contatos})
        </Button>
        {intencao.status === 'ativa' && (
          <Button variant="ghost" size="sm" onClick={onPause}>
            ⏸️ Pausar
          </Button>
        )}
        {intencao.status === 'pausada' && (
          <Button variant="secondary" size="sm" onClick={onReactivate}>
            ▶️ Reativar
          </Button>
        )}
        <Button variant="danger" size="sm" onClick={onDelete}>
          🗑️ Eliminar
        </Button>
      </div>
    </div>
  );
}
```

### 10.2 [`src/screens/ContatosIntencao.tsx`](src/screens/ContatosIntencao.tsx)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { ContatoIntencao } from '@/types/intencao';

export default function ContatosIntencao() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { auth, intencoes, chat } = useApp();
  const { user } = auth;
  const [contatos, setContatos] = useState<ContatoIntencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'novos' | 'respondidos'>('todos');

  useEffect(() => {
    async function fetch() {
      if (!params?.id) return;
      setLoading(true);
      const data = await intencoes.getContatosPorIntencao(params.id);
      setContatos(data);
      setLoading(false);
    }
    fetch();
  }, [params?.id]);

  const filtered = contatos.filter(c => {
    if (filtro === 'novos') return c.status === 'aberto';
    if (filtro === 'respondidos') return c.status === 'respondido' || c.status === 'aceito';
    return true;
  });

  const handleAbrirChat = (contato: ContatoIntencao) => {
    chat.abrirChat(
      contato.intencaoId,
      'intencao',
      contato.titulo,
      contato.vendedorId,
      contato.vendedorNome || 'Vendedor'
    );
  };

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-accent hover:text-accent-hover font-semibold mb-4 flex items-center gap-1"
      >
        ← Voltar
      </button>

      <h1 className="text-2xl font-extrabold text-brand-900 mb-6">Contatos Recebidos</h1>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {(['todos', 'novos', 'respondidos'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFiltro(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              filtro === t
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t === 'todos' && `Todos (${contatos.length})`}
            {t === 'novos' && `Novos (${contatos.filter(c => c.status === 'aberto').length})`}
            {t === 'respondidos' && `Respondidos (${contatos.filter(c => c.status === 'respondido' || c.status === 'aceito').length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-accent"></i>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <i className="fa-solid fa-inbox text-4xl text-slate-300 mb-3"></i>
          <p className="text-slate-500 font-semibold">Nenhum contato ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(contato => (
            <div key={contato.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                    {contato.vendedorNome?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-900">{contato.vendedorNome || 'Vendedor'}</h4>
                    <p className="text-sm text-slate-500">{contato.titulo}</p>
                  </div>
                </div>
                <Badge cor={contato.status === 'aberto' ? 'warning' : contato.status === 'aceito' ? 'success' : 'default'}>
                  {contato.status}
                </Badge>
              </div>

              {contato.descricao && (
                <p className="text-sm text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg">{contato.descricao}</p>
              )}

              {contato.carroId && contato.precoOferido && (
                <div className="text-sm text-slate-500 mb-3">
                  <strong>Carro:</strong> {contato.carroMarca} {contato.carroModelo} ({contato.carroAno}) • {formatarPreco(contato.precoOferido)}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => handleAbrirChat(contato)}>
                  💬 Abrir Chat
                </Button>
                {!contato.marcadoComoRelevante && (
                  <Button variant="secondary" size="sm" onClick={async () => {
                    await intencoes.marcarContatoRelevante(contato.id, user?.uid || '');
                    const data = await intencoes.getContatosPorIntencao(params.id!);
                    setContatos(data);
                  }}>
                    ⭐ Marcar Relevante
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={async () => {
                  await intencoes.rejeitarContato(contato.id, user?.uid || '');
                  const data = await intencoes.getContatosPorIntencao(params.id!);
                  setContatos(data);
                }}>
                  ❌ Rejeitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 11. Rotas

Adicione as rotas no router da aplicação (se for Next.js App Router, crie as páginas; se for React Router, adicione as rotas):

- `/minhas-intencoes` → `MinhasIntencoes`
- `/intencao/:id/contatos` → `ContatosIntencao`

---

## 12. Integração com Header

Em [`src/components/layout/Header.tsx`](src/components/layout/Header.tsx), adicione no nav:
```tsx
<Link href="/minhas-intencoes" className="hover:text-accent transition flex items-center gap-1 text-white">
  <i className="fa-solid fa-magnifying-glass"></i> Intenções
</Link>
```

---

## 13. Integração com Perfil

Em [`src/components/perfil/ProfileLoggedIn.tsx`](src/components/perfil/ProfileLoggedIn.tsx), adicione após a secção de anúncios:
```tsx
<div className="mt-8">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-extrabold text-brand-900">Minhas Intenções de Compra</h2>
    <Link href="/minhas-intencoes" className="text-sm text-accent hover:text-accent-hover font-semibold">
      Ver todas →
    </Link>
  </div>
  {/* Card resumido com contagem de intenções ativas */}
</div>
```

---

## 14. Integração com Chat

Em [`src/hooks/useChat.ts`](src/hooks/useChat.ts), atualize a função `abrirChat` e `enviarMensagem` para aceitar `listingType: 'intencao'`.

Em [`src/components/chat/ChatModal.tsx`](src/components/chat/ChatModal.tsx), garanta que o título da intenção seja exibido corretamente.

---

## 15. Admin

Em [`src/screens/Admin.tsx`](src/screens/Admin.tsx), adicione tab "Intenções" com:
- Lista de todas as intenções (com filtro por status)
- Ações: suspender, remover
- Fila de denúncias de intenção

---

## 16. Instruções para Teste

Após implementar, execute:

```bash
npm run dev
```

### Cenários de Teste:

1. **Criação de Intenção**:
   - Navegar para `/anunciar?modo=comprar`
   - Preencher cada step e validar navegação
   - Publicar intenção
   - Verificar toast de sucesso

2. **Dashboard**:
   - Navegar para `/minhas-intencoes`
   - Verificar intenção aparece na tab "Ativas"
   - Testar pausar/reativar/eliminar

3. **Contatos** (simular):
   - Abrir Firestore console e criar manualmente um documento em `contatos_intencao` com `intencaoId` correto
   - Verificar que aparece em `/intencao/{id}/contatos`
   - Testar "Marcar Relevante" e "Rejeitar"

4. **Matching**:
   - Verificar que `buscarIntencoesMatch` retorna intenções compatíveis com carros existentes
   - Testar com diferentes combinações de filtros

5. **Admin**:
   - Login como admin
   - Verificar tab "Intenções" no painel admin

6. **Chat**:
   - Verificar que chat abre corretamente com `listingType: 'intencao'`
   - Verificar que mensagens são enviadas e recebidas