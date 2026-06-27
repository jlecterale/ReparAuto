import type { Timestamp } from 'firebase/firestore';

export interface Banner {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeCor: 'accent' | 'green' | 'yellow' | 'blue' | 'brand' | 'gray';
  price?: string;
  ctaText: string;
  link: string;
  gradient: string;
  ativo: boolean;
  dataCriacao?: Timestamp;
  ordem: number;
}

export type BannerInput = Omit<Banner, 'id'>;
