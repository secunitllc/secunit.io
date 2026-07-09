import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: import.meta.env.ASTRO_SITE_URL || "https://secunit.io",
  // Pages prerender by default; the node adapter serves the /api/* routes
  // (contact form, health/live checks) via dist/server/entry.mjs in prod.
  output: "static",
  adapter: node({
    mode: "standalone",
  }),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      // Cloudflare Access/Gateway custom pages are infrastructure, not content.
      filter: (page) => !page.includes("/access/"),
    }),
  ],
});
