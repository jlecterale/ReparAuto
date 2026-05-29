'use client';

interface StepContatoProps {
  contatoPreferido: 'chat' | 'whatsapp' | 'ambos';
  mostrarTelefone: boolean;
  descricao: string;
  onChange: (field: string, value: any) => void;
}

export default function StepContato({ contatoPreferido, mostrarTelefone, descricao, onChange }: StepContatoProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-2">Forma de contacto preferida *</label>
        <div className="space-y-2">
          {[
            { value: 'chat', label: 'Chat do app', icon: 'fa-solid fa-comment-dots' },
            { value: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp' },
            { value: 'ambos', label: 'Ambos', icon: 'fa-solid fa-comments' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                contatoPreferido === opt.value ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="contatoPreferido"
                value={opt.value}
                checked={contatoPreferido === opt.value}
                onChange={(e) => onChange('contatoPreferido', e.target.value)}
                className="text-accent focus:ring-accent"
              />
              <i className={`${opt.icon} text-lg text-accent w-6`}></i>
              <span className="text-sm font-semibold text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={mostrarTelefone}
          onChange={(e) => onChange('mostrarTelefone', e.target.checked)}
          className="rounded text-accent focus:ring-accent"
        />
        Mostrar meu telefone para vendedores
      </label>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">
          Descrição adicional <span className="font-normal text-slate-400">(opcional, máx. 500 caracteres)</span>
        </label>
        <textarea
          value={descricao}
          onChange={(e) => onChange('descricao', e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Ex: Compro para uso pessoal, urgente, etc."
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">{descricao.length}/500</p>
      </div>
    </div>
  );
}
