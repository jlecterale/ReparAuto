export interface FavoritosContextValue {
  favoritos: string[];
  toggleFavorito: (id: string | number, colecao?: string) => void;
  isFavorito: (id: string | number) => boolean;
  count: number;
  selectFavoritos: (colecao: string) => string[];
}
