import type { ReactNode, MouseEvent } from 'react';

export type ToastTipo = 'sucesso' | 'erro' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  tipo: ToastTipo;
}

export interface ToastContextValue {
  addToast: (message: string, tipo?: ToastTipo, duracao?: number) => void;
  sucesso: (msg: string) => void;
  erro: (msg: string) => void;
  info: (msg: string) => void;
}

export type ModalTamanho = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  show: boolean;
  onClose: () => void;
  titulo: string;
  children: ReactNode;
  tamanho?: ModalTamanho;
}

export type ButtonTipo = 'primario' | 'secundario' | 'ghost' | 'perigo' | 'verde';
export type ButtonTamanho = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  tipo?: ButtonTipo;
  tamanho?: ButtonTamanho;
  disabled?: boolean;
  icone?: string | null;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export type BadgeCor = 'accent' | 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'brand';

export interface BadgeProps {
  children: ReactNode;
  cor?: BadgeCor;
  className?: string;
}
