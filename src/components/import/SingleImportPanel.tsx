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
import { previewStandvirtualImport, type ImportPreviewData } from '@/lib/importers/client';
import { validateStandvirtualUrl } from '@/lib/importers/urlList';
import { describeUnmappedFields } from '@/components/import/importUi';

/**
 * "Importar 1" — fetches one advert and prefills the Anunciar wizard via the
 * saved-draft mechanism; the user reviews and publishes manually.
 */
export default function SingleImportPanel({ attested }: { attested: boolean }) {
  const router = useRouter();
  const { auth } = useApp();
  const { user } = auth;
  const toast = useToast();

  const [url, setUrl] = useState('');
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
    const parsed = validateStandvirtualUrl(url);
    if (!parsed.valid || !parsed.normalizedUrl) {
      setErro(parsed.reason || 'URL inválido.');
      return;
    }
    setLoading(true);
    try {
      const result = await previewStandvirtualImport(parsed.normalizedUrl);
      if (!result.ok) {
        setErro(result.message);
        return;
      }
      if (!result.preview.active) {
        toast?.info('Atenção: este anúncio já não está ativo no Standvirtual.');
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg">
        Cole o link de um anúncio seu no Standvirtual. Os dados e as fotos são lidos e o
        formulário de anúncio fica pré-preenchido — nada é publicado sem a sua revisão.
      </p>

      <Input
        label="URL do anúncio"
        placeholder="https://www.standvirtual.com/carros/anuncio/…-ID….html"
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
