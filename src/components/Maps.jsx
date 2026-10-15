import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const pin = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#C23A2E;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});
const DELHI_NCR = [28.58, 77.25];
const tiles = (
  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
);

function ClickToSet({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
}

// Tap the map to drop the rescue pin
export function MapPicker({ lat, lng, onChange, height = 260 }) {
  const has = lat !== null && lat !== undefined && lat !== '' && lng !== null && lng !== '';
  return (
    <div>
      <MapContainer center={has ? [lat, lng] : DELHI_NCR} zoom={has ? 14 : 10} style={{ height }} scrollWheelZoom={false}>
        {tiles}
        <ClickToSet onPick={({ lat, lng }) => onChange({ latitude: +lat.toFixed(6), longitude: +lng.toFixed(6) })} />
        {has && <Marker position={[lat, lng]} icon={pin} />}
      </MapContainer>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-400">
        <span>{has ? `Pinned at ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : 'Tap the map to pin the exact spot.'}</span>
        {navigator.geolocation && (
          <button
            type="button"
            className="font-semibold text-ink underline"
            onClick={() =>
              navigator.geolocation.getCurrentPosition((p) =>
                onChange({ latitude: +p.coords.latitude.toFixed(6), longitude: +p.coords.longitude.toFixed(6) })
              )
            }
          >
            Use my location
          </button>
        )}
        {has && (
          <button type="button" className="underline" onClick={() => onChange({ latitude: null, longitude: null })}>
            Clear pin
          </button>
        )}
      </div>
    </div>
  );
}

// Hotspot map: one circle per area, sized by number of rescues
export function HotspotMap({ rescues, height = 380 }) {
  const pts = rescues.filter((r) => r.latitude && r.longitude);
  const groups = {};
  for (const r of pts) {
    const key = `${r.latitude.toFixed(2)},${r.longitude.toFixed(2)}`;
    groups[key] = groups[key] || { lat: r.latitude, lng: r.longitude, count: 0, areas: new Set() };
    groups[key].count++;
    if (r.area) groups[key].areas.add(r.area);
  }
  const list = Object.values(groups);
  const center = list.length ? [list[0].lat, list[0].lng] : DELHI_NCR;
  return (
    <MapContainer center={center} zoom={list.length ? 11 : 10} style={{ height }} scrollWheelZoom={false}>
      {tiles}
      {list.map((g, i) => (
        <CircleMarker key={i} center={[g.lat, g.lng]} radius={8 + Math.min(g.count * 4, 30)} pathOptions={{ color: '#C23A2E', fillColor: '#C23A2E', fillOpacity: 0.35, weight: 1 }}>
          <Tooltip>{`${g.count} rescue${g.count > 1 ? 's' : ''}${g.areas.size ? ` · ${[...g.areas].join(', ')}` : ''}`}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
