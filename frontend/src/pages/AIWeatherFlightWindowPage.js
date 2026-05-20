import React from 'react';
import AIPage from '../components/AIPage';
import { aiWeatherFlightWindow } from '../services/api';

export default function AIWeatherFlightWindowPage() {
  return (
    <AIPage
      title="AI · Weather Flight Window"
      feature="weather-flight-window"
      subtitle="Identify the best 24h windows by wind, ceiling, visibility for a drone profile."
      inputs={[
        { key: 'location',       label: 'Location' },
        { key: 'profile_notes',  label: 'Drone / Payload Profile', type: 'textarea' },
      ]}
      run={(v) => aiWeatherFlightWindow(v)}
    />
  );
}
