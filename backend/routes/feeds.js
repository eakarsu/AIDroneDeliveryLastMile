// Apply pass 7 — External feed stubs (NEEDS-CREDS).
// These endpoints intentionally return HTTP 503 with a structured payload that
// documents the missing credential / provider configuration. They are wired so
// the UI can detect "feature available but unconfigured" without crashing.
//
// Wire credentials in .env when a provider is selected:
//   - FAA SWIM NOTAM API           (NOTAM_API_KEY, NOTAM_PROVIDER_URL)
//   - NOAA / AVWX / OGIMET METAR   (WEATHER_API_KEY, WEATHER_PROVIDER_URL)
//   - Twilio SMS / SendGrid email  (TWILIO_*, SENDGRID_API_KEY)

const express = require('express');
const router = express.Router();

function stub503(provider, requiredEnv, hint) {
  return (req, res) => {
    res.status(503).json({
      status: 'unconfigured',
      provider,
      required_env: requiredEnv,
      hint,
      message: `${provider} is not configured. Provide credentials in .env and restart.`,
    });
  };
}

// NOTAM / TFR feed ingestion (FAA SWIM or equivalent)
router.get('/notam',
  stub503(
    'FAA SWIM NOTAM feed',
    ['NOTAM_API_KEY', 'NOTAM_PROVIDER_URL'],
    'GET this endpoint returns active NOTAMs / TFRs once a provider is wired. ' +
      'Until then it returns 503. Pass ?icao=KCLT or ?lat=..&lon=..&radius_nm=.. as query.'
  )
);
router.post('/notam/refresh',
  stub503(
    'FAA SWIM NOTAM feed',
    ['NOTAM_API_KEY', 'NOTAM_PROVIDER_URL'],
    'POST refresh triggers a manual re-pull; persists rows to notam table once wired.'
  )
);

// Live weather feed (METAR / TAF / NWS)
router.get('/weather',
  stub503(
    'METAR/TAF weather feed',
    ['WEATHER_API_KEY', 'WEATHER_PROVIDER_URL'],
    'GET returns current METAR + TAF for ?icao= or ?lat/lon= once a provider is wired.'
  )
);
router.post('/weather/refresh',
  stub503(
    'METAR/TAF weather feed',
    ['WEATHER_API_KEY', 'WEATHER_PROVIDER_URL'],
    'POST refresh re-pulls the latest observation; persists to weather_briefs once wired.'
  )
);

// Outbound customer notification dispatch (SMS / email / push)
router.post('/notify/dispatch',
  stub503(
    'SMS / email notification dispatcher',
    ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM', 'SENDGRID_API_KEY'],
    'POST { channel: "sms"|"email"|"push", to, subject?, body } to dispatch once wired.'
  )
);

// Status — handy for the UI to render a "Feeds" admin page that lists each
// upstream and whether it is reachable. We never expose key VALUES.
router.get('/status', (req, res) => {
  const present = (k) => Boolean(process.env[k]);
  res.json({
    notam:    { configured: present('NOTAM_API_KEY')   && present('NOTAM_PROVIDER_URL') },
    weather:  { configured: present('WEATHER_API_KEY') && present('WEATHER_PROVIDER_URL') },
    sms:      { configured: present('TWILIO_ACCOUNT_SID') && present('TWILIO_AUTH_TOKEN') && present('TWILIO_FROM') },
    email:    { configured: present('SENDGRID_API_KEY') },
  });
});

module.exports = router;
