import { importX509, jwtVerify, decodeProtectedHeader } from 'jose';

/**
 * ProdHub Gemini proxy (Cloudflare Worker).
 *
 * Keeps the Gemini API key off the client. The browser POSTs a Gemini
 * `generateContent` payload here with the signed-in user's Firebase ID token in
 * the Authorization header. We verify the token (so only your own logged-in
 * users can call it), then forward the request to Gemini using the key stored as
 * a Worker secret.
 *
 * Required bindings (see wrangler.toml / `wrangler secret`):
 *   - GEMINI_API_KEY       (secret) Google AI Studio / Generative Language key
 *   - FIREBASE_PROJECT_ID  (var)    your Firebase project id
 *   - ALLOWED_ORIGIN       (var)    e.g. https://my-productivity-hub-5a3ba.web.app
 *   - GEMINI_MODEL         (var)    optional, defaults to gemini-2.5-flash
 */

const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

// In-isolate cache of Firebase public x509 certs.
let certCache = { certs: null, expiresAt: 0 };

async function getFirebaseCerts() {
  const now = Date.now();
  if (certCache.certs && now < certCache.expiresAt) return certCache.certs;

  const res = await fetch(FIREBASE_CERTS_URL);
  if (!res.ok) throw new Error('Could not fetch Firebase public certs');
  const certs = await res.json();

  // Respect the endpoint's max-age so we refresh keys on rotation.
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAge = parseInt((cacheControl.match(/max-age=(\d+)/) || [])[1] || '3600', 10);
  certCache = { certs, expiresAt: now + maxAge * 1000 };
  return certs;
}

async function verifyFirebaseToken(token, projectId) {
  const { kid } = decodeProtectedHeader(token);
  const certs = await getFirebaseCerts();
  const pem = certs[kid];
  if (!pem) throw new Error('Unknown token key id');

  const key = await importX509(pem, 'RS256');
  const { payload } = await jwtVerify(token, key, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  if (!payload.sub) throw new Error('Token missing subject');
  return payload;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';
    const requestOrigin = request.headers.get('Origin') || '';

    // Lock CORS to the configured origin (allow '*' only if explicitly set).
    const origin =
      allowedOrigin === '*' || requestOrigin === allowedOrigin ? requestOrigin || allowedOrigin : allowedOrigin;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return json({ error: { message: 'Method not allowed' } }, 405, origin);
    }

    if (allowedOrigin !== '*' && requestOrigin && requestOrigin !== allowedOrigin) {
      return json({ error: { message: 'Origin not allowed' } }, 403, origin);
    }

    // --- Auth: verify the Firebase ID token ---
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return json({ error: { message: 'Missing Authorization bearer token' } }, 401, origin);
    }
    try {
      await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
    } catch (e) {
      return json({ error: { message: `Invalid token: ${e.message}` } }, 401, origin);
    }

    // --- Forward to Gemini ---
    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: { message: 'Invalid JSON body' } }, 400, origin);
    }

    const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  },
};
