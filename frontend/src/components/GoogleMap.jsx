/**
 * GoogleMap — wrapper around the Google Maps JavaScript API.
 * Renders a styled dark map with task location pins.
 *
 * Props:
 *   tasks       [{id, title, latitude, longitude, location_name}]
 *   center      {lat, lng}  — default map center
 *   zoom        number
 *   height      string      — CSS height, default '320px'
 *
 * SETUP: Replace 'YOUR_GOOGLE_MAPS_API_KEY' in index.html with your key.
 *        API requires Maps JavaScript API to be enabled in Google Cloud Console.
 */
import React, { useEffect, useRef, useState } from 'react';

const MAPS_CONFIGURED = () =>
  typeof window !== 'undefined' &&
  window.google &&
  window.google.maps;

const DARK_MAP_STYLE = [
  { elementType: 'geometry',        stylers: [{ color: '#0a0e1a' }] },
  { elementType: 'labels.text.fill',stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'road',            elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'water',           elementType: 'geometry', stylers: [{ color: '#0a0e1a' }] },
  { featureType: 'poi',             stylers: [{ visibility: 'off' }] },
];

export default function GoogleMap({
  tasks = [],
  center = { lat: 20.5937, lng: 78.9629 }, // India default
  zoom   = 5,
  height = '320px',
}) {
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markers   = useRef([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!MAPS_CONFIGURED()) { setReady(false); return; }

    mapInst.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: DARK_MAP_STYLE,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
    });
    setReady(true);
  }, []);

  // Drop markers whenever tasks change
  useEffect(() => {
    if (!mapInst.current || !MAPS_CONFIGURED()) return;

    // Clear old markers
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];

    tasks.forEach((task) => {
      if (!task.latitude || !task.longitude) return;
      const marker = new window.google.maps.Marker({
        position: { lat: task.latitude, lng: task.longitude },
        map: mapInst.current,
        title: task.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#06b6d4',
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="background:#111827;color:#f1f5f9;padding:10px 14px;border-radius:8px;font-family:Inter,sans-serif;min-width:160px;">
            <div style="font-weight:700;margin-bottom:4px">${task.title}</div>
            <div style="font-size:12px;color:#94a3b8">📍 ${task.location_name || 'Unknown'}</div>
          </div>
        `,
      });
      marker.addListener('click', () => infoWindow.open(mapInst.current, marker));
      markers.current.push(marker);
    });
  }, [tasks]);

  if (!MAPS_CONFIGURED()) {
    return (
      <div style={{
        height, borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', gap: 8,
      }}>
        <div style={{ fontSize: '2rem' }}>🗺️</div>
        <div style={{ fontSize: '0.85rem' }}>
          Google Maps requires an API key.
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Add <code>YOUR_GOOGLE_MAPS_API_KEY</code> to index.html
        </div>
        {/* Fallback: list task locations as text */}
        {tasks.filter(t => t.latitude).length > 0 && (
          <div style={{ marginTop: 12, width: '80%' }}>
            {tasks.filter(t => t.latitude).map(t => (
              <div key={t.id} style={{
                padding: '6px 10px', marginBottom: 4,
                background: 'var(--bg-glass-hover)', borderRadius: 6,
                fontSize: '0.78rem',
              }}>
                📍 {t.title} — {t.location_name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ height, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
    />
  );
}
