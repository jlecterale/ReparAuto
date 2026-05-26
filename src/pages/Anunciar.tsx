import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import StepIndicator from '@/components/anunciar/StepIndicator';
import StepFotos from '@/components/anunciar/StepFotos';
import StepDados from '@/components/anunciar/StepDados';
import StepPreco from '@/components/anunciar/StepPreco';
import type { CarroFormData } from '@/types/carro';

const initialDados: CarroFormData = {
  marca: '',
  modelo: '',
  anoFabricacao: '',
  anoModelo: '',
  km: '',
  cor: '',
  combustivel: 'Gasolina',
  cambio: 'Manual',
  portas: '',
  localizacao: 'Porto',
  preco: '',
  descricao: '',
  estadoVeiculo: 'pronto',
  rodando: 'sim',
  inspecao: 'sim',
  tiposManutencao: [],
  orcamentoTexto: '',
  incluirMecanicoNome: false,
  incluirMecanicoTelefone: false,
  mecanicoNome: '',
  mecanicoTelefone: '',
};

export default function Anunciar() {
  const navigate = useNavigate();
  const { carros, auth } = useApp();
  const { publicarCarro } = carros;
  const { user } = auth;
  const toast = useToast();

  const [passo, setPasso] = useState(1);
  const [publicado, setPublicado] = useState(false);

  const [fotos, setFotos] = useState<string[]>([]);
  const [dados, setDados] = useState<CarroFormData>({ ...initialDados });

  const handlePublicar = async () => {
    if (!user) {
      toast?.erro('Faça login para publicar um anúncio.');
      navigate('/perfil');
      return;
    }

    try {
      await publicarCarro({
        ...dados,
        local: dados.localizacao,
        localizacao: undefined,
        fotos,
        preco: Number(dados.preco),
        km: Number(dados.km),
        portas: Number(dados.portas),
        anoFabricacao: Number(dados.anoFabricacao),
        anoModelo: Number(dados.anoModelo),
        rodando: dados.rodando === 'sim',
        inspecao: dados.inspecao === 'sim',
        criador: user.email,
        vendedorNome: user.nome,
      });

      setPublicado(true);
      toast?.sucesso('Anúncio publicado com sucesso!');
    } catch (err) {
      toast?.erro('Erro ao publicar anúncio. Tente novamente.');
      console.error('[Anunciar] Erro:', err);
    }
  };

  if (publicado) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-5 sm:p-8 page-enter">
        <div className="text-center py-6">
          <i className="fa-solid fa-circle-check text-green-500 text-5xl mb-3"></i>
          <h3 className="text-xl font-extrabold text-brand-900">Anúncio publicado!</h3>
          <p className="text-gray-500 text-sm">O seu anúncio já está disponível para visualização e busca local.</p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => { setPublicado(false); setPasso(1); setFotos([]); setDados({ ...dados, preco: '', descricao: '', tiposManutencao: [] }); }}
              className="bg-brand-900 text-white font-bold px-6 py-2 rounded-full"
            >
              Anunciar outro
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-accent text-white font-bold px-6 py-2 rounded-full"
            >
              Ver anúncios
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-5 sm:p-8 page-enter">
      <h2 className="text-2xl font-extrabold text-brand-900 mb-1">Anunciar Carro</h2>
      <p className="text-gray-500 text-sm mb-5">3 passos simples • Grátis</p>

      <StepIndicator passoAtual={passo} />

      {passo === 1 && (
        <StepFotos
          fotos={fotos}
          setFotos={setFotos}
          onNext={() => setPasso(2)}
        />
      )}
      {passo === 2 && (
        <StepDados
          dados={dados}
          setDados={setDados}
          onNext={() => setPasso(3)}
          onBack={() => setPasso(1)}
        />
      )}
      {passo === 3 && (
        <StepPreco
          dados={dados}
          setDados={setDados}
          onBack={() => setPasso(2)}
          onPublicar={handlePublicar}
        />
      )}
    </div>
  );
}
