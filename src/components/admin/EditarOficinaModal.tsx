'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import { ESPECIALIDADES_LABELS, EspecialidadeOficina, OficinaMecanico } from '@/types/oficina';
import { isValidYoutubeUrl } from '@/lib/utils';
import YoutubeEmbed from '@/components/ui/YoutubeEmbed';
import { useCountry } from '@/providers/CountryProvider';
import { term } from '@/lib/terms';

const MapSelector = dynamic(() => import('@/components/ui/MapSelector'), {
  ssr: false,
  loading: () => <div className="h-64 bg-neutral-100 animate-pulse rounded-xl flex items-center justify-center text-sm text-neutral-400">A carregar mapa...</div>
});

interface EditarOficinaModalProps {
  show: boolean;
  onClose: () => void;
  oficina: OficinaMecanico;
  onSave: (id: string, dados: Record<string, unknown>) => Promise<void>;
}

export default function EditarOficinaModal({ show, onClose, oficina, onSave }: EditarOficinaModalProps) {
  const { country } = useCountry();
  const [saving, setSaving] = useState(false);

  // Form State
  const [nome, setNome] = useState(oficina.nome || '');
  const [descricao, setDescricao] = useState(oficina.descricao || '');
  const [responsavel, setResponsavel] = useState(oficina.responsavel || '');
  const [telefone, setTelefone] = useState(oficina.telefone || '');
  const [whatsapp, setWhatsapp] = useState(oficina.whatsapp || '');
  const [email, setEmail] = useState(oficina.email || '');
  const [website, setWebsite] = useState(oficina.website || '');
  const [distrito, setDistrito] = useState(oficina.distrito || '');
  const [localidade, setLocalidade] = useState(oficina.localidade || '');
  const [bairro, setBairro] = useState(oficina.bairro || '');
  const [morada, setMorada] = useState(oficina.morada || '');
  const [coordenadas, setCoordenadas] = useState<{ latitude: number; longitude: number }>(
    oficina.coordenadas || { latitude: 38.7436, longitude: -9.1443 }
  );
  const [especialidades, setEspecialidades] = useState<EspecialidadeOficina[]>(oficina.especialidades || []);
  const [logoUrl, setLogoUrl] = useState(oficina.logoUrl || '');
  const [videoUrl, setVideoUrl] = useState(oficina.videoUrl || '');

  // For MapSelector initialization on show
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    if (show) {
      setNome(oficina.nome || '');
      setDescricao(oficina.descricao || '');
      setResponsavel(oficina.responsavel || '');
      setTelefone(oficina.telefone || '');
      setWhatsapp(oficina.whatsapp || '');
      setEmail(oficina.email || '');
      setWebsite(oficina.website || '');
      setDistrito(oficina.distrito || '');
      setLocalidade(oficina.localidade || '');
      setBairro(oficina.bairro || '');
      setMorada(oficina.morada || '');
      setCoordenadas(oficina.coordenadas || { latitude: 38.7436, longitude: -9.1443 });
      setEspecialidades(oficina.especialidades || []);
      setLogoUrl(oficina.logoUrl || '');
      setVideoUrl(oficina.videoUrl || '');
      setMapKey((k) => k + 1);
    }
  }, [show, oficina]);

  const handleToggleEspecialidade = (esp: EspecialidadeOficina) => {
    if (especialidades.includes(esp)) {
      setEspecialidades(especialidades.filter((e) => e !== esp));
    } else {
      setEspecialidades([...especialidades, esp]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !descricao || !responsavel || !telefone || !email || !distrito || !localidade || !morada) {
      return;
    }

    if (especialidades.length === 0) {
      return;
    }

    if (videoUrl.trim() && !isValidYoutubeUrl(videoUrl)) {
      return;
    }

    setSaving(true);
    try {
      await onSave(oficina.id, {
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
      });
      onClose();
    } catch (err) {
      console.error('[EditarOficina] Erro ao guardar:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} titulo={`Editar Oficina — ${oficina.nome}`} tamanho="md">
      <form onSubmit={handleSave} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
        {/* Informação Geral */}
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
              placeholder="Fale um pouco sobre a sua experiência, especialidades, equipamentos e serviços..."
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
              placeholder="Ex: https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
            {videoUrl.trim() && isValidYoutubeUrl(videoUrl) && (
              <YoutubeEmbed url={videoUrl} title="Pré-visualização do vídeo" className="mt-3" />
            )}
          </div>
        </div>

        {/* Especialidades */}
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

        {/* Contactos */}
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
                WhatsApp (Opcional)
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

        {/* Localização */}
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

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-neutral-100">
          <Button tipo="secundario" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" tipo="primario" carregando={saving}>
            Guardar Alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}
