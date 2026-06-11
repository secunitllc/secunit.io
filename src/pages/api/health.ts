import type { APIRoute } from "astro";

export const prerender = false;

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    app: {
      status: "pass" | "fail";
      message: string;
    };
    d1: {
      status: "pass" | "fail";
      message: string;
      crud: {
        create: "pass" | "fail";
        read: "pass" | "fail";
        update: "pass" | "fail";
        delete: "pass" | "fail";
      };
    };
  };
}

interface D1Response {
  success: boolean;
  result: Array<{
    results: Array<Record<string, unknown>>;
    meta: {
      last_row_id: number;
      changes: number;
    };
  }>;
  errors: Array<{ message: string }>;
}

// Cloudflare D1 REST API helper
async function executeD1Query(
  sql: string,
  params: (string | number | null)[] = []
): Promise<D1Response> {
  const accountId = import.meta.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = import.meta.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = import.meta.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Missing Cloudflare D1 configuration");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql,
        params,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D1 API error: ${error}`);
  }

  return response.json();
}

export const GET: APIRoute = async () => {
  const healthCheck: HealthCheckResult = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      app: {
        status: "pass",
        message: "Application is running",
      },
      d1: {
        status: "pass",
        message: "D1 database is accessible",
        crud: {
          create: "pass",
          read: "pass",
          update: "pass",
          delete: "pass",
        },
      },
    },
  };

  // Check D1 database connectivity and CRUD operations
  // Wrap in try-catch to handle missing env vars gracefully
  let testId: number | null = null;
  let d1CheckEnabled = true;

  // Check if D1 environment variables are configured
  const accountId = import.meta.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = import.meta.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = import.meta.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    d1CheckEnabled = false;
    healthCheck.checks.d1.status = "fail";
    healthCheck.checks.d1.message = "D1 configuration not available (env vars missing)";
    healthCheck.status = "degraded";
    // Still return 200 - app is running, just D1 not configured
  }

  if (d1CheckEnabled) {
    try {
      // CREATE - Insert a test record
      const createResult = await executeD1Query(
        `INSERT INTO contacts (
          name, email, inquiry_type, message, 
          page_url, user_agent, ip_address, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "Health Check Test",
          "healthcheck@secunit.io",
          "General Inquiry",
          "Automated health check test - will be deleted",
          "https://secunit.io/api/health",
          "Health Check Bot",
          "127.0.0.1",
          "test",
        ]
      );

      if (!createResult.success || !createResult.result[0]?.meta?.last_row_id) {
        throw new Error("CREATE operation failed");
      }

      testId = createResult.result[0].meta.last_row_id;
      healthCheck.checks.d1.crud.create = "pass";
    } catch (error) {
      healthCheck.checks.d1.crud.create = "fail";
      healthCheck.checks.d1.status = "fail";
      healthCheck.checks.d1.message = `CREATE failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      healthCheck.status = "degraded";
      // Don't set unhealthy - app is still running
    }
  }

  // READ - Fetch the test record
  if (testId !== null && d1CheckEnabled) {
    try {
      const readResult = await executeD1Query(
        "SELECT id, name, email, status FROM contacts WHERE id = ?",
        [testId]
      );

      if (
        !readResult.success ||
        !readResult.result[0]?.results ||
        readResult.result[0].results.length === 0
      ) {
        throw new Error("READ operation failed - record not found");
      }

      healthCheck.checks.d1.crud.read = "pass";
    } catch (error) {
      healthCheck.checks.d1.crud.read = "fail";
      healthCheck.checks.d1.status = "fail";
      healthCheck.checks.d1.message = `READ failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      healthCheck.status = "degraded";
      // Don't set unhealthy - app is still running
    }

    // UPDATE - Update the test record
    try {
      const updateResult = await executeD1Query(
        "UPDATE contacts SET status = ? WHERE id = ?",
        ["test_updated", testId]
      );

      if (!updateResult.success || updateResult.result[0]?.meta?.changes !== 1) {
        throw new Error("UPDATE operation failed");
      }

      healthCheck.checks.d1.crud.update = "pass";
    } catch (error) {
      healthCheck.checks.d1.crud.update = "fail";
      healthCheck.checks.d1.status = "fail";
      healthCheck.checks.d1.message = `UPDATE failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      healthCheck.status = "degraded";
      // Don't set unhealthy - app is still running
    }

    // DELETE - Clean up the test record
    try {
      const deleteResult = await executeD1Query(
        "DELETE FROM contacts WHERE id = ?",
        [testId]
      );

      if (!deleteResult.success || deleteResult.result[0]?.meta?.changes !== 1) {
        throw new Error("DELETE operation failed");
      }

      healthCheck.checks.d1.crud.delete = "pass";
    } catch (error) {
      healthCheck.checks.d1.crud.delete = "fail";
      healthCheck.checks.d1.status = "fail";
      healthCheck.checks.d1.message = `DELETE failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      healthCheck.status = "degraded";
      // Don't set unhealthy - app is still running
    }
  }

  // Determine overall status based on D1 checks
  // Only mark as degraded if D1 fails, never unhealthy (app is still running)
  if (healthCheck.checks.d1.status === "fail") {
    healthCheck.status = "degraded";
  } else if (
    Object.values(healthCheck.checks.d1.crud).some((op) => op === "fail")
  ) {
    healthCheck.status = "degraded";
  }

  // Always return 200 if app is running
  // Fly.io healthcheck should pass as long as we return 200
  // The JSON status field indicates the actual health state
  return new Response(JSON.stringify(healthCheck, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
};

