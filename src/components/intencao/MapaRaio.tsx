'use client';

import { useEffect, useRef } from 'react';
import { getCentroDistrito, CENTRO_PORTUGAL } from '@/lib/geo';
import 'leaflet/dist/leaflet.css';

interface MapaRaioProps {
  distrito: string;
  raio: number;
  onChange: (field: string, value: any) => void;
}

export default function MapaRaio({ distrito, raio, onChange }: MapaRaioProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let L: any;
    let map: any;

    async function init() {
      L = await import('leaflet');

      if (!mapRef.current || mapInstance.current) return;

      const centro = distrito && distrito !== 'todo_portugal'
        ? getCentroDistrito(distrito)
        : undefined;

      const center = centro || CENTRO_PORTUGAL;
      const zoom = centro ? 10 : 7;

      map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      mapInstance.current = map;
      atualizarMapa(map, L, distrito, raio, true);
    }

    init();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    import('leaflet').then((L) => {
      atualizarMapa(mapInstance.current, L, distrito, raio, true);
    });
  }, [distrito]);

  useEffect(() => {
    if (!mapInstance.current) return;
    import('leaflet').then((L) => {
      atualizarMapa(mapInstance.current, L, distrito, raio, false);
    });
  }, [raio]);

  function atualizarMapa(map: any, L: any, d: string, r: number, resetView: boolean) {
    const centro = d && d !== 'todo_portugal' ? getCentroDistrito(d) : undefined;
    const center = centro || CENTRO_PORTUGAL;

    if (resetView) {
      map.setView([center.lat, center.lng], centro ? 10 : 7);

      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }

      if (d && d !== 'todo_portugal') {
        markerRef.current = L.marker([center.lat, center.lng], {
          icon: L.divIcon({
            className: '',
            html: '<div style="width:14px;height:14px;background:#e11d48;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.35)"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          }),
        }).addTo(map);
      }
    }

    if (d && d !== 'todo_portugal') {
      if (circleRef.current) {
        circleRef.current.setRadius(r * 1000);
      } else if (r > 0) {
        circleRef.current = L.circle([center.lat, center.lng], {
          radius: r * 1000,
          color: '#e11d48',
          fillColor: '#e11d48',
          fillOpacity: 0.1,
          weight: 2,
        }).addTo(map);
      }

      if (resetView && r > 0 && circleRef.current) {
        map.fitBounds(circleRef.current.getBounds().pad(0.2));
      }
    }
  }

  return (
    <div className="space-y-3">
      <div
        ref={mapRef}
        className="w-full h-64 rounded-xl border border-slate-300 overflow-hidden z-0"
        style={{ background: '#f1f5f9' }}
      />

      <div className="flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={200}
          step={10}
          value={raio}
          onChange={(e) => onChange('criterios.localizacao.raio', Number(e.target.value))}
          disabled={!distrito || distrito === 'todo_portugal'}
          className="flex-1 accent-accent cursor-pointer"
        />
        <span className="text-xs font-bold text-accent whitespace-nowrap min-w-[50px] text-right">
          {distrito && distrito !== 'todo_portugal' ? `${raio} km` : '—'}
        </span>
      </div>
    </div>
  );
}
