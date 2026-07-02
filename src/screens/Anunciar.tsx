'use client';

import { CheckCircle } from '@phosphor-icons/react';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { getAdminUsers, criarNotificacao } from '@/lib/db';
import { uploadFileToStorage } from '@/lib/upload';
import { parsePositiveInt } from '@/lib/utils';
import { getCoordenadas } from '@/lib/geo';
import { saveAdDraft, loadAdDraft, clearAdDraft, hasCarDraftContent, type AdDraft, type CarAdDraftData } from '@/lib/adDraft';
import pendingUploadFiles, { isRestorableFoto } from '@/lib/pendingUploadFiles';
import StepIndicator from '@/components/anunciar/StepIndicator';
import StepCategoria from '@/components/anunciar/StepCategoria';
import StepFotos from '@/components/anunciar/StepFotos';
import StepDados from '@/components/anunciar/StepDados';
import StepPreco from '@/components/anunciar/StepPreco';
import PecaForm, { type PecaFormDraft } from '@/components/pecas/PecaForm';
import DraftResumePrompt from '@/components/ui/DraftResumePrompt';
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
  bodyType: '',
  seats: '',
  condition: 'Usado',
  power: '',
  displacement: '',
  traction: '',
  features: [],
  localizacao: '',
  localizacaoDistrito: '',
  preco: '',
  descricao: '',
  videoUrl: '',
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { carros, auth } = useApp();
  const { publicarCarro } = carros;
  const { user } = auth;
  const toast = useToast();

  // Onboarding deep-links here with ?tipo=carro|peca to skip the category step.
  const tipoParam = searchParams.get('tipo');
  const categoriaInicial: CategoriaAnuncio | null =
    tipoParam === 'carro' || tipoParam === 'peca' ? tipoParam : null;
  // The profile's "Continuar rascunho" button deep-links with ?retomar=1 to
  // resume the saved draft directly, without re-asking.
  const retomarParam = searchParams.get('retomar') === '1';

  const [categoria, setCategoria] = useState<CategoriaAnuncio | null>(categoriaInicial);
  const [passo, setPasso] = useState(categoriaInicial ? 1 : 0);
  const [publicado, setPublicado] = useState(false);

  const [fotos, setFotos] = useState<string[]>([]);
  // Module-scope registry so picked files survive route changes in-session
  // and a resumed draft can still upload them.
  const pendingFilesRef = useRef(pendingUploadFiles);
  const [uploading, setUploading] = useState(false);
  const [dados, setDados] = useState<CarroFormData>(() => ({
    ...initialDados,
    vendedorTelefone: user?.telefone || '',
    vendedorEmail: user?.email || '',
  }));

  // Draft recovery: prompt shown when a saved draft exists for the chosen kind.
  const [draftPrompt, setDraftPrompt] = useState<{ kind: CategoriaAnuncio; draft: AdDraft } | null>(null);
  // Part draft handed to PecaForm once the user chooses to resume it.
  const [pecaDraft, setPecaDraft] = useState<PecaFormDraft | null>(null);
  // Kinds already offered/resumed this visit, so the prompt never re-appears.
  const draftsHandledRef = useRef<Set<CategoriaAnuncio>>(new Set());

  const applyDraft = (kind: CategoriaAnuncio, draft: AdDraft) => {
    if (kind === 'carro') {
      const data = draft.data as Partial<CarAdDraftData>;
      setDados({ ...initialDados, ...data.dados });
      // Blob photo URLs only survive within the same page session; drop the
      // ones whose backing file is gone (e.g. after a reload).
      const savedFotos = data.fotos ?? [];
      const restoredFotos = savedFotos.filter(isRestorableFoto);
      setFotos(restoredFotos);
      if (restoredFotos.length < savedFotos.length) {
        setPasso(1);
        toast?.info('Rascunho recuperado. Algumas fotos expiraram — adicione-as novamente.');
      } else {
        setPasso(Math.min(Math.max(draft.step ?? 1, 1), restoredFotos.length ? 3 : 1));
      }
    } else {
      setPecaDraft(draft.data as PecaFormDraft);
    }
  };

  // Offer to resume a saved draft when a creation flow starts. Re-runs when
  // auth resolves, because an owned draft is invisible until the uid is known.
  useEffect(() => {
    if (!categoria || publicado || draftsHandledRef.current.has(categoria)) return;
    const draft = loadAdDraft(categoria, user?.uid ?? null);
    if (!draft) return;
    // Never clobber progress the user already made in this visit.
    if (categoria === 'carro' && (hasCarDraftContent(dados) || fotos.length)) return;
    draftsHandledRef.current.add(categoria);
    if (retomarParam) {
      applyDraft(categoria, draft);
    } else {
      setDraftPrompt({ kind: categoria, draft });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, user?.uid, publicado]);

  // Autosave the car wizard (debounced) whenever it holds real progress.
  useEffect(() => {
    if (categoria !== 'carro' || passo < 1 || publicado || draftPrompt) return;
    if (!hasCarDraftContent(dados) && !fotos.length) return;
    const timer = setTimeout(() => {
      saveAdDraft<CarAdDraftData>('carro', { dados, fotos }, { uid: user?.uid ?? null, step: passo });
    }, 500);
    return () => clearTimeout(timer);
  }, [dados, fotos, passo, categoria, publicado, draftPrompt, user?.uid]);

  const handlePublicar = async () => {
    if (!user) {
      toast?.erro('Faça login para publicar um anúncio.');
      router.push('/perfil');
      return;
    }

    setUploading(true);

    try {
      // Upload pending photos to Firebase Storage
      const fotosFinais: string[] = (
        await Promise.all(
          fotos.map(async (foto, index) => {
            if (foto.startsWith('blob:')) {
              const file = pendingFilesRef.current.get(foto);
              if (file) {
                const folder = `ads/${user.uid}`;
                const ext = file.name.split('.').pop() || 'jpg';
                const fileName = `${Date.now()}_${index}.${ext}`;
                const downloadUrl = await uploadFileToStorage(file, folder, fileName);
                URL.revokeObjectURL(foto);
                pendingFilesRef.current.delete(foto);
                return downloadUrl;
              }
              // blob sem ficheiro no Map → skip (não incluir no array)
              return null;
            }
            return foto; // keep emoji or existing URL as-is
          }),
        )
      ).filter((f): f is string => f !== null);

      const { localizacao, localizacaoDistrito, ...dadosLimpos } = dados;
      const carro = await publicarCarro({
        ...dadosLimpos,
        local: localizacao,
        distrito: localizacaoDistrito || undefined,
        coordenadas: localizacao ? getCoordenadas(localizacao) : undefined,
        videoUrl: dados.videoUrl?.trim() || undefined,
        fotos: fotosFinais,
        preco: Number(dados.preco),
        km: Number(dados.km),
        portas: Number(dados.portas),
        anoFabricacao: Number(dados.anoFabricacao),
        anoModelo: Number(dados.anoModelo),
        bodyType: dados.bodyType || undefined,
        seats: parsePositiveInt(dados.seats) ?? undefined,
        condition: dados.condition || undefined,
        power: parsePositiveInt(dados.power) ?? undefined,
        displacement: parsePositiveInt(dados.displacement) ?? undefined,
        traction: dados.traction || undefined,
        features: dados.features.length ? dados.features : undefined,
        rodando: dados.rodando === 'sim',
        inspecao: dados.inspecao === 'sim',
        criador: user.email,
        criadorUid: user.uid,
        vendedorNome: user.nome,
        vendedorTelefone: dados.vendedorTelefone || null,
        vendedorWhatsApp: dados.vendedorWhatsApp || null,
        vendedorEmail: dados.vendedorEmail || user.email,
      });

      clearAdDraft('carro');
      setPublicado(true);
      toast?.sucesso('Anúncio publicado com sucesso!');

      getAdminUsers()
        .then((admins) => {
          const titulo = `${dados.marca} ${dados.modelo} (${dados.anoFabricacao})`;
          admins.forEach((a) => {
            criarNotificacao(a.uid, 'info', 'Novo anúncio pendente', `Um novo carro foi publicado: ${titulo}.`, `/detalhes/${(carro as any).id}`);
          });
        })
        .catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      const isPermission = msg.includes('permission') || msg.includes('unauthorized');
      const isStorage = msg.includes('storage') || msg.includes('upload');
      if (isPermission) {
        toast?.erro('Erro de permissão. Faça login novamente e tente.');
      } else if (isStorage) {
        toast?.erro('Erro ao enviar fotos. Verifique o tamanho das imagens e tente novamente.');
      } else {
        toast?.erro('Erro ao publicar anúncio. Tente novamente.');
      }
      console.error('[Anunciar] Erro:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAnunciarOutro = () => {
    setPublicado(false);
    setCategoria(null);
    setPasso(0);
    setFotos([]);
    setDados((prev) => ({ ...prev, preco: '', descricao: '', videoUrl: '', tiposManutencao: [], features: [] }));
  };

  if (publicado) {
    const isPeca = categoria === 'peca';
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-5 sm:p-8 page-enter">
        <div className="text-center py-6">
          <CheckCircle className="text-green-500 text-5xl mb-3" />
          <h3 className="text-xl font-extrabold text-fg-heading">Anúncio enviado!</h3>
          <p className="text-fg-subtle text-sm mb-2">
            O seu anúncio foi submetido com sucesso e está <strong>pendente de aprovação</strong> pela nossa equipa de administração.
          </p>
          <p className="text-fg-subtle text-sm">
            {isPeca
              ? 'Assim que for aprovado, ficará visível na secção de Peças & Desmonte.'
              : 'Assim que for aprovado, ficará visível para todos. Pode acompanhar o estado em Perfil → Os Seus Carros Anunciados.'}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => router.push(isPeca ? '/pecas' : '/perfil')}
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
    <div className="max-w-2xl mx-auto page-enter">
      <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
        <h2 className="text-2xl font-extrabold text-fg-heading mb-1">{titulo}</h2>
        <p className={`text-fg-subtle text-sm ${categoria === 'carro' && passo >= 1 ? 'mb-1' : 'mb-5'}`}>{subtitulo}</p>
        {categoria === 'carro' && passo >= 1 && (
          <p className="text-[11px] text-fg-muted mb-5">
            💾 O progresso é guardado automaticamente como rascunho neste dispositivo.
          </p>
        )}

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
                filesRef={pendingFilesRef}
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
                carregando={uploading}
              />
            )}
          </>
        )}

        {categoria === 'peca' && passo === 1 && (
          <PecaForm
            // Remount when a draft is resumed so its lazy state re-initializes.
            key={pecaDraft ? 'draft' : 'blank'}
            draft={pecaDraft}
            onCancel={() => { setCategoria(null); setPasso(0); }}
            onSuccess={() => setPublicado(true)}
          />
        )}
      </div>

      {draftPrompt && (
        <DraftResumePrompt
          itemLabel={draftPrompt.kind === 'carro' ? 'um anúncio de carro' : 'um anúncio de peça'}
          savedAt={draftPrompt.draft.savedAt}
          onDiscard={() => {
            clearAdDraft(draftPrompt.kind);
            setDraftPrompt(null);
          }}
          onResume={() => {
            applyDraft(draftPrompt.kind, draftPrompt.draft);
            setDraftPrompt(null);
          }}
        />
      )}
    </div>
  );
}
