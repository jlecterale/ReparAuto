import type { ReactNode, ButtonHTMLAttributes } from 'react';

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

/**
 * Button visual variants. The four primary roles of the design system are
 * `primario`, `secundario`, `terciario` and `perigo` (error/danger). The rest
 * are semantic fills: `verde` (success), `azul` (info/chat), `aviso` (warning),
 * `escuro` (dark navy CTA) and `ghost` (for dark/photo backgrounds).
 */
export type ButtonTipo =
  | 'primario'
  | 'secundario'
  | 'terciario'
  | 'perigo'
  | 'verde'
  | 'azul'
  | 'aviso'
  | 'escuro'
  | 'ghost';
export type ButtonTamanho = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ReactNode;
  tipo?: ButtonTipo;
  tamanho?: ButtonTamanho;
  /** Leading icon — render a Phosphor icon element, e.g. `icone={<Plus />}`. */
  icone?: ReactNode;
  /** Trailing icon, rendered after the label. */
  iconeFim?: ReactNode;
  /** Stretch to fill the container width. */
  blocoCompleto?: boolean;
  /** Show a spinner and block interaction without changing layout. */
  carregando?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: ReactNode;
  /** Optional leading icon — render a Phosphor icon element, e.g. `icone={<Car />}`. */
  icone?: ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible label for the radiogroup. */
  ariaLabel?: string;
  tamanho?: 'sm' | 'md';
  blocoCompleto?: boolean;
  className?: string;
}

export type BadgeCor = 'accent' | 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'brand';
export type BadgeVariante = 'soft' | 'solid';
export type BadgeTamanho = 'sm' | 'md';

export interface BadgeProps {
  children: ReactNode;
  cor?: BadgeCor;
  /** `soft` = pastel fill (default), `solid` = strong fill on white text. */
  variante?: BadgeVariante;
  tamanho?: BadgeTamanho;
  className?: string;
}

export type AlertTipo = 'info' | 'sucesso' | 'aviso' | 'erro' | 'neutro';

export interface AlertProps {
  children: ReactNode;
  tipo?: AlertTipo;
  /** Optional bold heading rendered above the body. */
  titulo?: ReactNode;
  /** Leading icon — pass a Phosphor element, e.g. `icone={<Info />}`. */
  icone?: ReactNode;
  /** `left` (default) lays icon beside content; `center` stacks centered. */
  align?: 'left' | 'center';
  className?: string;
}
