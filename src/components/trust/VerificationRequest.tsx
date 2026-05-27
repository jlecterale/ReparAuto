import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import type { Verification, VerificationInput, TipoVerificacao, TipoDocumento } from '@/types/verification';

interface VerificationRequestProps {
  uid: string;
  email: string;
  nome: string;
  nif?: string;
  verificado?: boolean;
  verification: Verification | null;
  loading: boolean;
  onSubmit: (data: VerificationInput) => Promise<unknown>;
}

const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'cc', label: 'Cartão de Cidadão' },
  { value: 'passaporte', label: 'Passaporte' },
  { value: 'residencia', label: 'Título de Residência' },
];

export default function VerificationRequest({
  uid,
  email,
  nome,
  nif,
  verificado,
  verification,
  loading,
  onSubmit,
}: VerificationRequestProps) {
  const [tipo, setTipo] = useState<TipoVerificacao>('identidade');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cc');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState('');
  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  if (loading) return null;

  if (verificado) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <i className="fa-solid fa-circle-check text-blue-500 text-xl"></i>
        <div>
          <p className="font-semibold text-blue-900 text-sm">Conta Verificada</p>
          <p className="text-xs text-blue-600">A sua identidade foi verificada pela equipa ReparAuto.</p>
        </div>
      </div>
    );
  }

  if (verification && verification.status !== 'rejeitado') {
    const statusMap: Record<string, { cor: string; icon: string; texto: string }> = {
      pendente: { cor: 'bg-yellow-50 border-yellow-200', icon: 'fa-solid fa-clock text-yellow-500', texto: 'O seu pedido de verificação está em análise. Os documentos enviados serão apagados após a decisão.' },
      aprovado: { cor: 'bg-green-50 border-green-200', icon: 'fa-solid fa-circle-check text-green-500', texto: 'O seu pedido foi aprovado!' },
    };
    const status = statusMap[verification.status] || statusMap.pendente;

    return (
      <div className={`${status.cor} border rounded-xl p-4 flex items-center gap-3`}>
        <i className={`${status.icon} text-xl`}></i>
        <div>
          <p className="font-semibold text-brand-900 text-sm">Verificação {verification.status === 'pendente' ? 'em análise' : 'aprovada'}</p>
          <p className="text-xs text-slate-600">{status.texto}</p>
          {verification.notasAdmin && (
            <p className="text-xs text-slate-500 mt-1 italic">Notas: {verification.notasAdmin}</p>
          )}
        </div>
      </div>
    );
  }

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    return new Promise((resolve, reject) => {
      task.on(
        'state_changed',
        (snap) => setProgresso(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => {
          const url = await getDownloadURL(storageRef);
          resolve(url);
        },
      );
    });
  };

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) return 'Apenas ficheiros de imagem são permitidos.';
    if (file.size > 5 * 1024 * 1024) return 'O ficheiro deve ter no máximo 5MB.';
    return null;
  };

  const handleSubmit = async () => {
    if (!docFile || !selfieFile) {
      setErro('É necessário enviar o documento e a foto com o documento.');
      return;
    }

    const docErr = validateFile(docFile);
    if (docErr) { setErro(`Documento: ${docErr}`); return; }
    const selfieErr = validateFile(selfieFile);
    if (selfieErr) { setErro(`Selfie: ${selfieErr}`); return; }

    setEnviando(true);
    setErro('');
    setProgresso(0);

    try {
      const ts = Date.now();
      const documentoUrl = await uploadFile(docFile, `verifications/${uid}/documento_${ts}`);
      const selfieUrl = await uploadFile(selfieFile, `verifications/${uid}/selfie_${ts}`);

      await onSubmit({
        uid,
        email,
        nome,
        tipo,
        tipoDocumento,
        documentoUrl,
        selfieUrl,
        nif: nif || undefined,
        status: 'pendente',
      });
    } catch {
      setErro('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setEnviando(false);
      setProgresso(0);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      {verification?.status === 'rejeitado' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-red-700 font-semibold">
            <i className="fa-solid fa-circle-xmark mr-1"></i>
            O seu pedido anterior foi rejeitado.
            {verification.notasAdmin && <span className="font-normal italic"> Motivo: {verification.notasAdmin}</span>}
          </p>
          <p className="text-xs text-red-600 mt-1">Pode submeter um novo pedido abaixo.</p>
        </div>
      )}
      <h4 className="font-bold text-brand-900 text-sm mb-2 flex items-center gap-2">
        <i className="fa-solid fa-shield-halved text-accent"></i>
        Verificar Conta
      </h4>
      <p className="text-xs text-slate-500 mb-3">
        Envie um documento de identificação e uma foto sua com o documento para obter o selo de conta verificada.
        Os ficheiros são apagados após a análise.
      </p>

      {/* Tipo de verificação */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTipo('identidade')}
          className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg border transition ${
            tipo === 'identidade'
              ? 'border-accent bg-accent/5 text-accent'
              : 'border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <i className="fa-solid fa-id-card mr-1"></i> Identidade
        </button>
        <button
          onClick={() => setTipo('profissional')}
          className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg border transition ${
            tipo === 'profissional'
              ? 'border-accent bg-accent/5 text-accent'
              : 'border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <i className="fa-solid fa-store mr-1"></i> Profissional
        </button>
      </div>

      {/* Tipo de documento */}
      <div className="mb-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tipo de Documento</label>
        <select
          value={tipoDocumento}
          onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent bg-white"
        >
          {TIPOS_DOCUMENTO.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Documento upload */}
      <div className="mb-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
          Foto do Documento
        </label>
        <div
          onClick={() => docInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
            docFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-accent/50 hover:bg-accent/5'
          }`}
        >
          {docFile ? (
            <div className="flex items-center justify-center gap-2">
              <i className="fa-solid fa-file-image text-green-500"></i>
              <span className="text-xs font-semibold text-green-700 truncate max-w-[200px]">{docFile.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setDocFile(null); }}
                className="text-red-400 hover:text-red-600 text-xs ml-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ) : (
            <>
              <i className="fa-solid fa-cloud-arrow-up text-slate-400 text-xl mb-1"></i>
              <p className="text-xs text-slate-500">Clique para enviar foto do documento</p>
              <p className="text-[10px] text-slate-400">Imagem até 5MB (JPG, PNG)</p>
            </>
          )}
        </div>
        <input
          ref={docInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { setDocFile(e.target.files?.[0] || null); setErro(''); }}
        />
      </div>

      {/* Selfie upload */}
      <div className="mb-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
          Selfie com o Documento
        </label>
        <div
          onClick={() => selfieInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
            selfieFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-accent/50 hover:bg-accent/5'
          }`}
        >
          {selfieFile ? (
            <div className="flex items-center justify-center gap-2">
              <i className="fa-solid fa-camera text-green-500"></i>
              <span className="text-xs font-semibold text-green-700 truncate max-w-[200px]">{selfieFile.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setSelfieFile(null); }}
                className="text-red-400 hover:text-red-600 text-xs ml-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ) : (
            <>
              <i className="fa-solid fa-camera text-slate-400 text-xl mb-1"></i>
              <p className="text-xs text-slate-500">Clique para enviar selfie segurando o documento</p>
              <p className="text-[10px] text-slate-400">Imagem até 5MB (JPG, PNG)</p>
            </>
          )}
        </div>
        <input
          ref={selfieInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { setSelfieFile(e.target.files?.[0] || null); setErro(''); }}
        />
      </div>

      {erro && (
        <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
          <i className="fa-solid fa-circle-exclamation"></i> {erro}
        </p>
      )}

      {enviando && progresso > 0 && (
        <div className="mb-3">
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-accent h-1.5 rounded-full transition-all" style={{ width: `${progresso}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-1">A enviar... {progresso}%</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={enviando || !docFile || !selfieFile}
        className="w-full bg-accent hover:bg-accent-hover text-white font-bold text-xs py-2.5 rounded-lg transition disabled:opacity-50"
      >
        {enviando ? (
          <><i className="fa-solid fa-spinner fa-spin mr-1"></i> A enviar...</>
        ) : (
          <><i className="fa-solid fa-paper-plane mr-1"></i> Pedir Verificação</>
        )}
      </button>

      <p className="text-[10px] text-slate-400 text-center mt-2">
        <i className="fa-solid fa-lock mr-1"></i>
        Os documentos são armazenados de forma segura e apagados após a verificação (RGPD).
      </p>
    </div>
  );
}
