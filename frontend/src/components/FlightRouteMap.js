import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { API_BASE, getToken } from '../services/api';

// Fix the default leaflet icon paths (otherwise webpack mangles them)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function valid(n) { return typeof n === 'number' && !Number.isNaN(n); }

function centerOf(payload) {
  const pts = [];
  (payload?.depots || []).forEach((d) => valid(d.lat) && valid(d.lng) && pts.push([d.lat, d.lng]));
  (payload?.vertiports || []).forEach((v) => valid(v.lat) && valid(v.lng) && pts.push([v.lat, v.lng]));
  if (!pts.length) return [39.8283, -98.5795]; // continental US fallback
  const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [lat, lng];
}

export default function FlightRouteMap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/custom-views/flight-routes`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  if (err)   return <div style={{ padding: 16, color: '#dc2626' }}>Map error: {err}</div>;
  if (!data) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading flight routes…</div>;

  const center = centerOf(data);
  const corridorLines = (data.corridors || []).filter(
    (c) => valid(c.start_lat) && valid(c.start_lng) && valid(c.end_lat) && valid(c.end_lng),
  );

  return (
    <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>Flight Route Map</h3>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          {corridorLines.length} corridors · {(data.depots || []).length} depots · {(data.vertiports || []).length} vertiports
        </div>
      </div>
      <div style={{ height: 460, width: '100%', borderRadius: 8, overflow: 'hidden' }}>
        <MapContainer
          center={center}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {corridorLines.map((c) => (
            <Polyline
              key={`cor-${c.id}`}
              positions={[[c.start_lat, c.start_lng], [c.end_lat, c.end_lng]]}
              pathOptions={{ color: '#8b5cf6', weight: 3, opacity: 0.85 }}
            >
              <Tooltip>{c.name || c.corridor_id} · {c.status}</Tooltip>
            </Polyline>
          ))}
          {(data.depots || []).filter((d) => valid(d.lat) && valid(d.lng)).map((d) => (
            <CircleMarker
              key={`dep-${d.id}`}
              center={[d.lat, d.lng]}
              radius={8}
              pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.85 }}
            >
              <Tooltip>{d.name || d.depot_id} · depot</Tooltip>
            </CircleMarker>
          ))}
          {(data.vertiports || []).filter((v) => valid(v.lat) && valid(v.lng)).map((v) => (
            <CircleMarker
              key={`vp-${v.id}`}
              center={[v.lat, v.lng]}
              radius={5}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8 }}
            >
              <Tooltip>{v.vertiport_id} · {v.pad_count} pads</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
