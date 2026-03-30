// Supabase Edge Function: send-share-invitation
// Sends email invitations when a user shares a transcription or folder.
// Requires RESEND_API_KEY secret. Falls back to logging if not configured.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "noreply@transcribetotext.com";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_RESOURCE_TYPES = ["transcription", "folder"] as const;

interface InvitationRequest {
  emails: string[];
  resourceType: "transcription" | "folder";
  resourceId: string;
  resourceName: string;
  senderEmail: string;
  shareLink?: string;
}

/** Escape HTML special characters to prevent XSS in email templates. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Validate the request body has all required fields with correct types. */
function validateRequest(
  body: unknown,
): { valid: true; data: InvitationRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.emails) || b.emails.length === 0) {
    return { valid: false, error: "emails must be a non-empty array" };
  }

  for (const email of b.emails) {
    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return { valid: false, error: `Invalid email: ${String(email).slice(0, 100)}` };
    }
  }

  if (typeof b.resourceType !== "string" || !VALID_RESOURCE_TYPES.includes(b.resourceType as typeof VALID_RESOURCE_TYPES[number])) {
    return { valid: false, error: "resourceType must be 'transcription' or 'folder'" };
  }

  if (typeof b.resourceId !== "string" || b.resourceId.length === 0) {
    return { valid: false, error: "resourceId is required" };
  }

  if (typeof b.resourceName !== "string" || b.resourceName.length === 0) {
    return { valid: false, error: "resourceName is required" };
  }

  if (typeof b.senderEmail !== "string" || !EMAIL_REGEX.test(b.senderEmail)) {
    return { valid: false, error: "senderEmail must be a valid email" };
  }

  return { valid: true, data: b as unknown as InvitationRequest };
}

function buildEmailHtml(
  senderEmail: string,
  resourceName: string,
  resourceType: string,
  appUrl: string,
): string {
  const safeSender = escapeHtml(senderEmail);
  const safeName = escapeHtml(resourceName);
  const safeType = escapeHtml(resourceType);
  const safeUrl = escapeHtml(appUrl);

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #1a1a2e; font-size: 20px; font-weight: 600; margin: 0 0 16px;">
        You've been invited to a shared ${safeType}
      </h2>
      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
        <strong>${safeSender}</strong> has shared the ${safeType}
        <strong>&ldquo;${safeName}&rdquo;</strong> with you.
      </p>
      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Sign in to view it in your account.
      </p>
      <a href="${safeUrl}" style="display: inline-block; background: #3366FF; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 999px; font-size: 14px; font-weight: 500;">
        Open in TranscribeToText
      </a>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
        If you don't have an account, you can sign up for free.
      </p>
    </div>
  `;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate request body
  const rawBody = await req.json();
  const validation = validateRequest(rawBody);

  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { emails, resourceType, resourceName, senderEmail } = validation.data;

  // Derive app URL from the request origin or use a default
  const origin = req.headers.get("Origin") ?? "https://transcribetotext.com";
  const appUrl = `${origin}/shared`;

  const results: { email: string; status: "sent" | "skipped" }[] = [];

  if (!RESEND_API_KEY) {
    // No email provider configured — log and return success
    console.log(
      `[send-share-invitation] No RESEND_API_KEY — skipping email delivery for ${emails.length} invitation(s)`,
    );
    for (const email of emails) {
      console.log(`  -> Would send to: ${email} (${resourceType} "${resourceName}" from ${senderEmail})`);
      results.push({ email, status: "skipped" });
    }
  } else {
    console.log(`[send-share-invitation] Sending ${emails.length} email(s) via Resend from ${FROM_EMAIL}`);

    // Send via Resend API
    for (const email of emails) {
      try {
        const safeSender = escapeHtml(senderEmail);
        const safeType = escapeHtml(resourceType);

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `TranscribeToText <${FROM_EMAIL}>`,
            to: [email],
            subject: `${safeSender} shared a ${safeType} with you`,
            html: buildEmailHtml(senderEmail, resourceName, resourceType, appUrl),
          }),
        });

        const resBody = await res.text();
        if (!res.ok) {
          console.error(`[send-share-invitation] Resend error for ${email} (${res.status}): ${resBody}`);
          results.push({ email, status: "skipped" });
        } else {
          console.log(`[send-share-invitation] Sent to ${email}: ${resBody}`);
          results.push({ email, status: "sent" });
        }
      } catch (err) {
        console.error(`[send-share-invitation] Error sending to ${email}:`, err);
        results.push({ email, status: "skipped" });
      }
    }
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
