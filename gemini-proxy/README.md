# ProdHub Gemini Proxy (Cloudflare Worker)

A tiny Cloudflare Worker that keeps the Gemini API key **off the client**. The
ProdHub web app sends Gemini requests here with the signed-in user's Firebase ID
token; the Worker verifies the token and forwards the request to Gemini using the
key stored as a Worker secret.

**Why not a Firebase Cloud Function?** Cloud Functions require the Firebase
**Blaze** (pay-as-you-go) plan. Cloudflare Workers have a genuinely free tier
(100k requests/day, no credit card), and they don't touch your Firebase plan —
your Firebase project stays on the free **Spark** plan.

## How it protects the key

- The key lives only as a Worker **secret**, never in the React bundle.
- Every request must carry a valid **Firebase ID token** (verified against
  Google's public certs, checking issuer + audience = your project id), so only
  your logged-in users can use it.
- CORS is locked to your app's origin.

## One-time setup

Prerequisites: a free [Cloudflare account](https://dash.cloudflare.com/sign-up)
and Node 18+.

```sh
cd gemini-proxy
npm install
npx wrangler login          # opens the browser to authorize
```

Edit [`wrangler.toml`](./wrangler.toml) and set:
- `FIREBASE_PROJECT_ID` — your Firebase project id
- `ALLOWED_ORIGIN` — your deployed app origin (e.g. `https://<project>.web.app`).
  For local dev you can temporarily set `http://localhost:3000`.

Add the Gemini key as a secret (you'll be prompted to paste it):

```sh
npx wrangler secret put GEMINI_API_KEY
```

Deploy:

```sh
npx wrangler deploy
```

Wrangler prints your Worker URL, e.g.
`https://prodhub-gemini-proxy.<your-subdomain>.workers.dev`.

## Wire the web app to it

In the **web app** project root, add to `.env.local` (dev) and your production
build env:

```env
REACT_APP_GEMINI_PROXY_URL=https://prodhub-gemini-proxy.<your-subdomain>.workers.dev
```

Then **remove** `REACT_APP_GEMINI_API_KEY` from any production build env so the
key is never bundled. (You may keep it in local `.env.local` only if you want the
direct-call dev fallback when `REACT_APP_GEMINI_PROXY_URL` is unset.)

Rebuild/redeploy the web app. The client now calls the proxy; `geminiService.js`
attaches the Firebase ID token automatically.

## Local development

```sh
npm run dev    # wrangler dev, serves on http://localhost:8787
```

Point `REACT_APP_GEMINI_PROXY_URL=http://localhost:8787` and set
`ALLOWED_ORIGIN=http://localhost:3000` in `wrangler.toml` (or `*` temporarily)
while testing.

## Rotating the key

```sh
npx wrangler secret put GEMINI_API_KEY   # paste the new key
```

No web-app redeploy needed — the key only lives in the Worker.
