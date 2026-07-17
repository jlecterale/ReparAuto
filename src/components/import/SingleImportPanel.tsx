'use client';

import { MagicWand } from '@phosphor-icons/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { loadAdDraft, saveAdDraft, hasCarDraftContent, type CarAdDraftData } from '@/lib/adDraft';
import { EMPTY_CARRO_FORM_DATA } from '@/lib/carFormDefaults';
import { MAX_FOTOS_CARRO } from '@/lib/constants';
import { previewStandvirtualImport, previewWebmotorsImport, type ImportPreviewData } from '@/lib/importers/client';
import { validateImportUrl } from '@/lib/importers/urlList';
import { describeUnmappedFields } from '@/components/import/importUi';
import { useCountry } from '@/providers/CountryProvider';

/**
 * "Importar 1" — fetches one advert and prefills the Anunciar wizard via the
 * saved-draft mechanism; the user reviews and publishes manually.
 */
export default function SingleImportPanel({ attested }: { attested: boolean }) {
  const router = useRouter();
  const { auth } = useApp();
  const { user } = auth;
  const toast = useToast();
  const { country } = useCountry();

  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [showHtmlPaste, setShowHtmlPaste] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [pendingOverwrite, setPendingOverwrite] = useState<ImportPreviewData | null>(null);

  const applyPreview = (preview: ImportPreviewData) => {
    const dados = {
      ...EMPTY_CARRO_FORM_DATA,
      vendedorWhatsApp: user?.telefone || '',
      vendedorTelefone: user?.telefone || '',
      vendedorEmail: user?.email || '',
      ...preview.dados,
    };
    saveAdDraft<CarAdDraftData>(
      'carro',
      { dados, fotos: preview.fotos.slice(0, MAX_FOTOS_CARRO), step: 1 },
      { uid: user?.uid ?? null },
    );
    if (preview.unmappedFields.length > 0) {
      toast?.info(`Campos a rever no formulário: ${describeUnmappedFields(preview.unmappedFields)}.`);
    } else {
      toast?.sucesso('Anúncio importado — reveja e publique.');
    }
    router.push('/anunciar?tipo=carro&retomar=1');
  };

  const handleImport = async () => {
    setErro('');
    const parsed = validateImportUrl(url, country);
    if (!parsed.valid || !parsed.normalizedUrl) {
      setErro(parsed.reason || 'URL inválido.');
      return;
    }
    setLoading(true);
    try {
      let result;
      if (country === 'BR') {
        result = await previewWebmotorsImport(parsed.normalizedUrl, html.trim() || undefined);
      } else {
        result = await previewStandvirtualImport(parsed.normalizedUrl);
      }

      if (!result.ok) {
        setErro(result.message);
        if (result.errorCode === 'blocked' && country === 'BR') {
          setShowHtmlPaste(true);
        }
        return;
      }
      if (!result.preview.active) {
        toast?.info(`Atenção: este anúncio já não está ativo no ${country === 'BR' ? 'Webmotors' : 'Standvirtual'}.`);
      }
      const existing = loadAdDraft<CarAdDraftData>('carro', user?.uid ?? null);
      if (existing && hasCarDraftContent(existing.data.dados)) {
        // Prefilling would overwrite an in-progress draft — ask first.
        setPendingOverwrite(result.preview);
        return;
      }
      applyPreview(result.preview);
    } finally {
      setLoading(false);
    }
  };

  const platformName = country === 'BR' ? 'Webmotors' : 'Standvirtual';
  const urlPlaceholder = country === 'BR'
    ? 'https://www.webmotors.com.br/comprar/…'
    : 'https://www.standvirtual.com/carros/anuncio/…-ID….html';

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg">
        Cole o link de um anúncio seu no {platformName}. Os dados e as fotos são lidos e o
        formulário de anúncio fica pré-preenchido — nada é publicado sem a sua revisão.
      </p>

      <Input
        label="URL do anúncio"
        placeholder={urlPlaceholder}
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setErro('');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !loading) void handleImport();
        }}
        erro={erro}
        disabled={loading}
        inputMode="url"
        autoComplete="off"
      />

      {!showHtmlPaste && country === 'BR' && (
        <button
          type="button"
          onClick={() => setShowHtmlPaste(true)}
          className="text-xs text-accent hover:underline font-semibold block text-right w-full"
        >
          Não consegue importar diretamente? Clique para colar o HTML manualmente.
        </button>
      )}

      {showHtmlPaste && country === 'BR' && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
          <p className="text-xs text-fg font-semibold">
            Instruções para colar o HTML do anúncio:
          </p>
          <ol className="text-xs text-fg-muted list-decimal list-inside space-y-1">
            <li>Abra o link do seu anúncio no navegador.</li>
            <li>Pressione <strong>Ctrl + U</strong> (ou clique com o botão direito e selecione "Exibir código-fonte").</li>
            <li>Selecione todo o código (<strong>Ctrl + A</strong>), copie (<strong>Ctrl + C</strong>) e cole na caixa abaixo:</li>
          </ol>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="Cole o código HTML completo do anúncio aqui..."
            rows={5}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
          />
        </div>
      )}

      {pendingOverwrite ? (
        <Alert tipo="aviso" titulo="Tem um rascunho por terminar">
          <p className="mb-3">
            Importar este anúncio substitui o rascunho de carro guardado neste navegador.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button tipo="primario" tamanho="sm" onClick={() => applyPreview(pendingOverwrite)}>
              Substituir rascunho
            </Button>
            <Button tipo="secundario" tamanho="sm" onClick={() => setPendingOverwrite(null)}>
              Cancelar
            </Button>
          </div>
        </Alert>
      ) : (
        <Button
          tipo="primario"
          icone={<MagicWand weight="bold" />}
          carregando={loading}
          disabled={loading || !attested || !url.trim()}
          onClick={handleImport}
          blocoCompleto
        >
          {loading ? 'A ler o anúncio…' : 'Pré-preencher formulário'}
        </Button>
      )}
      {!attested && (
        <p className="text-xs text-fg-muted text-center">
          Confirme acima que o anúncio é seu para continuar.
        </p>
      )}
    </div>
  );
}
