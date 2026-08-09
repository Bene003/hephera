import { ImageResponse } from "next/og";
import { getDictionary } from "@/lib/content";
import { defaultLocale, isLocale } from "@/lib/i18n";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = { params: Promise<{ locale: string }> };

const read = async (params: Params["params"]) => {
  const { locale } = await params;
  return getDictionary(isLocale(locale) ? locale : defaultLocale);
};

/**
 * Only here to make `alt` follow the locale — a plain `export const alt` is a
 * single static string, and `meta.ogAlt` already exists in both dictionaries.
 */
export async function generateImageMetadata({ params }: Params) {
  const dict = await read(params);
  return [{ id: "card", alt: dict.meta.ogAlt, size, contentType }];
}

export default async function OpengraphImage({ params }: Params) {
  const dict = await read(params);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 76,
          backgroundColor: "#07070a",
          backgroundImage:
            "radial-gradient(900px 460px at 78% 8%, rgba(255,122,24,0.28), transparent 70%), radial-gradient(620px 420px at 6% 100%, rgba(226,87,30,0.16), transparent 70%)",
          color: "#f7f4ef",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="72" height="72" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="molten" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffc078" />
                <stop offset="50%" stopColor="#ff7a18" />
                <stop offset="100%" stopColor="#b83c14" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7.5" fill="#101017" />
            <rect
              x="0.75"
              y="0.75"
              width="30.5"
              height="30.5"
              rx="6.9"
              fill="none"
              stroke="#ff9d42"
              strokeOpacity="0.4"
              strokeWidth="1.5"
            />
            <g fill="url(#molten)">
              <rect x="6.5" y="6.5" width="5.5" height="19" rx="1.6" />
              <rect x="20" y="6.5" width="5.5" height="19" rx="1.6" />
              <rect x="6.5" y="13.25" width="19" height="5.5" rx="1.6" />
            </g>
          </svg>
          <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: 9 }}>
            HEPHERA
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: -2,
          }}
        >
          <span>{dict.hero.titleStart}&nbsp;</span>
          <span style={{ color: "#ff9d42" }}>{dict.hero.titleAccent}&nbsp;</span>
          <span>{dict.hero.titleEnd}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 30,
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#8a8377",
          }}
        >
          <span>{dict.hero.eyebrow}</span>
          <span style={{ color: "#ff7a18" }}>hephera.com</span>
        </div>
      </div>
    ),
    size,
  );
}
