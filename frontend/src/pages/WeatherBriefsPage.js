import React from 'react';
import CrudPage from '../components/CrudPage';
import { weatherBriefsApi } from '../services/api';

export default function WeatherBriefsPage() {
  return (
    <CrudPage
      title="Weather Briefs"
      subtitle="Wind / ceiling / visibility outlook with go / no-go recommendation."
      api={weatherBriefsApi}
      statusKey="recommendation"
      fields={[
        { key: 'brief_id',       label: 'Brief ID' },
        { key: 'location',       label: 'Location' },
        { key: 'valid_at',       label: 'Valid',      type: 'datetime-local' },
        { key: 'wind_kt',        label: 'Wind (kt)',  type: 'number' },
        { key: 'ceiling_ft',     label: 'Ceiling ft', type: 'number' },
        { key: 'recommendation', label: 'Reco',       type: 'select', options: ['go','caution','no_go'] },
        { key: 'notes',          label: 'Notes',      type: 'textarea' },
      ]}
    />
  );
}
