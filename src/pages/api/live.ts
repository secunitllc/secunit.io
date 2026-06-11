import type { APIRoute } from "astro";

export const prerender = false;

// Simple liveness check - just confirms the app is running
// Used by Fly.io for basic health checks
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
};

