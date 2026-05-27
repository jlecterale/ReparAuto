import { renderFoto } from '@/lib/utils';

export default function FotoRender({ foto, classes }: { foto: string; classes?: string }) {
  const data = renderFoto(foto, classes);
  if (data.type === 'img') return <img src={data.src} className={data.classes} alt="Foto do anúncio" />;
  return <div className="w-full h-full flex items-center justify-center text-5xl">{data.emoji}</div>;
}
