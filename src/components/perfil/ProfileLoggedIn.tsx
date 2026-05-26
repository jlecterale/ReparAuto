import { useApp } from '@/providers/AppProvider';
import { formatarPreco } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function ProfileLoggedIn() {
  const { auth, carros, pecas } = useApp();
  const { user, logout } = auth;
  const navigate = useNavigate();

  const meusCarros = carros.carros.filter((c) => c.criador === user?.email);
  const minhasPecas = pecas.pecas.filter((p) => p.criador === user?.email);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white text-xl font-bold">
            {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-brand-900">{user?.nome || 'Utilizador'}</h3>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 px-3 py-1.5 rounded-full"
        >
          <i className="fa-solid fa-right-from-bracket mr-1"></i> Sair
        </button>
      </div>

      <h4 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2">
        <i className="fa-solid fa-list-check text-accent"></i> Os Seus Carros Anunciados
      </h4>

      {meusCarros.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl mb-6">
          <p>Nenhum carro anunciado ainda.</p>
          <button
            onClick={() => navigate('/anunciar')}
            className="mt-2 text-accent hover:text-accent-hover font-semibold text-xs"
          >
            <i className="fa-solid fa-circle-plus mr-1"></i> Anunciar carro
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {meusCarros.map((carro) => (
            <div
              key={carro.id}
              className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200 cursor-pointer hover:bg-slate-100 transition"
              onClick={() => navigate(`/detalhes/${carro.id}`)}
            >
              <div>
                <p className="font-bold text-brand-900 text-sm">
                  {carro.marca} {carro.modelo} ({carro.anoFabricacao})
                </p>
                <p className="text-xs text-slate-500">{carro.km?.toLocaleString('pt-PT')} km</p>
              </div>
              <span className="font-extrabold text-accent text-sm">{formatarPreco(carro.preco)}</span>
            </div>
          ))}
        </div>
      )}

      <h4 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2">
        <i className="fa-solid fa-gears text-accent"></i> As Suas Peças & Pedidos
      </h4>

      {minhasPecas.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl">
          <p>Nenhuma peça ou pedido anunciado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {minhasPecas.map((peca) => (
            <div
              key={peca.id}
              className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200"
            >
              <div>
                <p className="font-bold text-brand-900 text-sm">{peca.titulo}</p>
                <p className="text-xs text-slate-500">{peca.categoria} • {peca.tipo}</p>
              </div>
              {peca.preco && (
                <span className="font-extrabold text-accent text-sm">{formatarPreco(peca.preco)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
