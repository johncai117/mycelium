# Cloudflare Tunnel Setup (Backend)

Expose your local FastAPI backend (port 8000) to the internet via an encrypted outbound tunnel — no open inbound ports required.

## 1. Install cloudflared

```bash
# Ubuntu/Debian
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloudflare-main.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared focal main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared
```

## 2. Authenticate

```bash
cloudflared tunnel login
# Opens browser → select your Cloudflare zone (or create one)
```

## 3. Create a tunnel

```bash
cloudflared tunnel create mycelium-backend
# Note the tunnel ID printed (e.g. abc123-...)
```

## 4. Create tunnel config

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/johncai117/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - hostname: api.yourdomain.com   # or use a *.trycloudflare.com URL
    service: http://localhost:8000
  - service: http_status:404
```

**If you don't have a custom domain**, use a quick tunnel for testing:
```bash
cloudflared tunnel --url http://localhost:8000
# Gives you a random https://xxx.trycloudflare.com URL — no account needed
```

## 5. Add DNS record

```bash
cloudflared tunnel route dns mycelium-backend api.yourdomain.com
```

## 6. Run as systemd service

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

## 7. Update backend CORS

Add your tunnel URL to `.env`:
```
CORS_ORIGINS=https://api.yourdomain.com,https://mycelium.pages.dev
```

Then restart the backend.
