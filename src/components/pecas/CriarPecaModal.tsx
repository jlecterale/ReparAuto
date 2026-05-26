import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { CATEGORIAS_PECAS, ESTADOS_PECA } from '@/lib/constants';
import { useApp } from '@/providers/AppProvider';
import { getAdminUsers, criarNotificacao } from '@/lib/db';

interface CriarPecaModalProps {
  show: boolean;
  onClose: () => void;
}

export default function CriarPecaModal({ show, onClose }: CriarPecaModalProps) {
  const { pecas, auth } = useApp();
  const { publicarPeca } = pecas;
  const { user } = auth;

  const [form, setForm] = useState({
    tipo: 'venda',
    titulo: '',
    categoria: 'Motor e Transmissão',
    estado: 'Usado',
    marcaCarro: '',
    preco: '',
    descricao: '',
    localizacao: 'Portugal',
    vendedorTelefone: user?.telefone || '',
    vendedorWhatsApp: '',
    vendedorEmail: user?.email || '',
  });

  const [erro, setErro] = useState('');

  const atualizar = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErro('');
  };

  const submit = async () => {
    if (!form.titulo.trim()) {
      setErro('O título é obrigatório.');
      return;
    }
    if (!form.marcaCarro.trim()) {
      setErro('A marca do carro compatível é obrigatória.');
      return;
    }

    try {
      const peca = await publicarPeca({
        ...form,
        local: form.localizacao,
        localizacao: undefined,
        preco: form.preco ? Number(form.preco) : null,
        criador: user?.email || '',
        vendedorNome: user?.nome || 'Anónimo',
        vendedorTelefone: form.vendedorTelefone || null,
        vendedorWhatsApp: form.vendedorWhatsApp || null,
        vendedorEmail: form.vendedorEmail || user?.email || null,
      });

      const admins = await getAdminUsers();
      admins.forEach((a) => {
        criarNotificacao(a.uid, 'info', 'Nova peça pendente', `Uma nova peça foi publicada: ${form.titulo}.`, `/pecas`);
      });

      setForm({
        tipo: 'venda',
        titulo: '',
        categoria: 'Motor e Transmissão',
        estado: 'Usado',
        marcaCarro: '',
        preco: '',
        descricao: '',
        localizacao: 'Portugal',
        vendedorTelefone: '',
        vendedorWhatsApp: '',
        vendedorEmail: '',
      });
      onClose();
    } catch (err) {
      setErro('Erro ao publicar. Tente novamente.');
      console.error('[CriarPeca] Erro:', err);
    }
  };

  return (
    <Modal show={show} onClose={onClose} titulo="Anunciar Peça / Desmonte / Pedido" tamanho="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">
            O QUE PRETENDE ANUNCIAR? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'venda', icon: 'fa-solid fa-gears', label: 'Venda de Peça' },
              { value: 'desmonte', icon: 'fa-solid fa-car', label: 'Desmonte' },
              { value: 'procura', icon: 'fa-solid fa-magnifying-glass', label: 'Procura-se' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl hover:border-accent cursor-pointer transition text-center select-none ${
                  form.tipo === opt.value
                    ? 'border-accent bg-orange-50/30'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="pecaTipo"
                  value={opt.value}
                  checked={form.tipo === opt.value}
                  onChange={() => atualizar('tipo', opt.value)}
                  className="hidden"
                />
                <i className={`${opt.icon} text-lg text-slate-500 mb-1`}></i>
                <span className="text-xs font-bold text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            Título do Anúncio <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Motor 1.9 TDI ASZ, Farol BMW E90, etc."
            value={form.titulo}
            onChange={(e) => atualizar('titulo', e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              value={form.categoria}
              onChange={(e) => atualizar('categoria', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
            >
              {CATEGORIAS_PECAS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Estado da Peça <span className="text-red-500">*</span>
            </label>
            <select
              value={form.estado}
              onChange={(e) => atualizar('estado', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
            >
              {ESTADOS_PECA.map((est) => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Marca do Carro Compatível <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Seat, Peugeot, BMW"
              value={form.marcaCarro}
              onChange={(e) => atualizar('marcaCarro', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Preço (€) {form.tipo !== 'procura' ? <span className="text-red-500">*</span> : '(opcional)'}
            </label>
            <input
              type="number"
              placeholder={form.tipo === 'procura' ? 'Opcional' : 'Ex: 150'}
              value={form.preco}
              onChange={(e) => atualizar('preco', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Localização</label>
          <input
            type="text"
            placeholder="Ex: Porto, Lisboa, Braga"
            value={form.localizacao}
            onChange={(e) => atualizar('localizacao', e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Descrição (opcional)</label>
          <textarea
            rows={4}
            placeholder="Descreva o estado da peça, compatibilidade, etc."
            value={form.descricao}
            onChange={(e) => atualizar('descricao', e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <span className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
            <i className="fa-solid fa-address-card text-blue-500"></i> Contacto do Vendedor
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">WhatsApp</label>
              <input
                type="tel"
                placeholder="351912345678"
                value={form.vendedorWhatsApp}
                onChange={(e) => atualizar('vendedorWhatsApp', e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Telefone</label>
              <input
                type="tel"
                placeholder="912345678"
                value={form.vendedorTelefone}
                onChange={(e) => atualizar('vendedorTelefone', e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Email de Contacto</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={form.vendedorEmail}
              onChange={(e) => atualizar('vendedorEmail', e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {erro && (
          <p className="text-xs text-red-500 font-semibold">{erro}</p>
        )}

        <button
          onClick={submit}
          className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl transition"
        >
          <i className="fa-solid fa-circle-plus mr-1"></i> Publicar Anúncio
        </button>
      </div>
    </Modal>
  );
}
