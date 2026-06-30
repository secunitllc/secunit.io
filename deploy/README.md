# Production (Cloudflare Pages)

`secunit.io` is served by the **Cloudflare Pages** project **`secunit-io`** (see `wrangler.toml` and `setup-cloudflare-pages.sh`). TLS, DNS, and the apex/`www` routing live in Cloudflare.

**Build:** **Bun** runs `bun run build` (`packageManager` / `engines` in `package.json`). The **`@astrojs/node`** build writes the prerendered static output to **`dist/client/`** (`pages_build_output_dir` in `wrangler.toml`), which is what gets uploaded to Pages.

## GitHub Actions (GitHub-hosted runner)

Deploy runs on a **GitHub-hosted `ubuntu-latest` runner** (see `.github/workflows/deploy-prod.yml`). It builds the site and direct-uploads `dist/client/` to the Pages project with `wrangler pages deploy`.

Required repository secrets (**Settings → Secrets and variables → Actions**):

| Secret                   | Purpose                                                            |
| ------------------------ | ----------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`   | API token with **Pages: Edit** (and your account's read scope).   |
| `CLOUDFLARE_ACCOUNT_ID`  | The Cloudflare account that owns the `secunit-io` Pages project.   |

A push to **`main`** (or a manual **workflow_dispatch**) triggers a production deploy.

## One-time Cloudflare Pages setup

`setup-cloudflare-pages.sh` creates the Pages project, links the GitHub repo, and wires the apex/`www` custom domains. It expects `CLOUDFLARE_API_KEY`/`CLOUDFLARE_TOKEN` (and `CLOUDFLARE_EMAIL` for Global API Key auth) exported in the shell. Run it once:

```sh
export CLOUDFLARE_TOKEN="…"   # Pages:Edit + DNS:Edit
bash setup-cloudflare-pages.sh
```

## Bindings

Runtime bindings (e.g. the **D1** database `secunit-contacts` used by the contact form) are declared in `wrangler.toml` and configured on the Pages project. Manage them via the Cloudflare dashboard or Wrangler; route D1 schema changes through `wrangler d1 migrations`.
