import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { getAdminUsers, criarNotificacao } from '@/lib/db';
import { getCoordenadas } from '@/lib/geo';
import StepIndicator from '@/components/anunciar/StepIndicator';
import StepCategoria from '@/components/anunciar/StepCategoria';
import StepFotos from '@/components/anunciar/StepFotos';
import StepDados from '@/components/anunciar/StepDados';
import StepPreco from '@/components/anunciar/StepPreco';
import PecaForm from '@/components/pecas/PecaForm';
import type { CarroFormData } from '@/types/carro';

type CategoriaAnuncio = 'carro' | 'peca';

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
  localizacao: '',
  localizacaoDistrito: '',
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
  vendedorWhatsApp: '',
  vendedorTelefone: '',
  vendedorEmail: '',
};

export default function Anunciar() {
  const navigate = useNavigate();
  const { carros, auth } = useApp();
  const { publicarCarro } = carros;
  const { user } = auth;
  const toast = useToast();

  const [categoria, setCategoria] = useState<CategoriaAnuncio | null>(null);
  const [passo, setPasso] = useState(0);
  const [publicado, setPublicado] = useState(false);

  const [fotos, setFotos] = useState<string[]>([]);
  const [dados, setDados] = useState<CarroFormData>(() => ({
    ...initialDados,
    vendedorTelefone: user?.telefone || '',
    vendedorEmail: user?.email || '',
  }));

  const handlePublicar = async () => {
    if (!user) {
      toast?.erro('Faça login para publicar um anúncio.');
      navigate('/perfil');
      return;
    }

    try {
      const { localizacao, localizacaoDistrito, ...dadosLimpos } = dados;
      const carro = await publicarCarro({
        ...dadosLimpos,
        local: localizacao,
        distrito: localizacaoDistrito || undefined,
        coordenadas: localizacao ? getCoordenadas(localizacao) : undefined,
        fotos,
        preco: Number(dados.preco),
        km: Number(dados.km),
        portas: Number(dados.portas),
        anoFabricacao: Number(dados.anoFabricacao),
        anoModelo: Number(dados.anoModelo),
        rodando: dados.rodando === 'sim',
        inspecao: dados.inspecao === 'sim',
        criador: user.email,
        criadorUid: user.uid,
        vendedorNome: user.nome,
        vendedorTelefone: dados.vendedorTelefone || null,
        vendedorWhatsApp: dados.vendedorWhatsApp || null,
        vendedorEmail: dados.vendedorEmail || user.email,
      });

      setPublicado(true);
      toast?.sucesso('Anúncio publicado com sucesso!');

      const admins = await getAdminUsers();
      const titulo = `${dados.marca} ${dados.modelo} (${dados.anoFabricacao})`;
      admins.forEach((a) => {
        criarNotificacao(a.uid, 'info', 'Novo anúncio pendente', `Um novo carro foi publicado: ${titulo}.`, `/detalhes/${(carro as any).id}`);
      });
    } catch (err) {
      toast?.erro('Erro ao publicar anúncio. Tente novamente.');
      console.error('[Anunciar] Erro:', err);
    }
  };

  const handleAnunciarOutro = () => {
    setPublicado(false);
    setCategoria(null);
    setPasso(0);
    setFotos([]);
    setDados((prev) => ({ ...prev, preco: '', descricao: '', tiposManutencao: [] }));
  };

  if (publicado) {
    const isPeca = categoria === 'peca';
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-5 sm:p-8 page-enter">
        <div className="text-center py-6">
          <i className="fa-solid fa-circle-check text-green-500 text-5xl mb-3"></i>
          <h3 className="text-xl font-extrabold text-brand-900">Anúncio enviado!</h3>
          <p className="text-gray-500 text-sm mb-2">
            O seu anúncio foi submetido com sucesso e está <strong>pendente de aprovação</strong> pela nossa equipa de administração.
          </p>
          <p className="text-gray-500 text-sm">
            {isPeca
              ? 'Assim que for aprovado, ficará visível na secção de Peças & Desmonte.'
              : 'Assim que for aprovado, ficará visível para todos. Pode acompanhar o estado em Perfil → Os Seus Carros Anunciados.'}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => navigate(isPeca ? '/pecas' : '/perfil')}
              className="bg-brand-900 text-white font-bold px-6 py-2 rounded-full"
            >
              Ver meus anúncios
            </button>
            <button
              onClick={handleAnunciarOutro}
              className="bg-accent text-white font-bold px-6 py-2 rounded-full"
            >
              Anunciar outro
            </button>
          </div>
        </div>
      </div>
    );
  }

  const titulo = passo === 0
    ? 'Anunciar'
    : categoria === 'carro'
      ? 'Anunciar Carro ou Moto'
      : 'Anunciar Peça / Desmonte';

  const subtitulo = passo === 0
    ? 'Escolha o tipo de anúncio'
    : categoria === 'carro'
      ? '3 passos simples • Grátis'
      : 'Preencha os dados abaixo';

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-5 sm:p-8 page-enter">
      <h2 className="text-2xl font-extrabold text-brand-900 mb-1">{titulo}</h2>
      <p className="text-gray-500 text-sm mb-5">{subtitulo}</p>

      {passo === 0 && (
        <StepCategoria onSelect={(cat) => { setCategoria(cat); setPasso(1); }} />
      )}

      {categoria === 'carro' && passo >= 1 && (
        <>
          <StepIndicator passoAtual={passo} />

          {passo === 1 && (
            <StepFotos
              fotos={fotos}
              setFotos={setFotos}
              onNext={() => setPasso(2)}
              onBack={() => { setCategoria(null); setPasso(0); }}
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
        </>
      )}

      {categoria === 'peca' && passo === 1 && (
        <PecaForm
          onCancel={() => { setCategoria(null); setPasso(0); }}
          onSuccess={() => setPublicado(true)}
        />
      )}
    </div>
  );
}
