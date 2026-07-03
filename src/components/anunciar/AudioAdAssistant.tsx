'use client';

// Audio-ad assistant card (plan 24): record on the spot or pick an audio file
// describing the listing; Gemini fills the form fields, the user reviews.

import { useEffect, useRef, useState } from 'react';
import { Microphone, MusicNote, Sparkle, Stop, UploadSimple, X } from '@phosphor-icons/react';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { AUDIO_MAX_BYTES, AUDIO_MAX_MB, geminiAudioMimeType } from '@/lib/audioListing';
import type { CarAudioFields, PartAudioFields } from '@/lib/audioListing';
import { blobToWav } from '@/lib/audioWav';
import { requestListingFromAudio } from '@/lib/audioListingClient';

/** Hard stop for on-the-spot recordings; a spoken description fits well under this. */
const MAX_RECORDING_SECONDS = 180;

type AudioAdAssistantProps = { className?: string } & (
  | { kind: 'carro'; onFields: (fields: CarAudioFields, transcript?: string) => void }
  | { kind: 'peca'; onFields: (fields: PartAudioFields, transcript?: string) => void }
);

interface PendingAudio {
  blob: Blob;
  fileName: string;
  /** Recordings may need a WAV re-encode; picked files are sent as-is. */
  recorded: boolean;
  url: string;
}

const formatSeconds = (total: number): string => {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export default function AudioAdAssistant(props: AudioAdAssistantProps) {
  const { kind, className = '' } = props;
  const toast = useToast();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pending, setPending] = useState<PendingAudio | null>(null);
  const [processing, setProcessing] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUrlRef = useRef<string | null>(null);
  const unmountedRef = useRef(false);

  // Decided after mount: browser-API branches during SSR cause hydration
  // mismatches (the form pages are client components but still pre-rendered).
  const [canRecord, setCanRecord] = useState(false);
  useEffect(() => {
    setCanRecord(typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const replacePending = (next: PendingAudio | null) => {
    if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current);
    pendingUrlRef.current = next?.url ?? null;
    setPending(next);
  };

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      clearTimer();
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (recording || processing) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast?.erro('Sem acesso ao microfone — pode enviar um ficheiro de áudio em alternativa.');
      return;
    }

    replacePending(null);
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      clearTimer();
      setRecording(false);
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      // A stop fired by unmount cleanup must not create an orphan object URL.
      if (blob.size === 0 || unmountedRef.current) return;
      replacePending({
        blob,
        fileName: 'gravacao.webm',
        recorded: true,
        url: URL.createObjectURL(blob),
      });
    };

    recorderRef.current = recorder;
    recorder.start();
    setElapsed(0);
    setRecording(true);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= MAX_RECORDING_SECONDS) stopRecording();
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  };

  const pickFile = (file: File | null) => {
    if (!file) return;
    if (!geminiAudioMimeType(file.type, file.name)) {
      toast?.erro('Formato de áudio não suportado. Use mp3, wav, m4a, aac, ogg ou flac.');
      return;
    }
    if (file.size > AUDIO_MAX_BYTES) {
      toast?.erro(`O áudio é demasiado grande (máx. ${AUDIO_MAX_MB} MB).`);
      return;
    }
    replacePending({ blob: file, fileName: file.name, recorded: false, url: URL.createObjectURL(file) });
  };

  const interpret = async () => {
    if (!pending || processing) return;
    setProcessing(true);
    try {
      let audio = pending.blob;
      let fileName = pending.fileName;
      // Browser recordings (webm/opus & friends) aren't in Gemini's supported
      // list — re-encode them to WAV client-side. Picked files go as-is.
      if (pending.recorded && !geminiAudioMimeType(audio.type)) {
        audio = await blobToWav(audio);
        fileName = 'gravacao.wav';
      }
      const { fields, transcript } =
        props.kind === 'carro'
          ? await requestListingFromAudio(audio, fileName, 'carro')
          : await requestListingFromAudio(audio, fileName, 'peca');
      if (Object.keys(fields).length === 0) {
        toast?.erro('Não conseguimos perceber os detalhes no áudio — tente descrever marca, modelo, ano e preço.');
        return;
      }
      if (props.kind === 'carro') props.onFields(fields as CarAudioFields, transcript);
      else props.onFields(fields as PartAudioFields, transcript);
      replacePending(null);
      toast?.sucesso('Campos preenchidos a partir do áudio — reveja antes de continuar.');
    } catch (err) {
      toast?.erro(err instanceof Error ? err.message : 'Não foi possível interpretar o áudio. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const helper =
    kind === 'carro'
      ? 'Diga a marca, modelo, ano, cor, quilómetros, preço e o que mais souber — nós preenchemos o formulário.'
      : 'Diga que peça é, para que carro serve, o estado e o preço — nós preenchemos o formulário.';

  return (
    <section
      aria-label="Preencher por voz"
      className={`rounded-2xl border border-primary-100 bg-primary-50 p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkle className="text-accent" weight="fill" aria-hidden />
        <h4 className="text-sm font-bold text-fg-heading">Preencher por voz</h4>
        <span className="text-[10px] font-bold uppercase tracking-wide bg-accent/10 text-accent rounded-full px-2 py-0.5">
          IA
        </span>
      </div>
      <p className="text-xs text-fg-muted mb-3">{helper}</p>

      {recording ? (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-danger-700" role="status">
            <span className="w-2.5 h-2.5 rounded-full bg-danger-600 animate-pulse" aria-hidden />
            A gravar… {formatSeconds(elapsed)}
          </span>
          <Button tipo="perigo" tamanho="sm" icone={<Stop weight="fill" />} onClick={stopRecording}>
            Parar
          </Button>
        </div>
      ) : pending ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 min-w-0">
            <MusicNote className="text-primary-600 shrink-0" aria-hidden />
            <span className="text-xs text-fg truncate" title={pending.fileName}>
              {pending.recorded ? `Gravação (${formatSeconds(elapsed)})` : pending.fileName}
            </span>
            <button
              type="button"
              onClick={() => replacePending(null)}
              disabled={processing}
              aria-label="Remover áudio"
              className="ml-auto shrink-0 p-1.5 rounded-full text-fg-muted hover:bg-primary-100 hover:text-fg disabled:opacity-50"
            >
              <X aria-hidden />
            </button>
          </div>
          <audio controls src={pending.url} className="w-full h-10" />
          <Button
            tipo="primario"
            tamanho="md"
            blocoCompleto
            icone={<Sparkle weight="fill" />}
            carregando={processing}
            onClick={interpret}
          >
            {processing ? 'A interpretar…' : 'Preencher com IA'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          {canRecord && (
            <Button tipo="primario" tamanho="md" icone={<Microphone weight="fill" />} onClick={startRecording}>
              Gravar agora
            </Button>
          )}
          <Button
            tipo="secundario"
            tamanho="md"
            icone={<UploadSimple />}
            onClick={() => fileInputRef.current?.click()}
          >
            Enviar áudio
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.flac,.opus"
            className="hidden"
            onChange={(e) => {
              pickFile(e.target.files?.[0] ?? null);
              e.target.value = '';
            }}
          />
        </div>
      )}
    </section>
  );
}
