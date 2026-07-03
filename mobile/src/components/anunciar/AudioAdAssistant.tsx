// Audio-ad assistant card (plan 24): record on the spot or pick an audio file
// describing the listing; the website's Gemini-backed API fills the form
// fields and the user reviews them.

import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme/colors';
import {
  AUDIO_MAX_BYTES,
  AUDIO_MAX_MB,
  requestListingFromAudio,
  SUPPORTED_AUDIO_EXTENSIONS,
  type CarAudioFields,
  type PartAudioFields,
} from '@/lib/audioListing';

/** Hard stop for on-the-spot recordings; a spoken description fits well under this. */
const MAX_RECORDING_MS = 180_000;

type AudioAdAssistantProps =
  | { kind: 'carro'; onFields: (fields: CarAudioFields, transcript?: string) => void }
  | { kind: 'peca'; onFields: (fields: PartAudioFields, transcript?: string) => void };

interface PendingAudio {
  uri: string;
  name: string;
  mimeType: string;
  /** Display label: recording duration or file name. */
  label: string;
}

const formatMillis = (millis: number): string => {
  const total = Math.floor(millis / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export default function AudioAdAssistant(props: AudioAdAssistantProps) {
  const { kind } = props;
  const { showToast } = useToast();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const player = useAudioPlayer();
  const [pending, setPending] = useState<PendingAudio | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stopping, setStopping] = useState(false);

  // Auto-stop long recordings at the cap.
  useEffect(() => {
    if (recorderState.isRecording && recorderState.durationMillis >= MAX_RECORDING_MS) {
      void stopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState.isRecording, recorderState.durationMillis]);

  const startRecording = async () => {
    if (processing || recorderState.isRecording) return;
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      showToast('Sem acesso ao microfone — pode enviar um ficheiro de áudio em alternativa.', 'error');
      return;
    }
    try {
      player.pause();
      setPending(null);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      showToast('Não foi possível iniciar a gravação.', 'error');
    }
  };

  const stopRecording = async () => {
    if (stopping) return;
    setStopping(true);
    try {
      const durationMillis = recorderState.durationMillis;
      await recorder.stop();
      // Recording keeps iOS in the (quiet) record category — restore playback.
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (recorder.uri) {
        setPending({
          uri: recorder.uri,
          name: 'gravacao.m4a',
          mimeType: 'audio/m4a',
          label: `Gravação (${formatMillis(durationMillis)})`,
        });
      }
    } catch {
      showToast('Não foi possível terminar a gravação.', 'error');
    } finally {
      setStopping(false);
    }
  };

  const pickFile = async () => {
    if (processing) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const extension = asset.name?.split('.').pop()?.toLowerCase() ?? '';
    if (!SUPPORTED_AUDIO_EXTENSIONS.includes(extension)) {
      showToast('Formato de áudio não suportado. Use mp3, wav, m4a, aac, ogg ou flac.', 'error');
      return;
    }
    if ((asset.size ?? 0) > AUDIO_MAX_BYTES) {
      showToast(`O áudio é demasiado grande (máx. ${AUDIO_MAX_MB} MB).`, 'error');
      return;
    }
    player.pause();
    setPending({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      label: asset.name,
    });
  };

  const preview = () => {
    if (!pending) return;
    player.replace(pending.uri);
    player.seekTo(0);
    player.play();
  };

  const interpret = async () => {
    if (!pending || processing) return;
    setProcessing(true);
    try {
      player.pause();
      const { fields, transcript } =
        props.kind === 'carro'
          ? await requestListingFromAudio(pending, 'carro')
          : await requestListingFromAudio(pending, 'peca');
      if (Object.keys(fields).length === 0) {
        showToast('Não conseguimos perceber os detalhes no áudio — tente descrever marca, modelo, ano e preço.', 'error');
        return;
      }
      if (props.kind === 'carro') props.onFields(fields as CarAudioFields, transcript);
      else props.onFields(fields as PartAudioFields, transcript);
      setPending(null);
      showToast('Campos preenchidos a partir do áudio — reveja antes de publicar.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Não foi possível interpretar o áudio. Tente novamente.',
        'error',
      );
    } finally {
      setProcessing(false);
    }
  };

  const helper =
    kind === 'carro'
      ? 'Diga a marca, modelo, ano, cor, quilómetros, preço e o que mais souber — nós preenchemos o formulário.'
      : 'Diga que peça é, para que carro serve, o estado e o preço — nós preenchemos o formulário.';

  return (
    <View className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
      <View className="flex-row items-center gap-2 mb-1">
        <Ionicons name="sparkles" size={16} color={colors.accent} />
        <Text className="text-sm font-bold text-fg-heading">Preencher por voz</Text>
        <View className="rounded-full bg-accent/10 px-2 py-0.5">
          <Text className="text-[10px] font-bold uppercase tracking-wide text-accent">IA</Text>
        </View>
      </View>
      <Text className="text-xs text-fg-muted mb-3">{helper}</Text>

      {recorderState.isRecording ? (
        <View className="flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center gap-2" accessibilityRole="text">
            <View className="h-2.5 w-2.5 rounded-full bg-danger-600" />
            <Text className="text-sm font-semibold text-danger-700">
              A gravar… {formatMillis(recorderState.durationMillis)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Parar gravação"
            onPress={() => void stopRecording()}
            disabled={stopping}
            className={`flex-row items-center gap-2 rounded-xl bg-danger-600 px-5 py-3 active:opacity-80 ${stopping ? 'opacity-50' : ''}`}
          >
            <Ionicons name="stop" size={16} color="#fff" />
            <Text className="text-sm font-bold text-white">Parar</Text>
          </Pressable>
        </View>
      ) : pending ? (
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="musical-notes" size={16} color={colors.primary[600]} />
            <Text className="flex-1 text-xs text-fg" numberOfLines={1}>
              {pending.label}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ouvir áudio"
              onPress={preview}
              disabled={processing}
              className="rounded-full p-2 active:bg-primary-100"
            >
              <Ionicons name="play" size={18} color={colors.primary[700]} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remover áudio"
              onPress={() => {
                player.pause();
                setPending(null);
              }}
              disabled={processing}
              className="rounded-full p-2 active:bg-primary-100"
            >
              <Ionicons name="close" size={18} color={colors.neutral[500]} />
            </Pressable>
          </View>
          <Button
            label={processing ? 'A interpretar…' : 'Preencher com IA'}
            icon={<Ionicons name="sparkles" size={16} color="#fff" />}
            loading={processing}
            onPress={() => void interpret()}
          />
        </View>
      ) : (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button
              label="Gravar agora"
              icon={<Ionicons name="mic" size={16} color="#fff" />}
              onPress={() => void startRecording()}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Enviar áudio"
              variant="outline"
              icon={<Ionicons name="attach" size={16} color={colors.primary[700]} />}
              onPress={() => void pickFile()}
            />
          </View>
        </View>
      )}
    </View>
  );
}
