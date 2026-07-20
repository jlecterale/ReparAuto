'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { CheckCircle, ArrowLeft, Wrench } from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';

const TireIcon = ({ size = 20, active = false }: { size?: number, active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: size, height: size }} className="text-current" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeDasharray="1.5,2.5" />
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <line x1="12" y1="6" x2="12" y2="8" strokeWidth="1" />
    <line x1="12" y1="16" x2="12" y2="18" strokeWidth="1" />
    <line x1="6" y1="12" x2="8" y2="12" strokeWidth="1" />
    <line x1="16" y1="12" x2="18" y2="12" strokeWidth="1" />
  </svg>
);

const TowTruckIcon = ({ size = 20, active = false }: { size?: number, active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" style={{ width: size, height: size }} className="text-current" fill="currentColor">
    <path d="M240,112H216v-8a16,16,0,0,0-16-16H152a8,8,0,0,0-8,8v16H40a16,16,0,0,0-16,16v56a16,16,0,0,0,16,16H52.4a28,28,0,0,0,55.2,0h40.8a28,28,0,0,0,55.2,0H240a16,16,0,0,0,16-16V128A16,16,0,0,0,240,112ZM160,104h40v40H160ZM80,212a12,12,0,1,1,12-12A12,12,0,0,1,80,212Zm96,0a12,12,0,1,1,12-12A12,12,0,0,1,176,212Zm64-28H217.6a27.8,27.8,0,0,0-5.2-12h-84.8v-56h64v16a8,8,0,0,0,8,8h40Z" />
  </svg>
);
import { useToast } from '@/components/ui/Toast';
import { addOficina, getAdminUsers, criarNotificacao } from '@/lib/db';
import { clearAdDraft, hasWorkshopDraftContent } from '@/lib/adDraft';
import { useAdDraft } from '@/hooks/useAdDraft';
import { ESPECIALIDADES_LABELS, EspecialidadeOficina, ServiceType } from '@/types/oficina';
import { isValidYoutubeUrl } from '@/lib/utils';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import { useCountry } from '@/providers/CountryProvider';
import { term } from '@/lib/terms';
import Button from '@/components/ui/Button';
import YoutubeEmbed from '@/components/ui/YoutubeEmbed';
import DraftResumePrompt from '@/components/ui/DraftResumePrompt';
import DraftSavedNote from '@/components/ui/DraftSavedNote';

/** Serializable snapshot persisted as the workshop draft. */
export interface OficinaFormDraft {
  nome: string;
  descricao: string;
  responsavel: string;
  telefone: string;
  whatsapp: string;
  email: string;
  website: string;
  distrito: string;
  localidade: string;
  bairro: string;
  morada: string;
  coordenadas: { latitude: number; longitude: number };
  especialidades: EspecialidadeOficina[];
  logoUrl: string;
  videoUrl: string;
  serviceType: 'workshop' | 'towing' | 'tire_repair';
  is24h: boolean;
  horarioTexto: string;
  segOpen: string;
  segClose: string;
  segClosed: boolean;
  sabOpen: string;
  sabClose: string;
  sabClosed: boolean;
  domOpen: string;
  domClose: string;
  domClosed: boolean;
  towingCapabilities: string[];
}

// Dynamically import MapSelector to prevent SSR/window errors
const MapSelector = dynamic(() => import('@/components/ui/MapSelector'), {
  ssr: false,
  loading: () => <div className="h-64 bg-neutral-100 animate-pulse rounded-xl flex items-center justify-center text-sm text-neutral-400">A carregar mapa...</div>
});

export default function RegistarOficina() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth } = useApp();
  const { user } = auth;
  const { country } = useCountry();
  const toast = useToast();
  // The profile's "Continuar rascunho" button deep-links with ?retomar=1.
  const resumeParam = searchParams.get('retomar') === '1';

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
  const [bairro, setBairro] = useState('');
  const [morada, setMorada] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ latitude: number; longitude: number }>({
    latitude: 38.7436,
    longitude: -9.1443
  });
  const [especialidades, setEspecialidades] = useState<EspecialidadeOficina[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Added service settings
  const [serviceType, setServiceType] = useState<'workshop' | 'towing' | 'tire_repair'>('workshop');
  const [is24h, setIs24h] = useState(false);
  const [horarioTexto, setHorarioTexto] = useState('');
  const [segOpen, setSegOpen] = useState('08:00');
  const [segClose, setSegClose] = useState('18:00');
  const [segClosed, setSegClosed] = useState(false);
  const [sabOpen, setSabOpen] = useState('08:00');
  const [sabClose, setSabClose] = useState('13:00');
  const [sabClosed, setSabClosed] = useState(true);
  const [domOpen, setDomOpen] = useState('08:00');
  const [domClose, setDomClose] = useState('13:00');
  const [domClosed, setDomClosed] = useState(true);
  const [towingCapabilities, setTowingCapabilities] = useState<string[]>(['light']);

  // Remounts the map when a draft restores saved coordinates.
  const [mapKey, setMapKey] = useState(0);

  const draftSnapshot = useMemo<OficinaFormDraft>(
    () => ({
      nome, descricao, responsavel, telefone, whatsapp, email, website,
      distrito, localidade, bairro, morada, coordenadas, especialidades, logoUrl, videoUrl,
      serviceType, is24h, horarioTexto, segOpen, segClose, segClosed,
      sabOpen, sabClose, sabClosed, domOpen, domClose, domClosed, towingCapabilities
    }),
    [nome, descricao, responsavel, telefone, whatsapp, email, website,
     distrito, localidade, bairro, morada, coordenadas, especialidades, logoUrl, videoUrl,
     serviceType, is24h, horarioTexto, segOpen, segClose, segClosed,
     sabOpen, sabClose, sabClosed, domOpen, domClose, domClosed, towingCapabilities],
  );

  const applyDraft = (d: OficinaFormDraft) => {
    setNome(d.nome ?? '');
    setDescricao(d.descricao ?? '');
    setResponsavel(d.responsavel ?? '');
    setTelefone(d.telefone ?? '');
    setWhatsapp(d.whatsapp ?? '');
    setEmail(d.email ?? user?.email ?? '');
    setWebsite(d.website ?? '');
    setDistrito(d.distrito ?? '');
    setLocalidade(d.localidade ?? '');
    setBairro(d.bairro ?? '');
    setMorada(d.morada ?? '');
    if (d.coordenadas) {
      setCoordenadas(d.coordenadas);
      setMapKey((k) => k + 1);
    }
    setEspecialidades(d.especialidades ?? []);
    setLogoUrl(d.logoUrl ?? '');
    setVideoUrl(d.videoUrl ?? '');
    setServiceType(d.serviceType ?? 'workshop');
    setIs24h(d.is24h ?? false);
    setHorarioTexto(d.horarioTexto ?? '');
    setSegOpen(d.segOpen ?? '08:00');
    setSegClose(d.segClose ?? '18:00');
    setSegClosed(d.segClosed ?? false);
    setSabOpen(d.sabOpen ?? '08:00');
    setSabClose(d.sabClose ?? '13:00');
    setSabClosed(d.sabClosed ?? true);
    setDomOpen(d.domOpen ?? '08:00');
    setDomClose(d.domClose ?? '13:00');
    setDomClosed(d.domClosed ?? true);
    setTowingCapabilities(d.towingCapabilities ?? ['light']);
  };

  const workshopDraft = useAdDraft<OficinaFormDraft>({
    kind: 'oficina',
    suspended: publicado || loading,
    data: draftSnapshot,
    hasContent: hasWorkshopDraftContent({ nome, descricao, responsavel, morada }, especialidades),
    resumeImmediately: resumeParam,
    onRestore: (draft) => applyDraft(draft.data),
  });

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
      const workingHours = {
        is24h,
        customText: horarioTexto.trim() || null,
        schedule: is24h ? null : {
          seg: { closed: segClosed, openTime: segClosed ? null : segOpen, closeTime: segClosed ? null : segClose },
          ter: { closed: segClosed, openTime: segClosed ? null : segOpen, closeTime: segClosed ? null : segClose },
          qua: { closed: segClosed, openTime: segClosed ? null : segOpen, closeTime: segClosed ? null : segClose },
          qui: { closed: segClosed, openTime: segClosed ? null : segOpen, closeTime: segClosed ? null : segClose },
          sex: { closed: segClosed, openTime: segClosed ? null : segOpen, closeTime: segClosed ? null : segClose },
          sab: { closed: sabClosed, openTime: sabClosed ? null : sabOpen, closeTime: sabClosed ? null : sabClose },
          dom: { closed: domClosed, openTime: domClosed ? null : domOpen, closeTime: domClosed ? null : domClose },
        }
      };

      const towingDetails = serviceType === 'towing' ? {
        capabilities: towingCapabilities
      } : null;

      const novaOficina = await addOficina({
        criador: user.email,
        criadorUid: user.uid,
        serviceType,
        nome,
        descricao,
        responsavel,
        telefone,
        whatsapp: whatsapp || null,
        email,
        website: website || null,
        distrito,
        localidade,
        bairro: country === 'BR' ? bairro.trim() || null : null,
        morada,
        coordenadas,
        especialidades,
        logoUrl: logoUrl || null,
        videoUrl: videoUrl.trim() || null,
        workingHours,
        towingDetails,
        mediaAvaliacoes: 5.0,
        totalAvaliacoes: 0,
      });

      if (user.tipoConta !== 'profissional') {
        await auth.updateProfile({ tipoConta: 'profissional' });
        await auth.refreshProfile();
      }

      clearAdDraft('oficina');
      setPublicado(true);
      toast?.sucesso('Serviço registado com sucesso! A aguardar aprovação.');

      // Notify admins
      const admins = await getAdminUsers();
      const serviceTypeName = serviceType === 'towing' ? (country === 'BR' ? 'guincho' : 'reboque') : serviceType === 'tire_repair' ? (country === 'BR' ? 'borracharia' : 'vulcanizador') : 'oficina';
      admins.forEach((admin) => {
        criarNotificacao(
          admin.uid,
          'info',
          'Novo serviço registado',
          `O serviço "${nome}" (${serviceTypeName}) foi registado e necessita de aprovação.`,
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

  const getSuccessTitle = () => {
    if (serviceType === 'towing') return country === 'BR' ? 'Guincho Registado!' : 'Reboque Registado!';
    if (serviceType === 'tire_repair') return country === 'BR' ? 'Borracharia Registada!' : 'Vulcanizador Registado!';
    return 'Oficina Registada!';
  };

  const getSuccessDesc = () => {
    if (serviceType === 'towing') return country === 'BR' ? 'Obrigado por registar o seu serviço de guincho.' : 'Obrigado por registar o seu serviço de reboque.';
    if (serviceType === 'tire_repair') return country === 'BR' ? 'Obrigado por registar a sua borracharia.' : 'Obrigado por registar o seu vulcanizador.';
    return 'Obrigado por registar a sua oficina.';
  };

  const getDirectoryName = () => {
    if (serviceType === 'towing') return country === 'BR' ? 'diretório de Guinchos' : 'diretório de Reboques';
    if (serviceType === 'tire_repair') return country === 'BR' ? 'diretório de Borracharias' : 'diretório de Vulcanizadores';
    return 'diretório de Oficinas & Mecânicos';
  };

  const getRedirectPath = () => {
    if (serviceType === 'towing') return '/guinchos';
    if (serviceType === 'tire_repair') return '/borracharias';
    return '/oficinas';
  };

  if (publicado) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-3xl shadow-xl p-6 sm:p-10 page-enter text-center">
        <CheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h3 className="text-2xl font-black text-fg-strong">{getSuccessTitle()}</h3>
        <p className="text-fg-subtle text-sm mt-3 leading-relaxed max-w-md mx-auto">
          {getSuccessDesc()} O seu perfil foi enviado para revisão e está <strong>pendente de aprovação</strong> pela administração.
        </p>
        <p className="text-fg-subtle text-xs mt-2">
          Assim que for aprovada, ficará visível publicamente no {getDirectoryName()}.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Button
            tipo="primario"
            onClick={() => router.push(getRedirectPath())}
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
        <h2 className="text-2xl font-black text-fg-strong tracking-tight">
          {serviceType === 'towing'
            ? (country === 'BR' ? 'Registar Guincho' : 'Registar Reboque')
            : serviceType === 'tire_repair'
            ? (country === 'BR' ? 'Registar Borracharia' : 'Registar Vulcanizador')
            : 'Registar Oficina / Mecânico'}
        </h2>
        <p className="text-fg-subtle text-sm mt-1">
          {serviceType === 'towing'
            ? 'Registe o seu serviço de reboque e pronto-socorro para automóveis.'
            : serviceType === 'tire_repair'
            ? 'Registe a sua borracharia ou oficina de pneus.'
            : 'Crie o seu perfil profissional focado no mundo automóvel.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Service Type Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-fg-subtle uppercase tracking-wider">
              {term('selectServiceType', country)} <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setServiceType('workshop')}
                className={`flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                  serviceType === 'workshop'
                    ? 'border-blue-500 bg-blue-50/20 shadow-sm shadow-blue-500/10'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  serviceType === 'workshop' ? 'bg-blue-500 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  <Wrench size={20} weight={serviceType === 'workshop' ? 'fill' : 'bold'} />
                </div>
                <span className="font-extrabold text-sm text-neutral-800">Oficina Mecânica</span>
                <span className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Reparos, revisões periódicas, mecânica geral, elétrica e manutenção preventiva.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setServiceType('tire_repair')}
                className={`flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                  serviceType === 'tire_repair'
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-sm shadow-emerald-500/10'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  serviceType === 'tire_repair' ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  <TireIcon size={20} active={serviceType === 'tire_repair'} />
                </div>
                <span className="font-extrabold text-sm text-neutral-800">
                  {country === 'BR' ? 'Borracharia / Pneus' : 'Vulcanizador / Pneus'}
                </span>
                <span className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Troca e reparação de pneus, alinhamento, balanceamento e vulcanização.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setServiceType('towing')}
                className={`flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                  serviceType === 'towing'
                    ? 'border-orange-500 bg-orange-50/20 shadow-sm shadow-orange-500/10'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  serviceType === 'towing' ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  <TowTruckIcon size={20} active={serviceType === 'towing'} />
                </div>
                <span className="font-extrabold text-sm text-neutral-800">
                  {country === 'BR' ? 'Guincho / Reboque' : 'Reboque / Pronto-Socorro'}
                </span>
                <span className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Serviços de reboque, auto-socorro 24h e transporte de veículos avariados.
                </span>
              </button>
            </div>
          </div>

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

          {/* Specialties / Towing Capabilities */}
          {serviceType === 'towing' ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-fg-subtle uppercase tracking-wider border-b border-neutral-100 pb-2">
                Tipos de Veículos Suportados <span className="text-danger-500">*</span>
              </h3>
              <p className="text-xs text-fg-subtle">Selecione quais os tipos de veículos que o seu guincho/reboque tem capacidade para transportar.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'light', label: country === 'BR' ? 'Veículos Leves (Passeio)' : 'Veículos Ligeiros' },
                  { value: 'heavy', label: 'Veículos Pesados (Carga)' },
                  { value: 'motorcycle', label: country === 'BR' ? 'Motocicletas / Motos' : 'Motociclos / Motos' },
                  { value: 'classic', label: 'Veículos Clássicos (Plataforma Fechada)' },
                  { value: 'agricultural', label: 'Veículos Agrícolas / Especiais' },
                ].map((cap) => {
                  const isSelected = towingCapabilities.includes(cap.value);
                  const handleToggleCap = () => {
                    if (isSelected) {
                      setTowingCapabilities(towingCapabilities.filter((c) => c !== cap.value));
                    } else {
                      setTowingCapabilities([...towingCapabilities, cap.value]);
                    }
                  };
                  return (
                    <button
                      key={cap.value}
                      type="button"
                      onClick={handleToggleCap}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left font-medium transition cursor-pointer ${
                        isSelected
                          ? 'border-accent bg-accent/5 text-accent border-2'
                          : 'border-neutral-200 hover:border-neutral-400 text-fg-strong bg-white'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-accent bg-accent' : 'border-neutral-300 bg-white'}`}>
                        {isSelected && <span className="text-[10px] text-white">✓</span>}
                      </div>
                      {cap.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
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
                          ? 'border-accent bg-accent/5 text-accent border-2'
                          : 'border-neutral-200 hover:border-neutral-400 text-fg-strong bg-white'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-accent bg-accent' : 'border-neutral-300 bg-white'}`}>
                        {isSelected && <span className="text-[10px] text-white">✓</span>}
                      </div>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-fg-subtle uppercase tracking-wider border-b border-neutral-100 pb-2">
              Contactos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">
                  {term('phoneLabel', country)} <span className="text-danger-500">*</span>
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

          {/* Operating Hours */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-fg-subtle uppercase tracking-wider border-b border-neutral-100 pb-2">
              Horário de Funcionamento
            </h3>
            
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <input
                type="checkbox"
                id="is24h"
                checked={is24h}
                onChange={(e) => setIs24h(e.target.checked)}
                className="w-4 h-4 text-accent border-neutral-300 rounded focus:ring-accent"
              />
              <label htmlFor="is24h" className="text-sm font-bold text-fg-strong cursor-pointer select-none">
                🚨 {country === 'BR' ? 'Serviço de Emergência 24 Horas (Disponibilidade Total)' : 'Serviço de Emergência 24 Horas'}
              </label>
            </div>

            {!is24h && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Horário de Segunda a Sexta */}
                  <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-fg">Segunda a Sexta-feira</span>
                      <label className="flex items-center gap-1.5 text-xs text-fg-subtle cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={segClosed}
                          onChange={(e) => setSegClosed(e.target.checked)}
                          className="rounded border-neutral-300 text-accent focus:ring-accent"
                        />
                        Fechado
                      </label>
                    </div>
                    {!segClosed && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={segOpen}
                          onChange={(e) => setSegOpen(e.target.value)}
                          className="bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full"
                        />
                        <span className="text-xs text-neutral-400">às</span>
                        <input
                          type="time"
                          value={segClose}
                          onChange={(e) => setSegClose(e.target.value)}
                          className="bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Horário de Sábado */}
                  <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-fg">Sábado</span>
                      <label className="flex items-center gap-1.5 text-xs text-fg-subtle cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={sabClosed}
                          onChange={(e) => setSabClosed(e.target.checked)}
                          className="rounded border-neutral-300 text-accent focus:ring-accent"
                        />
                        Fechado
                      </label>
                    </div>
                    {!sabClosed && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={sabOpen}
                          onChange={(e) => setSabOpen(e.target.value)}
                          className="bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full"
                        />
                        <span className="text-xs text-neutral-400">às</span>
                        <input
                          type="time"
                          value={sabClose}
                          onChange={(e) => setSabClose(e.target.value)}
                          className="bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Horário de Domingo */}
                  <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-fg">Domingo</span>
                      <label className="flex items-center gap-1.5 text-xs text-fg-subtle cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={domClosed}
                          onChange={(e) => setDomClosed(e.target.checked)}
                          className="rounded border-neutral-300 text-accent focus:ring-accent"
                        />
                        Fechado
                      </label>
                    </div>
                    {!domClosed && (
                      <div className="flex items-center gap-2 max-w-sm">
                        <input
                          type="time"
                          value={domOpen}
                          onChange={(e) => setDomOpen(e.target.value)}
                          className="bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full"
                        />
                        <span className="text-xs text-neutral-400">às</span>
                        <input
                          type="time"
                          value={domClose}
                          onChange={(e) => setDomClose(e.target.value)}
                          className="bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Horário Texto Adicional */}
                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">
                    Observações de Horário (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Fechado para almoço das 12h às 13:30h"
                    value={horarioTexto}
                    onChange={(e) => setHorarioTexto(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                </div>
              </div>
            )}
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
                setBairro('');
              }}
              obrigatorio={true}
            />

            {country === 'BR' && (
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">Bairro (opcional)</label>
                <input
                  type="text"
                  autoComplete="address-level3"
                  placeholder="Ex: Bela Vista"
                  maxLength={60}
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-fg mb-1.5">
                {term('addressLabel', country)} (Rua, Número) <span className="text-danger-500">*</span>
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
                key={mapKey}
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
            <DraftSavedNote className="mb-3" />
            <Button
              type="submit"
              tipo="primario"
              carregando={loading}
              className="w-full justify-center py-3.5 font-bold shadow-lg"
            >
              {serviceType === 'towing'
                ? (country === 'BR' ? 'Registar Guincho' : 'Registar Reboque')
                : serviceType === 'tire_repair'
                ? (country === 'BR' ? 'Registar Borracharia' : 'Registar Vulcanizador')
                : 'Registar Oficina'}
            </Button>
          </div>
        </form>
      </div>

      {workshopDraft.prompt && (
        <DraftResumePrompt
          itemLabel={
            serviceType === 'towing'
              ? (country === 'BR' ? 'um registo de guincho' : 'um registo de reboque')
              : serviceType === 'tire_repair'
              ? (country === 'BR' ? 'um registo de borracharia' : 'um registo de vulcanizador')
              : 'um registo de oficina'
          }
          savedAt={workshopDraft.prompt.savedAt}
          onDiscard={workshopDraft.discard}
          onResume={workshopDraft.resume}
        />
      )}
    </div>
  );
}
