import type { AlertProps } from '@/types/ui';

export default function Alert({
  children,
  tipo = 'info',
  titulo,
  icone,
  align = 'left',
  className = '',
}: AlertProps) {
  const estilos: Record<string, { box: string; titulo: string; texto: string; icone: string }> = {
    info: { box: 'bg-blue-50 border-blue-200', titulo: 'text-blue-900', texto: 'text-blue-700', icone: 'text-blue-500' },
    sucesso: { box: 'bg-green-50 border-green-200', titulo: 'text-green-900', texto: 'text-green-700', icone: 'text-green-500' },
    aviso: { box: 'bg-yellow-50 border-yellow-200', titulo: 'text-yellow-900', texto: 'text-yellow-700', icone: 'text-yellow-500' },
    erro: { box: 'bg-red-50 border-red-200', titulo: 'text-red-900', texto: 'text-red-700', icone: 'text-red-500' },
    neutro: { box: 'bg-slate-50 border-slate-200', titulo: 'text-fg-strong', texto: 'text-fg-muted', icone: 'text-fg-subtle' },
  };

  const estilo = estilos[tipo] || estilos.info;
  const centered = align === 'center';

  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`border rounded-xl p-4 ${estilo.box} flex gap-3 ${
        centered ? 'flex-col items-center text-center' : 'items-start'
      } ${className}`}
    >
      {icone && <span className={`${estilo.icone} text-lg shrink-0 leading-none`}>{icone}</span>}
      <div className={centered ? '' : 'min-w-0 flex-1'}>
        {titulo && <p className={`font-semibold text-sm ${estilo.titulo}`}>{titulo}</p>}
        {children && <div className={`text-xs ${estilo.texto} ${titulo ? 'mt-0.5' : ''}`}>{children}</div>}
      </div>
    </div>
  );
}
