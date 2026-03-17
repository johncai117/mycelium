# Cloudflare Pages Setup (Frontend)

Deploy the React frontend to Cloudflare Pages — free, fast, separate domain from your personal site.

## 1. Connect GitHub repo

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create application** → **Pages**
2. Connect your GitHub account and select the `mycelium` repo
3. Set the following build settings:

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `cd frontend && npm install && npm run build` |
| Build output directory | `frontend/dist` |
| Root directory | `/` |

## 2. Set environment variables

In **Settings → Environment variables**, add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://api.yourdomain.com` (your Cloudflare Tunnel URL) |
| `VITE_API_KEY` | Your `DEMO_API_KEY` value (keep secret) |

> ⚠️ Mark `VITE_API_KEY` as **Encrypted** in the Cloudflare Pages UI.

## 3. Deploy

Push to `main` branch → Cloudflare Pages auto-deploys.

Your app will be live at: `https://mycelium.pages.dev` (or a custom domain)

## 4. Update backend CORS

Once you have the Pages URL, add it to `.env` on the backend:
```
CORS_ORIGINS=https://mycelium.pages.dev
```

Restart the backend / tunnel.

## 5. Custom domain (optional)

In Pages → **Custom domains** → add `app.yourdomain.com` → Cloudflare auto-provisions SSL.
