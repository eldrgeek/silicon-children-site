# DNS Cutover Plan — siliconchildren.org / siliconchildren.com

## Current State (2026-05-19)

| Domain | Registrar/DNS | Current A record |
|---|---|---|
| siliconchildren.org | Epik (ns3/ns4.epik.com) | 209.141.35.98 (not Mike's VPS) |
| siliconchildren.com | Porkbun (4 NS records) | 44.230.85.241 / 52.33.207.7 (AWS, not Mike's VPS) |

VPS IP: 217.77.6.197

## Recommended approach: Cloudflare proxy in front

Rather than pointing directly to 217.77.6.197, route both domains through Cloudflare:
- CDN + caching for AI crawlers
- DDoS protection
- Analytics without JS tracking pixel (Cloudflare dashboard)
- Zero downtime migration via proxied DNS

### Steps

**1. Add both domains to Cloudflare (free tier)**
- cloudflare.com → Add a site → siliconchildren.org
- cloudflare.com → Add a site → siliconchildren.com

**2. Update nameservers at registrars**
- siliconchildren.org at Epik: change NS to Cloudflare's assigned nameservers
- siliconchildren.com at Porkbun: change NS to Cloudflare's assigned nameservers
- Propagation: 24-48 hours

**3. In Cloudflare DNS for each domain**
```
A  @  217.77.6.197  (proxied: orange cloud)
A  www  217.77.6.197  (proxied: orange cloud)
```

**4. Add nginx server block for canonical domain**

On VPS, add to `/etc/nginx/sites-available/siliconchildren`:
```nginx
server {
    listen 80;
    server_name siliconchildren.org www.siliconchildren.org siliconchildren.com www.siliconchildren.com;
    return 301 https://siliconchildren.org$request_uri;
}

server {
    listen 443 ssl;
    server_name siliconchildren.org www.siliconchildren.org;

    ssl_certificate     /etc/letsencrypt/live/siliconchildren.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/siliconchildren.org/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /var/www/silicon-children;
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }
}

server {
    listen 443 ssl;
    server_name siliconchildren.com www.siliconchildren.com;

    ssl_certificate     /etc/letsencrypt/live/siliconchildren.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/siliconchildren.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    return 301 https://siliconchildren.org$request_uri;
}
```

**5. Certbot for both domains**
```bash
certbot --nginx -d siliconchildren.org -d www.siliconchildren.org
certbot --nginx -d siliconchildren.com -d www.siliconchildren.com
```

**6. Update Astro base config**

Once on the canonical domain, rebuild with:
```js
// astro.config.mjs
site: 'https://siliconchildren.org',
base: '/',  // no subdirectory; served from root
```

Then redeploy: `npm run build && scp dist/* root@217.77.6.197:/var/www/silicon-children/`

**7. Update llms.txt and sitemap.xml URLs**

Both files reference `vpsmikewolf.duckdns.org/silicon-children/` — update to `siliconchildren.org/` before or immediately after cutover.

**8. 301 redirect from VPS path (post-cutover)**

After canonical domain is live:
```nginx
location /silicon-children/ {
    return 301 https://siliconchildren.org$request_uri;
}
```

**9. Submit sitemap to Google Search Console**
- Add property: siliconchildren.org
- Submit: https://siliconchildren.org/sitemap.xml
- Verify via DNS TXT record or HTML file

## Canonical domain choice

Use `siliconchildren.org` as canonical. Redirect `.com` to `.org`.
`.org` signals non-commercial philosophical project, which is accurate.

## Timeline estimate

| Step | Time |
|---|---|
| Cloudflare setup + NS change | 1 hour |
| NS propagation | 24-48 hours |
| Certbot + nginx config | 30 min |
| Astro rebuild + redeploy | 15 min |
| Search Console submission | 15 min |
| Total elapsed | ~2-3 days (most is DNS wait) |
