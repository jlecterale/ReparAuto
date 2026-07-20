'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Phone, WhatsappLogo, MapPin, Star, ArrowRight } from '@phosphor-icons/react';
import type { OficinaMecanico, ServiceType, WorkingHours } from '@/types/oficina';
import type { Country } from '@/lib/country';
import { getStatusFuncionamento, type StatusInfo } from '@/lib/hours';

// Fixed SVGs for marker icons
const wrenchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="w-4 h-4 text-white" fill="currentColor"><path d="M227.31,73.37,182.63,28.69a16,16,0,0,0-22.63,0L130.34,58.35a16,16,0,0,0,0,22.63l13.66,13.65L77.37,161.27a39.81,39.81,0,0,0-24-9.92,16,16,0,0,0-15.65,20.31l18.52,55.57a16,16,0,0,0,20.31,10.31L132.13,219a16,16,0,0,0-9.92-24L161.27,156l13.65,13.66a16,16,0,0,0,22.63,0l29.76-29.76A16,16,0,0,0,227.31,73.37ZM81.65,224H48V190.35l21.2-21.2a24.16,24.16,0,0,1,16.59-6.84c.32,0,.64,0,1,0a40,40,0,0,0,44.09,44.09c0,.33,0,.65,0,1a24.16,24.16,0,0,1-6.84,16.59ZM216,128,186.24,157.76l-57.82-57.82L158.18,70.18l45.26,45.26A8,8,0,0,1,216,128Z"/></svg>`;

const tireSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="w-4 h-4 text-white" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm0-136a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"/></svg>`;

const towTruckSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="w-4 h-4 text-white" fill="currentColor"><path d="M240,112H216v-8a16,16,0,0,0-16-16H152a8,8,0,0,0-8,8v16H40a16,16,0,0,0-16,16v56a16,16,0,0,0,16,16H52.4a28,28,0,0,0,55.2,0h40.8a28,28,0,0,0,55.2,0H240a16,16,0,0,0,16-16V128A16,16,0,0,0,240,112ZM160,104h40v40H160ZM80,212a12,12,0,1,1,12-12A12,12,0,0,1,80,212Zm96,0a12,12,0,1,1,12-12A12,12,0,0,1,176,212Zm64-28H217.6a27.8,27.8,0,0,0-5.2-12h-84.8v-56h64v16a8,8,0,0,0,8,8h40Z"/></svg>`;

export function getCustomIcon(type: ServiceType) {
  let bgColor = 'bg-blue-600';
  let svg = wrenchSvg;
  if (type === 'towing') {
    bgColor = 'bg-orange-500';
    svg = towTruckSvg;
  } else if (type === 'tire_repair') {
    bgColor = 'bg-emerald-600';
    svg = tireSvg;
  }

  return L.divIcon({
    html: `<div class="flex items-center justify-center w-8 h-8 rounded-full ${bgColor} text-white shadow-md border-2 border-white transform transition-transform hover:scale-110">${svg}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

interface MapServicosProps {
  servicos: OficinaMecanico[];
  country: Country;
}

export default function MapServicos({ servicos, country }: MapServicosProps) {
  // Center map on average coords or defaults (Lisbon/São Paulo)
  const validCoords = servicos.filter(s => s.coordenadas?.latitude && s.coordenadas?.longitude);
  
  const center: [number, number] = useMemo(() => {
    if (validCoords.length > 0) {
      const avgLat = validCoords.reduce((acc, s) => acc + s.coordenadas!.latitude, 0) / validCoords.length;
      const avgLng = validCoords.reduce((acc, s) => acc + s.coordenadas!.longitude, 0) / validCoords.length;
      return [avgLat, avgLng];
    }
    // Fallbacks
    return country === 'BR' ? [-23.55052, -46.633308] : [38.7436, -9.1443];
  }, [validCoords, country]);

  return (
    <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-neutral-200 shadow-md">
      <MapContainer
        center={center}
        zoom={validCoords.length > 1 ? 11 : 13}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validCoords.map((servico) => {
          const pos: [number, number] = [servico.coordenadas!.latitude, servico.coordenadas!.longitude];
          const serviceType = servico.serviceType || 'workshop';
          const icon = getCustomIcon(serviceType);
          const hoursInfo = getStatusFuncionamento(servico.workingHours);

          const getDetailsPath = () => {
            if (serviceType === 'towing') return `/guinchos/detalhes/${servico.id}`;
            if (serviceType === 'tire_repair') return `/borracharias/detalhes/${servico.id}`;
            return `/oficinas/detalhes/${servico.id}`;
          };

          return (
            <Marker key={servico.id} position={pos} icon={icon}>
              <Popup className="custom-leaflet-popup">
                <div className="p-1 min-w-[220px]">
                  <h4 className="font-bold text-sm text-neutral-800 leading-tight mb-1">{servico.nome}</h4>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2 text-xs text-neutral-500">
                    <Star weight="fill" className="text-amber-500" size={13} />
                    <span className="font-bold text-neutral-700">
                      {servico.mediaAvaliacoes ? servico.mediaAvaliacoes.toFixed(1) : '5.0'}
                    </span>
                    <span>({servico.totalAvaliacoes || 0} avaliações)</span>
                  </div>

                  {/* Status & Hours */}
                  <div className="mb-3">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${hoursInfo.colorClass}`}>
                      {hoursInfo.label}
                    </span>
                    {servico.workingHours?.customText && (
                      <p className="text-[10px] text-neutral-500 mt-1 italic leading-tight">
                        {servico.workingHours.customText}
                      </p>
                    )}
                  </div>

                  {/* Location info */}
                  <div className="flex items-start gap-1 mb-3 text-xs text-neutral-600 leading-normal">
                    <MapPin size={13} className="mt-0.5 text-neutral-400 shrink-0" />
                    <span>{[servico.bairro, servico.localidade].filter(Boolean).join(', ')}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100">
                    <div className="grid grid-cols-2 gap-1.5">
                      <a
                        href={`tel:${servico.telefone}`}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold text-center transition"
                      >
                        <Phone size={13} /> Ligar
                      </a>
                      {servico.whatsapp && (
                        <a
                          href={`https://wa.me/${servico.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener"
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold text-center transition"
                        >
                          <WhatsappLogo size={13} /> WhatsApp
                        </a>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1.5">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${pos[0]},${pos[1]}`}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-[10px] font-bold text-center transition"
                      >
                        Como chegar
                      </a>
                      <a
                        href={getDetailsPath()}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-900 text-white text-[10px] font-bold text-center transition"
                      >
                        Ver Perfil <ArrowRight size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
