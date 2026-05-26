import { useParams, useNavigate } from 'react-router-dom';
import { TEXTOS_POLITICAS } from '@/lib/constants';

const titulos: Record<string, string> = {
  termos: 'Termos de Utilização',
  privacidade: 'Política de Privacidade',
  cookies: 'Política de Cookies',
  seguranca: 'Segurança',
};

export default function PoliticaPage() {
  const { tipo } = useParams<{ tipo: string }>();
  const navigate = useNavigate();

  const titulo = titulos[tipo || ''] || 'Política';
  const conteudo = TEXTOS_POLITICAS[tipo as keyof typeof TEXTOS_POLITICAS]?.corpo || 'Conteúdo não encontrado.';

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-5 sm:p-8 page-enter">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-brand-700 hover:text-accent font-semibold text-sm flex items-center gap-1"
      >
        <i className="fa-solid fa-arrow-left"></i> Voltar
      </button>
      <h1 className="text-2xl font-extrabold text-brand-900 mb-4">{titulo}</h1>
      <div
        className="text-sm text-slate-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: conteudo }}
      />
    </div>
  );
}
