import React from 'react';
import 'leaflet/dist/leaflet.css';

import FlightRouteMap   from '../components/FlightRouteMap';
import DroneBatteryGrid from '../components/DroneBatteryGrid';
import MissionFunnel    from '../components/MissionFunnel';
import VertiportCapacity from '../components/VertiportCapacity';

export default function CustomViewsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, color: '#e2e8f0' }}>Flight Views</h1>
        <p style={{ marginTop: 4, color: '#94a3b8' }}>
          BVLOS map · drone battery telemetry · mission funnel · vertiport load.
        </p>
      </div>

      <FlightRouteMap />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: 20,
      }}>
        <MissionFunnel />
        <VertiportCapacity />
      </div>

      <DroneBatteryGrid />
    </div>
  );
}
