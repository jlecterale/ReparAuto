import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useDamageDetection } from '@/hooks/useDamageDetection';
import { LISTING_PHOTO_ASPECT } from '@/lib/constants';
import type { Carro, DamageArea, DamageSeverity } from '@/types';

interface DamageAnalysisProps {
  carro: Carro;
  /** AI analysis costs a generation — only signed-in users can trigger it. */
  isAuthenticated: boolean;
}

const isHttpsPhoto = (foto: string) => foto.startsWith('https://');

const SEVERITY_LABEL: Record<DamageSeverity, string> = {
  minor: 'Ligeiro',
  moderate: 'Moderado',
  severe: 'Grave',
};

// warning has only a 500 shade in the mobile theme; accent/danger cover the rest.
const SEVERITY_COLOR: Record<DamageSeverity, string> = {
  minor: '#d4ae12',
  moderate: '#db6418',
  severe: '#e11f28',
};

/**
 * "Análise de danos (IA)" panel for listings flagged as needing maintenance.
 * Lets the viewer pick a photo and runs Gemini Vision on it through the shared
 * Cloud Function proxy; results are cached per photo server-side, so repeat
 * analyses are free.
 */
export function DamageAnalysis({ carro, isAuthenticated }: DamageAnalysisProps) {
  const fotos = carro.fotos ?? [];
  const [photoIndex, setPhotoIndex] = useState(() => fotos.findIndex(isHttpsPhoto));
  const [analyzedIndex, setAnalyzedIndex] = useState<number | null>(null);
  const { analyze, result, loading, error } = useDamageDetection();

  const analyzable = fotos.some(isHttpsPhoto);
  if (!analyzable || photoIndex < 0) return null;

  const selectedUrl = fotos[photoIndex];
  const showResult = result !== null && analyzedIndex === photoIndex && !loading;

  async function handleAnalyze() {
    const detection = await analyze(carro.id, photoIndex);
    if (detection) setAnalyzedIndex(photoIndex);
  }

  return (
    <View className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
      <View className="mb-1 flex-row items-center gap-2">
        <Ionicons name="sparkles" size={16} color="#db6418" />
        <Text className="text-lg font-bold text-fg-heading">Análise de danos (IA)</Text>
      </View>
      <Text className="mb-3 text-xs text-fg-muted">
        A IA identifica danos visíveis nas fotos deste veículo e marca-os na imagem.
      </Text>

      {fotos.filter(isHttpsPhoto).length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            {fotos.map((foto, i) =>
              isHttpsPhoto(foto) ? (
                <Pressable
                  key={i}
                  onPress={() => setPhotoIndex(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Analisar foto ${i + 1}`}
                  accessibilityState={{ selected: i === photoIndex }}
                  className={`overflow-hidden rounded-lg border-2 ${
                    i === photoIndex ? 'border-accent' : 'border-transparent opacity-60'
                  }`}
                >
                  <Image source={foto} style={{ width: 56, height: 56 }} contentFit="cover" />
                </Pressable>
              ) : null,
            )}
          </View>
        </ScrollView>
      )}

      {showResult ? (
        <DamageOverlay fotoUrl={selectedUrl} damages={result.damages} summary={result.summary} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !isAuthenticated || loading, busy: loading }}
          disabled={!isAuthenticated || loading}
          onPress={handleAnalyze}
          className={`flex-row items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-3 active:opacity-80 ${
            !isAuthenticated || loading ? 'opacity-50' : ''
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="search" size={16} color="#fff" />
          )}
          <Text className="text-base font-bold text-white">
            {loading ? 'A analisar a foto…' : 'Analisar danos desta foto'}
          </Text>
        </Pressable>
      )}

      {!isAuthenticated && (
        <Text className="mt-2 text-xs text-fg-subtle">
          Inicie sessão para usar a análise de danos com IA.
        </Text>
      )}
      {!!error && <Text className="mt-2 text-xs text-danger-600">{error}</Text>}
    </View>
  );
}

function DamageOverlay({
  fotoUrl,
  damages,
  summary,
}: {
  fotoUrl: string;
  damages: DamageArea[];
  summary: string;
}) {
  const [showBoxes, setShowBoxes] = useState(true);
  const hasDamages = damages.length > 0;

  return (
    <View>
      {/* Fractional boxes are positioned as % of this fixed-aspect wrapper. */}
      <View className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: LISTING_PHOTO_ASPECT }}>
        <Image source={fotoUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        {showBoxes &&
          damages.map((area, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: `${area.x * 100}%`,
                top: `${area.y * 100}%`,
                width: `${area.width * 100}%`,
                height: `${area.height * 100}%`,
                borderWidth: 2,
                borderRadius: 6,
                borderColor: SEVERITY_COLOR[area.severity],
              }}
            />
          ))}
        {hasDamages && (
          <Pressable
            onPress={() => setShowBoxes((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={showBoxes ? 'Ocultar marcações de danos' : 'Mostrar marcações de danos'}
            className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 active:bg-black/75"
          >
            <Ionicons name={showBoxes ? 'eye-off' : 'eye'} size={13} color="#fff" />
            <Text className="text-xs font-semibold text-white">{showBoxes ? 'Ocultar' : 'Mostrar'}</Text>
          </Pressable>
        )}
      </View>

      {!!summary && <Text className="mt-3 text-sm leading-6 text-fg">{summary}</Text>}

      {hasDamages ? (
        <View className="mt-2 gap-1.5">
          {damages.map((area, i) => (
            <View key={i} className="flex-row items-center gap-2">
              <View
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: `${SEVERITY_COLOR[area.severity]}22` }}
              >
                <Text className="text-xs font-semibold" style={{ color: SEVERITY_COLOR[area.severity] }}>
                  {SEVERITY_LABEL[area.severity]}
                </Text>
              </View>
              <Text className="flex-1 text-sm text-fg">{area.label}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="mt-2 text-sm text-fg-muted">
          Nenhum dano visível identificado nesta fotografia.
        </Text>
      )}

      <Text className="mt-3 text-xs text-fg-subtle">
        Resultado gerado por IA — verifique antes de utilizar. As marcações são aproximadas.
      </Text>
    </View>
  );
}
