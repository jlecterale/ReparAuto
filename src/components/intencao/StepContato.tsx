'use client';

import { ChatCircleDots, WhatsappLogo, Chats, type Icon } from '@phosphor-icons/react';

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
        <label className="block text-xs font-bold text-fg-subtle mb-2">Forma de contacto preferida *</label>
        <div className="space-y-2">
          {([
            { value: 'chat', label: 'Chat do app', Icon: ChatCircleDots },
            { value: 'whatsapp', label: 'WhatsApp', Icon: WhatsappLogo },
            { value: 'ambos', label: 'Ambos', Icon: Chats },
          ] as { value: string; label: string; Icon: Icon }[]).map((opt) => (
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
              <opt.Icon size={22} className="text-accent shrink-0" />
              <span className="text-sm font-semibold text-fg">{opt.label}</span>
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
        <label className="block text-xs font-bold text-fg-subtle mb-1">
          Descrição adicional <span className="font-normal text-fg-subtle">(opcional, máx. 500 caracteres)</span>
        </label>
        <textarea
          value={descricao}
          onChange={(e) => onChange('descricao', e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Ex: Compro para uso pessoal, urgente, etc."
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
        />
        <p className="text-xs text-fg-subtle mt-1 text-right">{descricao.length}/500</p>
      </div>
    </div>
  );
}
