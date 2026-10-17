import { NextResponse } from "next/server";

/**
 * The live check-up of the homepage's last stop: a visitor's website run through Google
 * PageSpeed Insights (mobile). Works without a key at a low quota; PAGESPEED_API_KEY (a free
 * Google key, server-side only, set in Vercel) lifts it.
 */

const PSI = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const CATEGORIES = ["performance", "seo", "accessibility", "best-practices"] as const;

/** Same small throttle as the contact form: 4 check-ups per IP per 10 minutes. */
const attempts = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 4;

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

/** "my-shop.com/fr" → "https://my-shop.com/fr". Only public web addresses: no IPs, no localhost. */
function normaliser(adresse: string): URL | null {
  const brut = adresse.trim();
  if (!brut || brut.length > 300) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(brut) ? brut : `https://${brut}`);
    if (!/^https?:$/.test(url.protocol)) return null;
    const hote = url.hostname.toLowerCase();
    if (!hote.includes(".") || hote === "localhost" || /^[\d.]+$/.test(hote) || hote.includes(":")) return null;
    return url;
  } catch {
    return null;
  }
}

type Audit = { title?: string; score?: number | null; details?: { overallSavingsMs?: number }; scoreDisplayMode?: string };

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: { url?: unknown; locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const url = typeof body.url === "string" ? normaliser(body.url) : null;
  if (!url) return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  const locale = body.locale === "en" ? "en" : "fr";

  const params = new URLSearchParams({ url: url.toString(), strategy: "mobile", locale });
  CATEGORIES.forEach((c) => params.append("category", c));
  if (process.env.PAGESPEED_API_KEY) params.set("key", process.env.PAGESPEED_API_KEY);

  let rep: Response;
  try {
    rep = await fetch(`${PSI}?${params}`, { signal: AbortSignal.timeout(55_000), cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "timeout" }, { status: 504 });
  }
  if (!rep.ok) {
    const code = rep.status === 429 ? "quota" : rep.status === 400 ? "unreachable" : "upstream";
    return NextResponse.json({ error: code }, { status: 502 });
  }
  const data = await rep.json();
  const lh = data.lighthouseResult;
  if (!lh) return NextResponse.json({ error: "upstream" }, { status: 502 });

  const scores = Object.fromEntries(
    CATEGORIES.map((c) => [c, Math.round(((lh.categories?.[c]?.score as number | undefined) ?? 0) * 100)]),
  );
  // The three opportunities that would save the most loading time, in Google's own words.
  const pistes = (Object.values(lh.audits ?? {}) as Audit[])
    .filter((a) => a.scoreDisplayMode === "metricSavings" || (a.details?.overallSavingsMs ?? 0) > 0)
    .filter((a) => (a.score ?? 1) < 0.9 && a.title)
    .sort((a, b) => (b.details?.overallSavingsMs ?? 0) - (a.details?.overallSavingsMs ?? 0))
    .slice(0, 3)
    .map((a) => ({ titre: a.title!, gainMs: Math.round(a.details?.overallSavingsMs ?? 0) }));

  return NextResponse.json({
    url: lh.finalDisplayedUrl ?? url.toString(),
    scores,
    lcp: lh.audits?.["largest-contentful-paint"]?.displayValue ?? null,
    pistes,
  });
}

// Lighthouse runs can take a while.
export const maxDuration = 60;
