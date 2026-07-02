# Cloudflare Access & Gateway custom pages

Two brand-matched pages live in this repo and deploy with the rest of
secunit.io:

- **Login page** — `src/pages/access/login.astro` → `https://secunit.io/access/login`
- **Gateway block page** — `src/pages/access/blocked.astro` → `https://secunit.io/access/blocked`

Both reuse the site's design tokens (`src/styles/tokens.css`), Geist
type, and the `secunit, llc` wordmark via `src/layouts/AccessLayout.astro`,
so they match the marketing site's look and feel. They are excluded from
the sitemap and marked `noindex`.

> These pages must stay **publicly reachable and not themselves gated by
> Access** — if Access protects all of secunit.io, add an Access "bypass"
> policy for `/access/*`, otherwise the login page will redirect to itself.

## 1. Login page

1. Fill in `src/pages/access/login.astro`:
   - `identityProviders`: one entry per IdP button, e.g. `{ name: "Google Workspace", loginUrl: "..." }`.
     Get the exact `loginUrl` from **Zero Trust dashboard → Settings →
     Authentication**, open the provider, and copy its sign-in link. The
     page's client script appends `redirect_url` to whatever URL you paste
     there automatically — don't hand-edit that part.
   - `defaultLoginUrl`: your team's bare Access login endpoint,
     `https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/login/<app-domain>`,
     used for the "Continue with One-Time PIN" fallback.
2. Deploy (`bun run build` / normal site deploy).
3. In **Zero Trust dashboard → Settings → Custom Pages** (also listed under
   _Reusable components → Custom pages_), open **Login page → Manage**, and
   set the custom URL to `https://secunit.io/access/login`.
4. Open an Access-protected app in an incognito window and confirm the
   branded page appears and each button completes sign-in.

## 2. App Launcher

Cloudflare's App Launcher only supports dashboard-level branding (logo,
background color, header text) — it does not accept a fully custom HTML
page like the login/block pages do. Configure it in **Zero Trust dashboard
→ Settings → App Launcher** (or **Access → Customize App Launcher**,
naming varies by dashboard version) using assets already in this repo:

| Setting                    | Value                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Logo                       | `public/images/brand/icon.png` (square mark)                                                              |
| Background color (dark)    | `#120c09` — `--color-paper` dark                                                                          |
| Background color (light)   | `#f7f0eb` — `--color-paper` light                                                                         |
| Accent / header text color | `#f15b00` — `--color-accent`                                                                              |
| Footer links               | Point at `https://secunit.io` and `mailto:security@secunit.io` if the dashboard offers footer link fields |

## 3. Gateway block page

1. Deploy the site so `https://secunit.io/access/blocked` is live.
2. In **Zero Trust dashboard → Settings → Custom Pages**, open **Gateway
   block page → Manage**, set the custom URL to
   `https://secunit.io/access/blocked`.
3. On the HTTP (or DNS) policy that blocks traffic, turn on **Send policy
   context** so Gateway appends details (`cf_user_email`, `cf_site_uri`,
   `cf_request_categories`, etc.) to the redirect as a query string. The
   page reads any `cf_*` parameter it receives and renders a labeled row for
   it — known fields get a friendly label (see `knownFields` in
   `blocked.astro`), unrecognized ones still show up with an
   auto-generated label, so the page keeps working if Cloudflare adds
   fields later.
4. Trigger a test block (e.g. visit a category blocked by a policy) and
   confirm the page renders with request details and working "Request
   access" / "Go back" actions.

## Notes

- Exact query-parameter names for the login/block redirects were
  cross-checked against Cloudflare's docs via search, but this session's
  browser-fetch tool couldn't reach `developers.cloudflare.com` directly
  (proxy returned 403 for all external fetches, not just Cloudflare) — re-verify
  the parameter tables against the live docs before relying on them for a
  production rollout:
  - <https://developers.cloudflare.com/cloudflare-one/reusable-components/custom-pages/access-login-page/>
  - <https://developers.cloudflare.com/cloudflare-one/reusable-components/custom-pages/gateway-block-page/>
