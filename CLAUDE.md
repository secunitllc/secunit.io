---
description: Node.js + Bun + Astro for this project.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

This repo uses **Node.js 26+**, **Bun**, and **Astro** (see `package.json` `packageManager` and `engines`).

- Use **`bun install`**, **`bun run <script>`** (`dev`, `build`, `preview`, `start`).
- Production SSR: **`node ./dist/server/entry.mjs`** after `@astrojs/node` build (`bun run build`).
- Use **Vite** only via Astro’s toolchain (`astro dev` / `astro build`); do not replace Vite with an alternate bundler.

## Testing

Use **`bun test`** if a test runner is configured; otherwise follow project conventions.

## Environment

- Prefer **`.env`** with Astro’s env handling; do not add `dotenv` unless required.
