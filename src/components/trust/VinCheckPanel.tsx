'use client';

import { Barcode, CheckCircle, CircleNotch, MagnifyingGlass, XCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import Alert from '@/components/ui/Alert';
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
      <h3 className="font-extrabold text-fg-heading mb-3 flex items-center gap-2">
        <Barcode className="text-accent" /> Verificar VIN
      </h3>
      <p className="text-xs text-fg-subtle mb-3">
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
          {loading ? <CircleNotch className="animate-spin" /> : <MagnifyingGlass />}
        </button>
      </form>

      {resultado && (
        resultado.valido ? (
          <Alert tipo="sucesso" icone={<CheckCircle />} titulo="VIN válido">
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-white rounded-lg p-2 border border-green-100">
                <p className="text-[10px] text-fg-subtle uppercase font-bold">VIN</p>
                <p className="font-mono font-semibold text-fg-heading">{resultado.vin}</p>
              </div>
              {resultado.marca && (
                <div className="bg-white rounded-lg p-2 border border-green-100">
                  <p className="text-[10px] text-fg-subtle uppercase font-bold">Marca</p>
                  <p className="font-semibold text-fg-heading">{resultado.marca}</p>
                </div>
              )}
              {resultado.ano && (
                <div className="bg-white rounded-lg p-2 border border-green-100">
                  <p className="text-[10px] text-fg-subtle uppercase font-bold">Ano</p>
                  <p className="font-semibold text-fg-heading">{resultado.ano}</p>
                </div>
              )}
              {resultado.pais && (
                <div className="bg-white rounded-lg p-2 border border-green-100">
                  <p className="text-[10px] text-fg-subtle uppercase font-bold">País de Origem</p>
                  <p className="font-semibold text-fg-heading">{resultado.pais}</p>
                </div>
              )}
            </div>
          </Alert>
        ) : (
          <Alert tipo="erro" icone={<XCircle />} className="!items-center font-semibold">
            {resultado.erro}
          </Alert>
        )
      )}
    </div>
  );
}
