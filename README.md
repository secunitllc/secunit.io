# secunit, llc Website

Enterprise-grade security, DevOps, and AI consulting for small and mid-sized businesses.

**Live site:** https://secunit.io

## Tech Stack

- **Framework:** [Astro](https://astro.build/) v6
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v3
- **Tooling:** [Bun](https://bun.sh/) + **[Node.js](https://nodejs.org/)** 26+ (`packageManager` / `engines` in `package.json`); production SSR via `@astrojs/node`
- **Hosting:** Self-hosted on Hetzner (GitHub Actions + self-hosted runner → see `deploy/README.md`)
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (contact submissions via REST API from the Astro server)
- **Email:** [Resend](https://resend.com/)

## Local Development

```bash
bun install
bun dev
bun run build
bun preview
```

## Deployment

Pushes to `main` run `.github/workflows/deploy-prod.yml` on the **self-hosted** runner (labels `self-hosted`, `Linux`, `X64`). See **`deploy/README.md`** for paths and systemd (reverse proxy is maintained elsewhere).

## Project Structure

```
secunit-website/
├── deploy/                  # Example systemd unit + production notes
├── public/                  # Static assets (served as-is)
├── scripts/                 # e.g. restart.sh (synced by deploy)
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   │   └── api/             # Astro API routes (e.g. contact form)
│   └── styles/
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── bun.lock
├── wrangler.toml            # Optional: wrangler CLI + D1 admin
└── package.json
```

## Contact Form

Submissions are stored in **Cloudflare D1** and notifications go through **Resend**. The handler lives at `src/pages/api/contact.ts` (SSR), not Cloudflare Pages Functions.

### Database schema

See `README` section in your D1 setup or `src/pages/api/contact.ts` for the expected table shape.

### Exporting contacts (wrangler)

```bash
wrangler d1 execute secunit-contacts --command="SELECT * FROM contacts WHERE status = 'new'"
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Resend API key for sending emails | Yes |
| `CONTACT_EMAIL` | Destination email for form submissions | No (default: hello@secunit.io) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (D1 REST API) | Yes for contact API |
| `CLOUDFLARE_D1_DATABASE_ID` | D1 database ID | Yes for contact API |
| `CLOUDFLARE_API_TOKEN` | Token with D1 read/write | Yes for contact API |

## License

© 2025 secunit, llc. All rights reserved.
