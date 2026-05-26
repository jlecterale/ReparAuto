interface AdminStatsProps {
  totalUsers: number;
  totalCarros: number;
  totalPecas: number;
  carrosPendentes: number;
  pecasPendentes: number;
  onNavigate: (tab: 'utilizadores' | 'anuncios', subTab?: 'carros' | 'pecas', filter?: 'pendente' | 'aprovado' | 'rejeitado') => void;
}

export default function AdminStats({ totalUsers, totalCarros, totalPecas, carrosPendentes, pecasPendentes, onNavigate }: AdminStatsProps) {
  const stats: { label: string; value: number; icon: string; cor: string; tab: 'utilizadores' | 'anuncios'; subTab?: 'carros' | 'pecas'; filter?: 'pendente' | 'aprovado' | 'rejeitado' }[] = [
    { label: 'Utilizadores', value: totalUsers, icon: 'fa-solid fa-users', cor: 'bg-blue-500', tab: 'utilizadores' },
    { label: 'Carros', value: totalCarros, icon: 'fa-solid fa-car', cor: 'bg-accent', tab: 'anuncios', subTab: 'carros' },
    { label: 'Peças', value: totalPecas, icon: 'fa-solid fa-gears', cor: 'bg-green-500', tab: 'anuncios', subTab: 'pecas' },
    { label: 'Total Anúncios', value: totalCarros + totalPecas, icon: 'fa-solid fa-list', cor: 'bg-purple-500', tab: 'anuncios' },
    { label: 'Pendentes', value: carrosPendentes + pecasPendentes, icon: 'fa-solid fa-clock', cor: 'bg-yellow-500', tab: 'anuncios', filter: 'pendente' },
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
            <i className={s.icon}></i>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand-900">{s.value}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{s.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
