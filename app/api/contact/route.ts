import { NextResponse } from "next/server";
import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/i18n";

const MAX_LENGTHS = {
  name: 120,
  email: 160,
  company: 160,
  subject: 80,
  budget: 80,
  message: 4000,
} as const;

type Field = keyof typeof MAX_LENGTHS;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Very small in-memory throttle: 5 submissions per IP per 10 minutes. */
const attempts = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

function readField(body: Record<string, unknown>, field: Field) {
  const value = body[field];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_LENGTHS[field]);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // Honeypot: real users never fill this field.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = readField(body, "name");
  const email = readField(body, "email");
  const company = readField(body, "company");
  const subject = readField(body, "subject");
  const budget = readField(body, "budget");
  const message = readField(body, "message");

  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("RESEND_API_KEY is missing — contact form cannot send.");
      return NextResponse.json({ error: "not_configured" }, { status: 500 });
    }
    console.info("[contact] no RESEND_API_KEY, logging instead:", {
      name,
      email,
      company,
      subject,
      budget,
      message,
    });
    return NextResponse.json({ ok: true, delivered: false });
  }

  const rows = [
    ["Nom", name],
    ["Courriel", email],
    ["Entreprise", company || "—"],
    ["Besoin", subject || "—"],
    ["Budget", budget || "—"],
  ];

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#111">
      <h2 style="margin:0 0 16px">Nouvelle demande — hephera.ca</h2>
      <table style="border-collapse:collapse">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#666">${label}</td><td style="padding:4px 0"><strong>${escapeHtml(value)}</strong></td></tr>`,
          )
          .join("")}
      </table>
      <h3 style="margin:24px 0 8px">Message</h3>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL ?? "Hephera <onboarding@resend.dev>",
      to: process.env.CONTACT_TO_EMAIL ?? CONTACT_EMAIL,
      replyTo: email,
      subject: `Nouvelle demande — ${name}${company ? ` (${company})` : ""}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, delivered: true });
  } catch (error) {
    console.error("Contact route failed:", error);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
