# Production (Hetzner)

TLS termination and reverse proxy (e.g. Caddy) for `secunit.io` live in your **separate infra / edge repo** — not in this project.

**Runtime:** **[Node.js](https://nodejs.org/en/about/previous-releases)** (see `engines` in `package.json`) runs the `@astrojs/node` server (`dist/server/entry.mjs`). **Bun** is used locally and in CI (`packageManager` in `package.json`).

Paths on the server:

| Purpose        | Path                         |
| -------------- | ---------------------------- |
| App root (build output + deps) | `/opt/secunit.io/web` — `server/`, `client/`, **`node_modules/`**, `package.json`, `bun.lock` |
| Node.js        | e.g. nvm path or `/usr/bin/node` (systemd `ExecStart`; match `engines.node` in `package.json`) |
| Restart script | `/opt/secunit.io/bin/restart.sh` |

The deploy workflow rsyncs **`dist/`** into `web/`, copies **`package.json`** and **`bun.lock`**, then runs **`bun install --production`** in `web/` so runtime imports (e.g. from the Astro standalone server) resolve. **`rsync --delete` excludes `node_modules`** so production deps are not removed each run.

Create **`web/`** and **`bin/`** under `/opt/secunit.io` once (if missing) so the deploy job never has to create the home directory itself:

```sh
mkdir -p /opt/secunit.io/web /opt/secunit.io/bin
```

(Run as `secunit` or fix ownership so the runner user can write there.)

## GitHub Actions (self-hosted runner)

Deploy uses a **self-hosted runner** on this host (see `.github/workflows/deploy-prod.yml`). No `HETZNER_SSH_KEY` or inbound SSH from GitHub is required.

1. [Add a self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners) to this repository.
2. The workflow uses **`runs-on: [self-hosted, Linux, X64]`**, which matches the default labels on a Linux x64 runner. The runner **name** in the UI (e.g. `hetzner`) is only cosmetic — jobs match **labels**, not the name. Add a custom label later if you get a second runner and need to target only this one.
3. Ensure **`rsync`** is installed (`sudo apt install rsync` on Debian/Ubuntu).
4. The runner needs **Node.js 26+** and **Bun** (the workflow uses `actions/setup-node` + `oven-sh/setup-bun`). Run the runner service as user **`secunit`** so it can write to `/opt/secunit.io/web`, update `/opt/secunit.io/bin/restart.sh`, and run `restart.sh` (sudoers for `systemctl restart secunit-io.service`).

**Security:** Self-hosted runners should not run workflows from untrusted forks. In the repo’s **Actions → General** settings, use **“Require approval for all outside collaborators”** or disable fork workflows as appropriate.

## Systemd

1. Copy `secunit-io.service` to `/etc/systemd/system/` (adjust `User`/`Group` if needed).
2. `sudo systemctl daemon-reload && sudo systemctl enable --now secunit-io`
3. In your reverse proxy config (other repo), proxy to **`127.0.0.1:4321`** (or the **`PORT`** in the unit).

## Manual restart

```sh
/opt/secunit.io/bin/restart.sh
```

**Sudoers** (for `secunit`):

```sudoers
secunit ALL=(ALL) NOPASSWD: /bin/systemctl restart secunit-io.service
```
