import React, { useEffect, useState } from 'react';
import {
  getFeedsStatus,
  fetchNotamFeed,
  refreshNotamFeed,
  fetchWeatherFeed,
  refreshWeatherFeed,
  dispatchNotification,
} from '../services/api';

// NEEDS-CREDS — All upstreams 503 until credentials are configured in .env.
// This page lets an operator see which feeds are configured, and probe each
// stub. 503 responses are rendered as warnings, not errors.

function FeedProbe({ title, description, requiredEnv, calls }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);

  const run = async (name, fn) => {
    setLoading(name); setError(null); setResult(null);
    try {
      const r = await fn();
      setResult({ name, payload: r });
    } catch (e) {
      // 503 propagates as an Error here; show payload-style hint
      setError(`${name}: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ border: '1px solid #d0d5dc', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ margin: '4px 0 8px', color: '#475569', fontSize: 13 }}>{description}</p>
      <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#64748b' }}>
        Required env: <code>{requiredEnv.join(', ')}</code>
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {calls.map((c) => (
          <button
            key={c.name}
            className="btn secondary"
            disabled={loading === c.name}
            onClick={() => run(c.name, c.fn)}
          >
            {loading === c.name ? `${c.name}…` : c.name}
          </button>
        ))}
      </div>
      {error && (
        <div style={{ background: '#fef3c7', color: '#78350f', padding: 8, borderRadius: 6, fontSize: 13 }}>
          {error}
        </div>
      )}
      {result && (
        <pre style={{
          marginTop: 12, padding: 10, background: '#0f172a', color: '#e2e8f0',
          borderRadius: 6, fontSize: 12, overflowX: 'auto',
        }}>{JSON.stringify(result.payload, null, 2)}</pre>
      )}
    </div>
  );
}

export default function FeedsAdminPage() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    getFeedsStatus().then((d) => { if (alive) setStatus(d); }).catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>External Feeds (NEEDS-CREDS)</h1>
      <div style={{
        background: '#dbeafe', border: '1px solid #3b82f6', borderRadius: 8,
        padding: 12, marginBottom: 16, fontSize: 13, color: '#1e3a8a',
      }}>
        NOTAM, weather, and outbound notification dispatch require provider credentials
        in <code>.env</code>. Until configured, each upstream returns <strong>HTTP 503</strong>
        with a structured payload describing the missing env var. No credentials are ever
        wiped or overwritten by this UI.
      </div>

      {status && (
        <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          <strong>Configured providers:</strong>{' '}
          {Object.entries(status).map(([k, v]) => (
            <span key={k} style={{ marginRight: 12 }}>
              {k}: <strong style={{ color: v.configured ? '#15803d' : '#b45309' }}>
                {v.configured ? 'yes' : 'no'}
              </strong>
            </span>
          ))}
        </div>
      )}
      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>Error: {error}</div>}

      <FeedProbe
        title="NOTAM / TFR Feed"
        description="Pull active NOTAMs / TFRs from FAA SWIM (or equivalent regional source)."
        requiredEnv={['NOTAM_API_KEY', 'NOTAM_PROVIDER_URL']}
        calls={[
          { name: 'GET /feeds/notam',          fn: fetchNotamFeed },
          { name: 'POST /feeds/notam/refresh', fn: refreshNotamFeed },
        ]}
      />
      <FeedProbe
        title="Weather Feed (METAR / TAF)"
        description="Pull live METAR / TAF observations for vertiport / route planning."
        requiredEnv={['WEATHER_API_KEY', 'WEATHER_PROVIDER_URL']}
        calls={[
          { name: 'GET /feeds/weather',          fn: fetchWeatherFeed },
          { name: 'POST /feeds/weather/refresh', fn: refreshWeatherFeed },
        ]}
      />
      <FeedProbe
        title="Customer Notification Dispatch"
        description="Outbound SMS / email / push to customers for delivery events."
        requiredEnv={['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM', 'SENDGRID_API_KEY']}
        calls={[
          { name: 'POST /feeds/notify/dispatch (test)',
            fn: () => dispatchNotification({ channel: 'sms', to: '+15555550100', body: 'test' }) },
        ]}
      />
    </div>
  );
}
