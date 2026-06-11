import type { APIRoute } from "astro";

export const prerender = false;

interface ContactForm {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  inquiry_type: string;
  message: string;
  referral_source?: string;
  website?: string; // honeypot
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: ContactForm = await request.json();

    // Honeypot check
    if (data.website) {
      // Bot detected - return success but don't process
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    if (!data.name || !data.email || !data.inquiry_type || !data.message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get request metadata
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("fly-client-ip") ||
      "";
    const pageUrl = request.headers.get("referer") || "";

    // Store in D1 database via REST API
    const insertResult = await executeD1Query(
      `INSERT INTO contacts (
        name, email, company, phone, inquiry_type, message, 
        referral_source, page_url, user_agent, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.email,
        data.company || null,
        data.phone || null,
        data.inquiry_type,
        data.message,
        data.referral_source || null,
        pageUrl,
        userAgent,
        ipAddress,
      ]
    );

    const contactId = insertResult.result[0]?.meta?.last_row_id;

    // Send email notification via Resend
    const resendApiKey = import.meta.env.RESEND_API_KEY;
    const contactEmail = import.meta.env.CONTACT_EMAIL || "hello@secunit.io";

    if (resendApiKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Secunit Website <noreply@secunit.io>",
            to: [contactEmail],
            subject: `New Contact: ${data.inquiry_type} from ${data.name}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${data.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
              ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ""}
              ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
              <p><strong>Inquiry Type:</strong> ${data.inquiry_type}</p>
              <p><strong>Message:</strong></p>
              <blockquote style="border-left: 3px solid #ccc; padding-left: 16px; margin-left: 0;">
                ${data.message.replace(/\n/g, "<br>")}
              </blockquote>
              ${data.referral_source ? `<p><strong>Referral Source:</strong> ${data.referral_source}</p>` : ""}
              <hr>
              <p style="color: #666; font-size: 12px;">
                Contact ID: ${contactId}<br>
                Submitted: ${new Date().toISOString()}<br>
                IP: ${ipAddress}
              </p>
            `,
            text: `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
${data.company ? `Company: ${data.company}` : ""}
${data.phone ? `Phone: ${data.phone}` : ""}
Inquiry Type: ${data.inquiry_type}

Message:
${data.message}

${data.referral_source ? `Referral Source: ${data.referral_source}` : ""}

---
Contact ID: ${contactId}
Submitted: ${new Date().toISOString()}
            `.trim(),
          }),
        });

        if (emailResponse.ok) {
          // Update database to mark email as sent
          await executeD1Query("UPDATE contacts SET email_sent = 1 WHERE id = ?", [
            contactId,
          ]);
        }
      } catch (emailError) {
        // Log but don't fail the request
        console.error("Failed to send email:", emailError);
      }
    }

    // Return success with the contact record for CRM import
    const jsonBlob = {
      source: "website_contact_form",
      submitted_at: new Date().toISOString(),
      contact_id: contactId,
      contact: {
        name: data.name,
        email: data.email,
        company: data.company || null,
        phone: data.phone || null,
      },
      inquiry: {
        type: data.inquiry_type,
        message: data.message,
        referral_source: data.referral_source || null,
      },
      metadata: {
        page_url: pageUrl,
        user_agent: userAgent,
        ip_address: ipAddress,
      },
    };

    return new Response(
      JSON.stringify({
        success: true,
        contact_id: contactId,
        json_blob: jsonBlob,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

