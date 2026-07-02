import { Text } from 'react-native';

/** Discreet reminder that form progress is auto-saved locally as a draft. */
export function DraftSavedNote() {
  return (
    <Text className="text-center text-xs text-fg-subtle">
      💾 O progresso é guardado automaticamente como rascunho apenas neste dispositivo.
    </Text>
  );
}
