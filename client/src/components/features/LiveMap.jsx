import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { DetailPanel } from '../ui/DetailPanel';
import Button from '../ui/Button';
import { useI18n } from '../../context/I18nContext';

const elderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LiveMap({ elderId, multiElder = false }) {
  const { t } = useI18n();
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [allLocations, setAllLocations] = useState([]);

  const load = async () => {
    if (multiElder) {
      const { data } = await api.get('/features/gps');
      setAllLocations(data);
      return;
    }
    if (!elderId) return;
    const { data } = await api.get(`/features/gps/${elderId}`);
    setLatest(data.latest);
    setHistory(data.history || []);
  };

  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [elderId, multiElder]);

  const shareLocation = () => {
    if (!navigator.geolocation || !elderId) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await api.post(`/features/gps/${elderId}`, {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      load();
    });
  };

  const defaultCenter = [13.0827, 80.2707];
  const center = latest ? [parseFloat(latest.latitude), parseFloat(latest.longitude)] : defaultCenter;
  const path = history.map(h => [parseFloat(h.latitude), parseFloat(h.longitude)]);

  return (
    <DetailPanel title={t('liveGpsMap')} icon="📍" subtitle={t('trackLocation')}>
      {!multiElder && elderId && (
        <Button variant="elder" size="sm" className="mb-3" onClick={shareLocation}>📍 {t('shareMyLocation')}</Button>
      )}
      <div className="h-72 rounded-xl overflow-hidden border border-slate-200 z-0">
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          {multiElder ? allLocations.map((loc) => (
            <Marker key={loc.elder_id} position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]} icon={elderIcon}>
              <Popup>{loc.name || `Elder ${loc.elder_id}`}<br />{new Date(loc.recorded_at).toLocaleString()}</Popup>
            </Marker>
          )) : (
            <>
              {latest && (
                <Marker position={center} icon={elderIcon}>
                  <Popup>{t('currentLocation')}<br />{new Date(latest.recorded_at).toLocaleString()}</Popup>
                </Marker>
              )}
              {path.length > 1 && <Polyline positions={path} color="#10b981" weight={3} />}
            </>
          )}
        </MapContainer>
      </div>
      {latest && !multiElder && (
        <p className="text-xs text-slate-500 mt-2">
          Lat: {latest.latitude}, Lng: {latest.longitude} · ±{latest.accuracy_m || '?'}m
        </p>
      )}
    </DetailPanel>
  );
}
