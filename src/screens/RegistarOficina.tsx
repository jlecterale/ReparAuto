'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { CheckCircle, ArrowLeft } from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { addOficina, getAdminUsers, criarNotificacao } from '@/lib/db';
import { ESPECIALIDADES_LABELS, EspecialidadeOficina } from '@/types/oficina';
import { isValidYoutubeUrl } from '@/lib/utils';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import Button from '@/components/ui/Button';
import YoutubeEmbed from '@/components/ui/YoutubeEmbed';

// Dynamically import MapSelector to prevent SSR/window errors
const MapSelector = dynamic(() => import('@/components/ui/MapSelector'), {
  ssr: false,
  loading: () => <div className="h-64 bg-neutral-100 animate-pulse rounded-xl flex items-center justify-center text-sm text-neutral-400">A carregar mapa...</div>
});

export default function RegistarOficina() {
  const router = useRouter();
  const { auth } = useApp();
  const { user } = auth;
  const toast = useToast();

  const [publicado, setPublicado] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [website, setWebsite] = useState('');
  const [distrito, setDistrito] = useState('');
  const [localidade, setLocalidade] = useState('');
  const [morada, setMorada] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ latitude: number; longitude: number }>({
    latitude: 38.7436,
    longitude: -9.1443
  });
  const [especialidades, setEspecialidades] = useState<EspecialidadeOficina[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const handleToggleEspecialidade = (esp: EspecialidadeOficina) => {
    if (especialidades.includes(esp)) {
      setEspecialidades(especialidades.filter((e) => e !== esp));
    } else {
      setEspecialidades([...especialidades, esp]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast?.erro('Faça login para registar uma oficina.');
      router.push('/perfil');
      return;
    }

    if (!nome || !descricao || !responsavel || !telefone || !email || !distrito || !localidade || !morada) {
      toast?.erro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (especialidades.length === 0) {
      toast?.erro('Por favor, selecione pelo menos uma especialidade.');
      return;
    }

    if (videoUrl.trim() && !isValidYoutubeUrl(videoUrl)) {
      toast?.erro('O link do vídeo do YouTube é inválido. Cole o endereço completo do vídeo.');
      return;
    }

    setLoading(true);

    try {
      const novaOficina = await addOficina({
        criador: user.email,
        nome,
        descricao,
        responsavel,
        telefone,
        whatsapp: whatsapp || null,
        email,
        website: website || null,
        distrito,
        localidade,
        morada,
        coordenadas,
        especialidades,
        logoUrl: logoUrl || null,
        videoUrl: videoUrl.trim() || null,
        mediaAvaliacoes: 5.0,
        totalAvaliacoes: 0,
      });

      setPublicado(true);
      toast?.sucesso('Oficina registada com sucesso! A aguardar aprovação.');

      // Notify admins
      const admins = await getAdminUsers();
      admins.forEach((admin) => {
        criarNotificacao(
          admin.uid,
          'info',
          'Nova oficina registada',
          `A oficina "${nome}" foi registada e necessita de aprovação.`,
          `/admin`
        );
      });
    } catch (err) {
      console.error('[RegistarOficina] Erro:', err);
      toast?.erro('Erro ao registar oficina. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (publicado) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-3xl shadow-xl p-6 sm:p-10 page-enter text-center">
        <CheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h3 className="text-2xl font-black text-fg-strong">Oficina Registada!</h3>
        <p className="text-fg-subtle text-sm mt-3 leading-relaxed max-w-md mx-auto">
          Obrigado por registar a sua oficina. O seu perfil foi enviado para revisão e está <strong>pendente de aprovação</strong> pela administração.
        </p>
        <p className="text-fg-subtle text-xs mt-2">
          Assim que for aprovada, ficará visível publicamente no diretório de Oficinas & Mecânicos.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Button
            tipo="primario"
            onClick={() => router.push('/oficinas')}
          >
            Ir para o Diretório
          </Button>
          <Button
            tipo="secundario"
            onClick={() => {
              setPublicado(false);
              setNome('');
              setDescricao('');
              setResponsavel('');
              setTelefone('');
              setWhatsapp('');
              setWebsite('');
              setDistrito('');
              setLocalidade('');
              setMorada('');
              setEspecialidades([]);
              setLogoUrl('');
              setVideoUrl('');
            }}
          >
            Registar outra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 page-enter">
      {/* Back button */}
      <button
        onClick={() => router.push('/oficinas')}
        className="flex items-center gap-2 text-sm font-semibold text-fg-subtle hover:text-fg transition mb-6 cursor-pointer"
      >
        <ArrowLeft size={16} /> Voltar para o Diretório
      </button>

      <div className="bg-white border border-neutral-200 rounded-3xl shadow-xl p-6 sm:p-10">
        <h2 className="text-2xl font-black text-fg-strong tracking-tight">Registar Oficina / Mecânico</h2>
        <p className="text-fg-subtle text-sm mt-1">Crie o seu perfil profissional focado no mundo automóvel.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-fg-subtle uppercase tracking-wider border-b border-neutral-100 pb-2">
              Informação Geral
            </h3>
            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">
                Nome da Oficina ou Nome Profissional <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Recar Garage, J. Silva Mecânica..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">
                Descrição dos Serviços <span className="text-danger-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Fale um pouco sobre a sua experiência, especialidades, equipamentos e serviços que presta..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">
                Responsável técnico/oficina <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Filipe Antunes"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">
                URL do Logótipo (Opcional)
              </label>
              <input
                type="url"
                placeholder="Ex: https://exemplo.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">
                Vídeo do YouTube (Opcional)
              </label>
              <input
                type="url"
                inputMode="url"
                placeholder="Ex: https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
              <p className="text-xs text-fg-subtle mt-1.5">Apresente a sua oficina, instalações ou trabalhos num vídeo para gerar mais confiança.</p>
              {videoUrl.trim() && isValidYoutubeUrl(videoUrl) && (
                <YoutubeEmbed url={videoUrl} title="Pré-visualização do vídeo" className="mt-3" />
              )}
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-fg-subtle uppercase tracking-wider border-b border-neutral-100 pb-2">
              Especialidades Automóveis <span className="text-danger-500">*</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(ESPECIALIDADES_LABELS).map(([value, label]) => {
                const esp = value as EspecialidadeOficina;
                const isSelected = especialidades.includes(esp);
                return (
                  <button
                    key={esp}
                    type="button"
                    onClick={() => handleToggleEspecialidade(esp)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left font-medium transition cursor-pointer ${
                      isSelected
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-neutral-200 hover:border-neutral-400 text-fg-strong'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-accent bg-accent' : 'border-neutral-300'}`}>
                      {isSelected && <span className="text-[10px] text-white">✓</span>}
                    </div>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-fg-subtle uppercase tracking-wider border-b border-neutral-100 pb-2">
              Contactos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">
                  Telefone <span className="text-danger-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 912345678"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">
                  WhatsApp (Opcional, com indicativo ex: 351912345678)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 351912345678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">
                  Email de Contacto <span className="text-danger-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: oficina@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">
                  Website / Rede Social (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="Ex: https://facebook.com/minhaoficina"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Localization */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-fg-subtle uppercase tracking-wider border-b border-neutral-100 pb-2">
              Localização & Mapa
            </h3>
            
            <SeletorLocalizacao
              distrito={distrito}
              concelho={localidade}
              onChange={(dist, conc) => {
                setDistrito(dist);
                setLocalidade(conc);
              }}
              obrigatorio={true}
            />

            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">
                Morada Completa (Rua, Número) <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Rua do Comércio, nº 12"
                value={morada}
                onChange={(e) => setMorada(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>

            {/* Map Picker wrapper */}
            <div>
              <label className="block text-xs font-bold text-fg mb-2">
                Localização Geográfica (Coordenadas)
              </label>
              <MapSelector
                initialLat={coordenadas.latitude}
                initialLng={coordenadas.longitude}
                onChange={(lat, lng) => setCoordenadas({ latitude: lat, longitude: lng })}
              />
              <div className="flex gap-4 mt-2 text-xs text-fg-subtle">
                <span>Lat: {coordenadas.latitude.toFixed(6)}</span>
                <span>Lng: {coordenadas.longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              tipo="primario"
              carregando={loading}
              className="w-full justify-center py-3.5 font-bold shadow-lg"
            >
              Registar Oficina
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
