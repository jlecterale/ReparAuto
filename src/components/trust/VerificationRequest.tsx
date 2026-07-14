'use client';

import { useState, useRef, useMemo, useEffect, type ReactNode } from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  ShieldCheck,
  IdentificationCard,
  Storefront,
  FileImage,
  X,
  CloudArrowUp,
  Camera,
  WarningCircle,
  PaperPlaneTilt,
  Lock,
} from '@phosphor-icons/react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import CameraCapture from '@/components/ui/CameraCapture';
import { useCountry } from '@/providers/CountryProvider';
import { documentosPermitidos } from '@/lib/verificationDocs';
import { verificationTipoForConta } from '@/lib/verification';
import type { AlertTipo } from '@/types/ui';
import type { Verification, VerificationInput, TipoDocumento } from '@/types/verification';
import type { TipoConta } from '@/types/usuario';

interface VerificationRequestProps {
  uid: string;
  email: string;
  nome: string;
  nif?: string;
  tipoConta?: TipoConta;
  verificado?: boolean;
  verification: Verification | null;
  loading: boolean;
  onSubmit: (data: VerificationInput) => Promise<unknown>;
}

export default function VerificationRequest({
  uid,
  email,
  nome,
  nif,
  tipoConta,
  verificado,
  verification,
  loading,
  onSubmit,
}: VerificationRequestProps) {
  const { country } = useCountry();
  // The verification type is fixed by the account type — a professional account
  // does a professional verification, everyone else an identity one. It is not
  // chosen here (the account type can't be changed after signup).
  const tipo = verificationTipoForConta(tipoConta);
  // Accepted documents depend on the market and whether it's a personal or a
  // professional (business) verification — see src/lib/verificationDocs.ts.
  const documentos = useMemo(() => documentosPermitidos(country, tipo), [country, tipo]);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>(documentos[0].value);
  // Keep the selected document valid whenever the market or type changes the list.
  useEffect(() => {
    if (!documentos.some((d) => d.value === tipoDocumento)) setTipoDocumento(documentos[0].value);
  }, [documentos, tipoDocumento]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState('');
  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const [cameraActiveFor, setCameraActiveFor] = useState<'documento' | 'selfie' | null>(null);

  if (loading) return null;

  if (verificado) {
    return (
      <Alert tipo="info" icone={<CheckCircle />} titulo="Conta Verificada" className="!items-center">
        A sua identidade foi verificada pela equipa RecarGarage.
      </Alert>
    );
  }

  if (verification && verification.status !== 'rejeitado') {
    const statusMap: Record<string, { tipo: AlertTipo; icon: ReactNode; texto: string }> = {
      pendente: { tipo: 'aviso', icon: <Clock />, texto: 'O seu pedido de verificação está em análise. Os documentos enviados serão apagados após a decisão.' },
      aprovado: { tipo: 'sucesso', icon: <CheckCircle />, texto: 'O seu pedido foi aprovado!' },
    };
    const status = statusMap[verification.status] || statusMap.pendente;

    return (
      <Alert
        tipo={status.tipo}
        icone={status.icon}
        titulo={`Verificação ${verification.status === 'pendente' ? 'em análise' : 'aprovada'}`}
      >
        {status.texto}
        {verification.notasAdmin && (
          <span className="block mt-1 italic opacity-80">Notas: {verification.notasAdmin}</span>
        )}
      </Alert>
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
        country,
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
        <Alert tipo="erro" icone={<XCircle />} className="!p-3 !rounded-lg mb-3">
          <span className="font-semibold">
            O seu pedido anterior foi rejeitado.
            {verification.notasAdmin && <span className="font-normal italic"> Motivo: {verification.notasAdmin}</span>}
          </span>
          <span className="block mt-1">Pode submeter um novo pedido abaixo.</span>
        </Alert>
      )}
      <h4 className="font-bold text-fg-heading text-sm mb-2 flex items-center gap-2">
        <ShieldCheck className="text-accent" />
        Verificar Conta
      </h4>
      <p className="text-xs text-fg-subtle mb-3">
        Envie um documento de identificação e uma foto sua com o documento para obter o selo de conta verificada.
        Os ficheiros são apagados após a análise.
      </p>

      {/* Tipo de verificação — determinado pelo tipo de conta, não escolhido aqui */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border border-slate-200 bg-white">
        {tipo === 'profissional' ? (
          <Storefront className="text-accent shrink-0" />
        ) : (
          <IdentificationCard className="text-accent shrink-0" />
        )}
        <span className="text-xs font-semibold text-fg">
          {tipo === 'profissional' ? 'Verificação Profissional' : 'Verificação de Identidade'}
        </span>
      </div>

      {/* Tipo de documento */}
      <div className="mb-3">
        <label className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider mb-1 block">Tipo de Documento</label>
        <select
          value={tipoDocumento}
          onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent bg-white"
        >
          {documentos.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Documento upload */}
      <div className="mb-3">
        <label className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider mb-1 block">
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
              <FileImage className="text-green-600" />
              <span className="text-xs font-semibold text-green-700 truncate max-w-[200px]">{docFile.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setDocFile(null); }}
                className="text-red-400 hover:text-red-600 text-xs ml-1"
              >
                <X />
              </button>
            </div>
          ) : (
            <>
              <CloudArrowUp className="text-slate-400 text-xl mb-1" />
              <p className="text-xs text-fg-subtle">Clique para enviar foto do documento</p>
              <p className="text-[10px] text-fg-subtle">Imagem até 5MB (JPG, PNG)</p>
            </>
          )}
        </div>
        {!docFile && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCameraActiveFor('documento'); }}
            className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-bold text-accent hover:text-accent-hover transition border border-accent/20 rounded-lg py-2 hover:bg-accent/5"
          >
            <Camera size={16} /> Tirar Foto com a Câmara
          </button>
        )}
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
        <label className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider mb-1 block">
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
              <Camera className="text-green-600" />
              <span className="text-xs font-semibold text-green-700 truncate max-w-[200px]">{selfieFile.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setSelfieFile(null); }}
                className="text-red-400 hover:text-red-600 text-xs ml-1"
              >
                <X />
              </button>
            </div>
          ) : (
            <>
              <Camera className="text-slate-400 text-xl mb-1" />
              <p className="text-xs text-fg-subtle">Clique para enviar selfie segurando o documento</p>
              <p className="text-[10px] text-fg-subtle">Imagem até 5MB (JPG, PNG)</p>
            </>
          )}
        </div>
        {!selfieFile && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCameraActiveFor('selfie'); }}
            className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-bold text-accent hover:text-accent-hover transition border border-accent/20 rounded-lg py-2 hover:bg-accent/5"
          >
            <Camera size={16} /> Tirar Selfie com a Câmara
          </button>
        )}
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
          <WarningCircle /> {erro}
        </p>
      )}

      {enviando && progresso > 0 && (
        <div className="mb-3">
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-accent h-1.5 rounded-full transition-all" style={{ width: `${progresso}%` }}></div>
          </div>
          <p className="text-[10px] text-fg-subtle text-center mt-1">A enviar... {progresso}%</p>
        </div>
      )}

      <Button
        tipo="primario"
        tamanho="md"
        blocoCompleto
        carregando={enviando}
        disabled={enviando || !docFile || !selfieFile}
        onClick={handleSubmit}
        icone={<PaperPlaneTilt />}
      >
        {enviando ? 'A enviar...' : 'Pedir Verificação'}
      </Button>

      <p className="text-[10px] text-fg-subtle text-center mt-2">
        <Lock className="mr-1" />
        Os documentos são armazenados de forma segura e apagados após a verificação ({country === 'BR' ? 'LGPD' : 'RGPD'}).
      </p>

      {cameraActiveFor && (
        <CameraCapture
          facingMode={cameraActiveFor === 'selfie' ? 'user' : 'environment'}
          label={cameraActiveFor === 'selfie' ? 'Tirar Selfie com Documento' : 'Tirar Foto do Documento'}
          onClose={() => setCameraActiveFor(null)}
          onCapture={(file) => {
            if (cameraActiveFor === 'documento') {
              setDocFile(file);
            } else {
              setSelfieFile(file);
            }
            setErro('');
            setCameraActiveFor(null);
          }}
        />
      )}
    </div>
  );
}
