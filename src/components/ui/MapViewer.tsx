'use client';

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
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

interface MapViewerProps {
  lat: number;
  lng: number;
}

export default function MapViewer({ lat, lng }: MapViewerProps) {
  const position: [number, number] = [lat, lng];

  return (
    <div className="h-64 w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <MapContainer
        center={position}
        zoom={14}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markerIcon && <Marker position={position} icon={markerIcon} />}
      </MapContainer>
    </div>
  );
}
