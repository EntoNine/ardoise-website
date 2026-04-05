// ── Ardoise contact form — Netlify serverless function ──────────────────────
// La clé Supabase est stockée en variable d'environnement Netlify,
// jamais exposée dans le code source  du site.
//
// Variables d'environnement à définir dans :
//   Netlify Dashboard → Site → Site configuration → Environment variables
//
//   SUPABASE_URL       https://xxxx.supabase.co
//   SUPABASE_ANON_KEY  eyJ...
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_RE       = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const ALLOWED_TYPES  = new Set(['feedback', 'bug', 'feature', 'other']);
const ALLOWED_OS     = new Set(['windows', 'deb', 'rpm', 'appimage', 'other']);

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid_json' }) }; }

  const { name = '', email = '', type = 'other', os = 'other', message = '', website = '' } = data;

  // ── Honeypot ───────────────────────────────────────────────────────────────
  if (website) {
    // Silently pretend success so bots don't know they were blocked
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  if (!email || !EMAIL_RE.test(email.trim())) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid_email' }) };
  }
  if (!message || message.trim().length < 5) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'message_too_short' }) };
  }

  // ── Sanitize & whitelist ───────────────────────────────────────────────────
  const payload = {
    name:    name.trim().slice(0, 100),
    email:   email.trim().slice(0, 254),
    type:    ALLOWED_TYPES.has(type)  ? type  : 'other',
    os:      ALLOWED_OS.has(os)       ? os    : 'other',
    message: message.trim().slice(0, 2000),
  };

  // ── Check env vars ─────────────────────────────────────────────────────────
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'server_config_error' }) };
  }

  // ── Insert via Supabase REST API ───────────────────────────────────────────
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
      method:  'POST',
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Supabase error:', res.status, err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'db_error' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Network error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'network_error' }) };
  }
};
