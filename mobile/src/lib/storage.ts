import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITOS_KEY = 'favs_reparauto';

export async function carregarFavoritosLocal(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITOS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function salvarFavoritosLocal(lista: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITOS_KEY, JSON.stringify(lista));
  } catch {
    // best-effort; ignore storage failures.
  }
}
