import { useDistritosConcelhos } from '@/hooks/useDistritosConcelhos';

interface SeletorLocalizacaoProps {
  distrito: string;
  concelho: string;
  onChange: (distrito: string, concelho: string) => void;
  obrigatorio?: boolean;
  erro?: boolean;
  className?: string;
}

export default function SeletorLocalizacao({
  distrito,
  concelho,
  onChange,
  obrigatorio,
  erro,
  className = '',
}: SeletorLocalizacaoProps) {
  const { distritos, getConcelhos } = useDistritosConcelhos();
  const concelhos = getConcelhos(distrito);

  const baseSelect =
    'w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent';

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          Distrito {obrigatorio && <span className="text-red-500">*</span>}
        </label>
        <select
          value={distrito}
          onChange={(e) => onChange(e.target.value, '')}
          className={`${baseSelect} ${erro && !distrito ? 'border-red-400' : 'border-gray-300'}`}
        >
          <option value="">Selecionar distrito</option>
          {distritos.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          Concelho {obrigatorio && <span className="text-red-500">*</span>}
        </label>
        <select
          value={concelho}
          onChange={(e) => onChange(distrito, e.target.value)}
          disabled={!distrito}
          className={`${baseSelect} ${
            erro && !concelho ? 'border-red-400' : 'border-gray-300'
          } ${!distrito ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
        >
          <option value="">
            {distrito ? 'Selecionar concelho' : 'Selecione um distrito'}
          </option>
          {concelhos.map((c) => (
            <option key={c.nome} value={c.nome}>{c.nome}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
