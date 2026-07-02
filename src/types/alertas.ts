import type { Timestamp } from 'firebase/firestore';
import type { SearchFilters } from './busca';

export type TipoAlerta = 'filtro_salvo' | 'palavra_chave' | 'criterio';

/** Listing surfaces an alert can watch. */
export type CategoriaAlerta = 'carros' | 'pecas' | 'oficinas';

export interface AlertCriteria {
  categoria: CategoriaAlerta;
  /** Part listing kind (venda | desmonte | procura) — parts only. */
  tipoAnuncio?: string;
  concelho?: string;
  distrito?: string;
  marca?: string;
}

interface AlertSubscriptionBase {
  id: string;
  uid: string;
  /** User-facing name shown in "Meus Alertas". */
  nome: string;
  ativo: boolean;
  /** Matches found since the user last opened the alert — bumped server-side. */
  novosResultados: number;
  dataCriacao: Timestamp;
  ultimaNotificacao?: Timestamp;
}

export interface KeywordAlertSubscription extends AlertSubscriptionBase {
  tipo: 'palavra_chave';
  keyword: string;
  categoria?: CategoriaAlerta;
}

export interface CriteriaAlertSubscription extends AlertSubscriptionBase {
  tipo: 'criterio';
  criteria: AlertCriteria;
}

export interface SavedFilterAlertSubscription extends AlertSubscriptionBase {
  tipo: 'filtro_salvo';
  filters: SearchFilters;
}

export type AlertSubscription =
  | KeywordAlertSubscription
  | CriteriaAlertSubscription
  | SavedFilterAlertSubscription;

// Omit must distribute over the union, otherwise the per-tipo fields
// (keyword/criteria/filters) collapse away.
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type AlertSubscriptionInput = DistributiveOmit<
  AlertSubscription,
  'id' | 'uid' | 'novosResultados' | 'dataCriacao' | 'ultimaNotificacao'
>;

/** Notification groups a user can tune, one toggle per delivery channel. */
export interface ChannelPreferences {
  inApp: boolean;
  push: boolean;
}

export interface NotificationPreferences {
  /** Chat messages (tipo 'mensagem'). */
  mensagem: ChannelPreferences;
  /** Own-listing lifecycle + misc info (tipos 'aprovado' | 'rejeitado' | 'info'). */
  conta: ChannelPreferences;
  /** Alert subscription matches (tipo 'alerta'). */
  alerta: ChannelPreferences;
  /** Price drop on a favourited listing (tipo 'preco'). */
  preco: ChannelPreferences;
}

export type GrupoPreferencia = keyof NotificationPreferences;
