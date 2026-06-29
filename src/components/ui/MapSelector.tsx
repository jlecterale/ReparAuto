'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
const markerIcon = typeof window !== 'undefined' ? new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
}) : undefined;

interface MapSelectorProps {
  initialLat?: number;
  initialLng?: number;
  onChange: (lat: number, lng: number) => void;
}

function MapEventsHandler({ onChange, setPosition }: { onChange: (lat: number, lng: number) => void; setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onChange(lat, lng);
    },
  });
  return null;
}

export default function MapSelector({ initialLat = 38.7436, initialLng = -9.1443, onChange }: MapSelectorProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);

  useEffect(() => {
    setPosition([initialLat, initialLng]);
  }, [initialLat, initialLng]);

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-neutral-300">
      <MapContainer
        center={position}
        zoom={12}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventsHandler onChange={onChange} setPosition={setPosition} />
        {markerIcon && <Marker position={position} icon={markerIcon} />}
      </MapContainer>
      <p className="text-[11px] text-fg-subtle mt-1 px-1">
        Clique no mapa para ajustar a localização exata da oficina.
      </p>
    </div>
  );
}
