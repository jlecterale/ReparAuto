import { useState } from 'react';
import useVinCheck from '@/hooks/useVinCheck';

export default function VinCheckPanel() {
  const [vin, setVin] = useState('');
  const { resultado, loading, verificar, limpar } = useVinCheck();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vin.trim()) verificar(vin);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <h3 className="font-extrabold text-brand-900 mb-3 flex items-center gap-2">
        <i className="fa-solid fa-barcode text-accent"></i> Verificar VIN
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Introduza o número de chassis (VIN) para verificar informações básicas do veículo.
        Esta verificação é apenas indicativa e não substitui uma consulta oficial.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          type="text"
          value={vin}
          onChange={(e) => {
            setVin(e.target.value.toUpperCase());
            if (resultado) limpar();
          }}
          placeholder="Ex: WVWZZZ3CZWE123456"
          maxLength={17}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading || !vin.trim()}
          className="bg-accent hover:bg-accent-hover text-white font-bold text-xs px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-search"></i>}
        </button>
      </form>

      {resultado && (
        <div className={`rounded-xl p-4 border ${resultado.valido ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {resultado.valido ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <i className="fa-solid fa-circle-check text-green-500"></i>
                <span className="font-bold text-green-800 text-sm">VIN válido</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded-lg p-2 border border-green-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">VIN</p>
                  <p className="font-mono font-semibold text-brand-900">{resultado.vin}</p>
                </div>
                {resultado.marca && (
                  <div className="bg-white rounded-lg p-2 border border-green-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Marca</p>
                    <p className="font-semibold text-brand-900">{resultado.marca}</p>
                  </div>
                )}
                {resultado.ano && (
                  <div className="bg-white rounded-lg p-2 border border-green-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Ano</p>
                    <p className="font-semibold text-brand-900">{resultado.ano}</p>
                  </div>
                )}
                {resultado.pais && (
                  <div className="bg-white rounded-lg p-2 border border-green-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">País de Origem</p>
                    <p className="font-semibold text-brand-900">{resultado.pais}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-circle-xmark text-red-500"></i>
              <span className="text-sm text-red-800 font-semibold">{resultado.erro}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
