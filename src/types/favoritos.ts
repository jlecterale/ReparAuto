export interface FavoritosContextValue {
  favoritos: string[];
  toggleFavorito: (id: string | number) => void;
  isFavorito: (id: string | number) => boolean;
  count: number;
}
