import { Users, Car, GearSix, List, Clock, type Icon } from '@phosphor-icons/react';

interface AdminStatsProps {
  totalUsers: number;
  totalCarros: number;
  totalPecas: number;
  carrosPendentes: number;
  pecasPendentes: number;
  onNavigate: (tab: 'utilizadores' | 'anuncios', subTab?: 'carros' | 'pecas', filter?: 'pendente' | 'aprovado' | 'rejeitado') => void;
}

export default function AdminStats({ totalUsers, totalCarros, totalPecas, carrosPendentes, pecasPendentes, onNavigate }: AdminStatsProps) {
  const stats: { label: string; value: number; Icon: Icon; cor: string; tab: 'utilizadores' | 'anuncios'; subTab?: 'carros' | 'pecas'; filter?: 'pendente' | 'aprovado' | 'rejeitado' }[] = [
    { label: 'Utilizadores', value: totalUsers, Icon: Users, cor: 'bg-blue-600', tab: 'utilizadores' },
    { label: 'Carros', value: totalCarros, Icon: Car, cor: 'bg-accent', tab: 'anuncios', subTab: 'carros' },
    { label: 'Peças', value: totalPecas, Icon: GearSix, cor: 'bg-green-600', tab: 'anuncios', subTab: 'pecas' },
    { label: 'Total Anúncios', value: totalCarros + totalPecas, Icon: List, cor: 'bg-purple-600', tab: 'anuncios' },
    { label: 'Pendentes', value: carrosPendentes + pecasPendentes, Icon: Clock, cor: 'bg-yellow-600', tab: 'anuncios', filter: 'pendente' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <button
          key={s.label}
          onClick={() => onNavigate(s.tab, s.subTab, s.filter)}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 text-left cursor-pointer hover:shadow-md hover:border-accent/30 transition-all"
        >
          <div className={`${s.cor} w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0`}>
            <s.Icon weight="fill" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-fg-heading">{s.value}</p>
            <p className="text-xs text-fg-subtle font-semibold uppercase tracking-wider">{s.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
