"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronUp } from "lucide-react";

import { couches, tour, zones, type CoucheId, type DonneesTour, type SegmentId } from "@/lib/labs";

type Rect = { x: number; y: number; w: number; h: number };
type Point = [number, number];

/**
 * The CSS matrix3d that maps a w×h box onto four corners (top-left, top-right,
 * bottom-right, bottom-left): a projective transform (Heckbert's square-to-quad),
 * so the content sits on the wall screen with its real, slightly off-square
 * perspective instead of a rectangle that overshoots one corner and misses another.
 */
function versCoins(w: number, h: number, [p0, p1, p2, p3]: Point[]): string {
  const [x0, y0] = p0, [x1, y1] = p1, [x2, y2] = p2, [x3, y3] = p3;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let a, b, d, e, g, k;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) {
    a = x1 - x0; b = x3 - x0; d = y1 - y0; e = y3 - y0; g = 0; k = 0;
  } else {
    const det = dx1 * dy2 - dx2 * dy1;
    g = (dx3 * dy2 - dx2 * dy3) / det;
    k = (dx1 * dy3 - dx3 * dy1) / det;
    a = x1 - x0 + g * x1; b = x3 - x0 + k * x3;
    d = y1 - y0 + g * y1; e = y3 - y0 + k * y3;
  }
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(8)).join(",")})`;
}

const ORDRE: SegmentId[] = ["A", "P0", "M1", "P1", "M2", "P2", "M3", "P3", "M4", "T"];
const LANDINGS: SegmentId[] = ["P0", "P1", "P2", "P3", "T"];
/** The screen content is laid out once at this size, then scaled onto each wall. */
export const ECRAN_L = 970;
export const ECRAN_H = 540;
/** Phones: portrait screens, laid out at phone width. */
const ECRAN_L_MOBILE = 400;

/** Shrinks its content just enough to fit the screen it is on: nothing is ever cut off. */
function Ajuste({ hauteur, children }: { hauteur: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [echelle, setEchelle] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mesurer = () => setEchelle(Math.min(1, hauteur / Math.max(1, el.scrollHeight)));
    mesurer();
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    if (el.firstElementChild) obs.observe(el.firstElementChild);   // the content grows as a demo plays
    return () => obs.disconnect();
  }, [hauteur]);
  return (
    <div ref={ref} className="origin-top" style={{ transform: echelle < 1 ? `scale(${echelle})` : undefined, height: echelle < 1 ? hauteur / echelle : "100%" }}>
      {children}
    </div>
  );
}

type Props = {
  sectionRef: RefObject<HTMLElement | null>;
  titre: ReactNode;
  noms: Record<CoucheId, string>;
  libelleEtage: string;
  afficheur: string;
  mobile: boolean;
  /** What a landing's screen shows for a given zone (desktop: drawn on the wall). */
  ecran: (zone: number) => ReactNode;
  onZone: (zone: number) => void;
  onAller: (c: CoucheId) => void;
};

/**
 * The camera. One stage stuck to the screen holds the video, the wall screens
 * and the elevator display, under one shared grain, vignette and drift, so it
 * all reads as a single picture.
 *
 * Scroll drives the video's time zone by zone (lib/labs.ts → zones): a "scrub"
 * zone plays its segment, a "tenue" zone holds the landing's last frame while
 * its screen is on. Seeking follows the hero's rule (hero-scene.tsx): never
 * flood the decoder; the file is all-intra so any frame decodes on its own.
 * The video is placed by hand (not object-cover) so each landing's screen
 * rectangle, measured on the frame, lands exactly on the wall.
 */
export function Tour({ sectionRef, titre, noms, libelleEtage, afficheur, mobile, ecran, onZone, onAller }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titreRef = useRef<HTMLDivElement>(null);
  const [donnees, setDonnees] = useState<DonneesTour | null>(null);
  const [zone, setZone] = useState(0);
  const [boite, setBoite] = useState<(Rect & { cw: number; ch: number }) | null>(null);   // video box + stage size, px
  const [video, setVideo] = useState<"attente" | "ok" | "non">("attente");
  const [arrive, setArrive] = useState(false);       // second half of a climb: the display shows the new floor
  const [charge, setCharge] = useState(0);           // share of the video already downloaded

  useEffect(() => {
    let annule = false;
    fetch(mobile ? tour.donneesMobile : tour.donnees)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: DonneesTour | null) => !annule && j && setDonnees(j))
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [mobile]);

  // Cover the stage with the frame (the landing screens sit near the centre of it).
  const placer = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const L = donnees?.largeur ?? (mobile ? 1080 : 1920);
    const H = donnees?.hauteur ?? (mobile ? 1920 : 1080);
    const cw = scene.clientWidth;
    const ch = scene.clientHeight;
    const s = Math.max(cw / L, ch / H);
    setBoite({ x: (cw - L * s) / 2, y: (ch - H * s) / 2, w: L * s, h: H * s, cw, ch });
  }, [donnees, mobile]);

  useEffect(() => {
    placer();
    window.addEventListener("resize", placer);
    return () => window.removeEventListener("resize", placer);
  }, [placer]);

  useEffect(() => {
    const section = sectionRef.current;
    const v = videoRef.current;
    if (!section || !v) return;
    const espaceurs = [...section.querySelectorAll<HTMLElement>("[data-zone]")];
    const economie = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let zoneActuelle = -1;
    let arriveActuel = false;
    let lisse = 0;
    let enCours = false;
    let raf = 0;
    let visible = true;
    let dernierTic = performance.now();
    let eveillee = false;               // Safari woken up (see reveiller)

    const segment = (id: SegmentId) => {
      if (donnees) {
        // A partial video (trial cut): missing segments hold on the last frame there is.
        const s = donnees.segments[id];
        return s ?? { debut: donnees.duree - 0.05, fin: donnees.duree };
      }
      const d = Number.isFinite(v.duration) ? v.duration : 60;
      const n = ORDRE.indexOf(id);
      return { debut: (d * n) / ORDRE.length, fin: (d * (n + 1)) / ORDRE.length };
    };

    const mesurer = () => {
      const h = window.innerHeight;
      let i = 0;
      let local = 0;
      espaceurs.forEach((e, n) => {
        const r = e.getBoundingClientRect();
        if (r.top <= h * 0.5) {
          i = n;
          local = Math.min(1, Math.max(0, (h * 0.5 - r.top) / Math.max(1, r.height)));
        }
      });
      return { i, local };
    };

    const boucle = () => {
      raf = 0;
      dernierTic = performance.now();
      const { i, local } = mesurer();
      if (i !== zoneActuelle) {
        zoneActuelle = i;
        setZone(i);
        onZone(i);
      }
      // The title card belongs to the first metres of the approach.
      if (titreRef.current) {
        const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 1.1)));
        titreRef.current.style.opacity = String(Math.max(0, 1 - p * 1.3));
        titreRef.current.style.transform = `translate3d(0, ${(-p * 40).toFixed(1)}px, 0) scale(${(1 + p * 0.06).toFixed(3)})`;
      }
      const z = zones[i];
      const a = !!z && z.mode === "scrub" && z.segment.startsWith("M") && local > 0.6;
      if (a !== arriveActuel) {
        arriveActuel = a;
        setArrive(a);
      }
      if (v.readyState >= 1 && z) {
        const seg = segment(z.segment);
        // Reduced motion: no travelling, each zone shows its end frame.
        const avance = z.mode === "tenue" || economie ? 1 : local;
        const cible = seg.debut + avance * (seg.fin - seg.debut - 0.05);
        lisse = economie ? cible : lisse + (cible - lisse) * 0.16;
        if (Math.abs(cible - lisse) < 0.004) lisse = cible;
        if (!enCours && Math.abs(v.currentTime - lisse) > 1 / 60) {
          enCours = true;
          v.currentTime = Math.max(0, lisse);
        }
      }
      if (visible) raf = requestAnimationFrame(boucle);
    };

    const onSeeked = () => {
      enCours = false;
    };
    const onPlay = () => {
      if (eveillee) v.pause();
    };
    v.addEventListener("play", onPlay);
    const onErreur = () => {
      enCours = false;
      setVideo("non");
    };
    const onMeta = () => {
      setVideo("ok");
      placer();
    };
    const onProgres = () => {
      const d = v.duration;
      if (!Number.isFinite(d) || d <= 0 || !v.buffered.length) return;
      setCharge((c) => Math.max(c, Math.min(1, v.buffered.end(v.buffered.length - 1) / d)));
    };
    v.addEventListener("progress", onProgres);
    v.addEventListener("canplaythrough", onProgres);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("error", onErreur);
    v.addEventListener("loadedmetadata", onMeta);

    const vigie = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? true;
      if (visible && !raf) raf = requestAnimationFrame(boucle);
    });
    vigie.observe(section);

    // Some contexts never run animation frames (an app's embedded browser, a throttled tab):
    // the scroll itself drives the camera too, and a timer keeps the smoothing going.
    const surDefilement = () => {
      if (performance.now() - dernierTic > 120) {
        if (raf) cancelAnimationFrame(raf);
        boucle();
      }
    };
    window.addEventListener("scroll", surDefilement, { passive: true });
    window.addEventListener("resize", surDefilement);
    const secours = window.setInterval(() => {
      if (visible && performance.now() - dernierTic > 120) {
        if (raf) cancelAnimationFrame(raf);
        boucle();
      }
    }, 33);

    // The video waits for the page to load and the browser to be idle. Data saving: stills only.
    let attente = 0;
    const charger = () => {
      if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) {
        setVideo("non");
        return;
      }
      v.preload = "auto";                       // Safari loads nothing with preload="none", even after load()
      const adresse = window.matchMedia("(max-width: 47.99rem)").matches ? tour.mobile : tour.bureau;
      /* The WHOLE file is downloaded first, then played from memory: scrubbing a video that is still
         streaming makes every jump past the downloaded part wait for the network (the jerks seen in
         production). Progress feeds the loading bar; until then each floor shows its still. */
      enMemoire(adresse)
        .then((url) => {
          if (annule) return;
          v.src = url;
          v.load();
          reveiller();
        })
        .catch(() => {
          if (annule) return;
          v.src = adresse;                       // no fetch streaming: let the browser stream it
          v.load();
          reveiller();
        });
    };
    let annule = false;
    let urlMemoire = "";
    const enMemoire = async (adresse: string) => {
      const rep = await fetch(adresse);
      if (!rep.ok || !rep.body) throw new Error(String(rep.status));
      const taille = Number(rep.headers.get("content-length")) || 0;
      const lecteur = rep.body.getReader();
      const morceaux: Uint8Array[] = [];
      let recu = 0;
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done || annule) break;
        morceaux.push(value);
        recu += value.length;
        if (taille) setCharge(Math.min(0.99, recu / taille));
      }
      setCharge(1);
      urlMemoire = URL.createObjectURL(new Blob(morceaux as BlobPart[], { type: "video/mp4" }));
      return urlMemoire;
    };
    /* Safari (iPhone first) decodes and buffers nothing until play() has been called once, so
       seeking does nothing: a muted, inline play() then an immediate pause() wakes it up. A refused
       play() (low power mode) is tried again on the first touch or key press. */
    const reveiller = () => {
      if (eveillee || !v.src) return;
      v.muted = true;
      v.setAttribute("muted", "");             // Safari reads the attribute, React only sets the property
      const essai = v.play();
      if (!essai) return;
      essai
        .then(() => {
          eveillee = true;
          v.pause();
          v.currentTime = Math.max(0, lisse);
        })
        .catch(() => {});
    };
    window.addEventListener("touchstart", reveiller, { passive: true });
    window.addEventListener("pointerdown", reveiller);
    window.addEventListener("keydown", reveiller);
    const plusTard = () => {
      const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
      attente = w.requestIdleCallback ? w.requestIdleCallback(charger, { timeout: 1500 }) : window.setTimeout(charger, 300);
    };
    if (document.readyState === "complete") plusTard();
    else window.addEventListener("load", plusTard, { once: true });

    raf = requestAnimationFrame(boucle);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      annule = true;
      if (urlMemoire) URL.revokeObjectURL(urlMemoire);
      window.clearTimeout(attente);
      window.clearInterval(secours);
      window.removeEventListener("scroll", surDefilement);
      window.removeEventListener("touchstart", reveiller);
      window.removeEventListener("pointerdown", reveiller);
      window.removeEventListener("keydown", reveiller);
      window.removeEventListener("resize", surDefilement);
      vigie.disconnect();
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("error", onErreur);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("progress", onProgres);
      v.removeEventListener("canplaythrough", onProgres);
    };
  }, [sectionRef, donnees, onZone, placer]);

  const z = zones[zone];
  const allume = z?.mode === "tenue";
  const destination = z?.couche ? couches.indexOf(z.couche) : 0;
  const etage = z?.mode === "scrub" && z.segment.startsWith("M") && !arrive ? Math.max(0, destination - 1) : destination;
  const enMontee = z?.mode === "scrub" && z.segment.startsWith("M");

  // Each landing's screen rectangle, in stage pixels.
  const rectEcran = (id: SegmentId): Rect | null => {
    const e = donnees?.segments[id]?.ecran;
    if (!e || !boite) return null;
    return { x: boite.x + e.x * boite.w, y: boite.y + e.y * boite.h, w: e.w * boite.w, h: e.h * boite.h };
  };

  // On a landing the camera pushes in until the screen fills about three quarters of the view,
  // and pulls back out before the elevator. Phones keep the wide shot (the content flows below).
  const cible = allume ? rectEcran(z.segment) : null;
  let zoom = "none";
  if (cible && boite) {
    const k = Math.min(1.05, Math.max(1, Math.min((0.9 * boite.cw) / cible.w, (0.86 * boite.ch) / cible.h)));
    const cx = cible.x + cible.w / 2;
    const cy = cible.y + cible.h / 2;
    zoom = `translate(${boite.cw / 2}px, ${boite.ch / 2}px) scale(${k.toFixed(4)}) translate(${-cx}px, ${-cy}px)`;
  }

  return (
    <div ref={sceneRef} className="labs-scene sticky top-0 -mb-[100svh] h-svh overflow-hidden bg-ink-950">
      <div className="labs-camera absolute inset-0">
        <div className="labs-zoom absolute inset-0 origin-top-left" style={{ transform: zoom }}>
        {/* Until the video arrives, the approach's first frame. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mobile ? tour.afficheMobile : tour.affiche}
          alt=""
          aria-hidden
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover transition-opacity duration-700"
          style={{ opacity: video === "ok" ? 0 : 1 }}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        {video !== "ok" &&
          LANDINGS.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={id}
              src={`${mobile ? tour.dossierMobile : tour.dossier}/${id}.jpg`}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-opacity duration-700"
              style={{ opacity: z?.segment === id ? 1 : 0 }}
            />
          ))}
        <video
          ref={videoRef}
          muted
          playsInline
          preload="none"
          aria-hidden
          className="absolute max-w-none transition-opacity duration-500"
          style={
            boite
              ? { left: boite.x, top: boite.y, width: boite.w, height: boite.h, opacity: video === "ok" ? 1 : 0 }
              : { inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0 }
          }
        />

        {/* The wall screens (desktop). On a phone the content flows in the page instead.
            No box of their own: the content is light added onto the real screen of the frame
            (mix-blend screen), projected onto its four measured corners, edges feathered. */}
        {boite &&
          LANDINGS.map((id) => {
            const e = donnees?.segments[id]?.ecran;
            if (!e) return null;
            const coins: Point[] = (e.coins ?? [[e.x, e.y], [e.x + e.w, e.y], [e.x + e.w, e.y + e.h], [e.x, e.y + e.h]]).map(
              ([cx, cy]) => [boite.x + cx * boite.w, boite.y + cy * boite.h],
            );
            const largeurPx = (Math.hypot(coins[1][0] - coins[0][0], coins[1][1] - coins[0][1]) + Math.hypot(coins[2][0] - coins[3][0], coins[2][1] - coins[3][1])) / 2;
            const hauteurPx = (Math.hypot(coins[3][0] - coins[0][0], coins[3][1] - coins[0][1]) + Math.hypot(coins[2][0] - coins[1][0], coins[2][1] - coins[1][1])) / 2;
            const ratio = largeurPx / hauteurPx;
            // Phones: always laid out at phone width (a wide billboard just gets a short layout).
            const W = mobile ? ECRAN_L_MOBILE : Math.max(ECRAN_L, ECRAN_H * ratio);
            const H = W / ratio;
            const ici = allume && z?.segment === id;
            return (
              <div
                key={id}
                className="labs-ecran absolute top-0 left-0 origin-top-left"
                data-allume={ici ? "" : undefined}
                style={{ width: W, height: H, transform: versCoins(W, H, coins) }}
                inert={!ici}
                aria-hidden={!ici}
              >
                <div className="labs-ecran-contenu absolute inset-0">
                  {zones.map((zz, n) =>
                    zz.segment === id && zz.mode === "tenue" ? (
                      <div key={n} className="labs-page absolute inset-0 overflow-hidden" data-visible={n === zone ? "" : undefined} inert={n !== zone}>
                        <Ajuste hauteur={H}>{ecran(n)}</Ajuste>
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div ref={titreRef} className="pointer-events-none absolute inset-x-0 top-[18%] z-10 px-5 text-center will-change-transform">
          {titre}
        </div>
      </div>

      {/* One grade for everything: grain and vignette over the video AND the screens. */}
      <div aria-hidden className="labs-grain pointer-events-none absolute inset-0 z-20" />
      <div aria-hidden className="labs-vignette pointer-events-none absolute inset-0 z-20" />

      {/* While the tower arrives (the first visit downloads the video). */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 left-1/2 z-30 w-44 -translate-x-1/2 transition-opacity duration-700"
        style={{ opacity: video !== "non" && charge < 0.98 ? 1 : 0 }}
      >
        <div className="h-px w-full overflow-hidden bg-white/10">
          <div className="h-full bg-ember-400 shadow-[0_0_8px_rgba(255,157,66,0.9)] transition-[width] duration-300" style={{ width: `${Math.round(charge * 100)}%` }} />
        </div>
        <p className="mt-2 text-center text-[0.65rem] tracking-[0.22em] text-bone-300/80 uppercase tabular-nums">{Math.round(charge * 100)} %</p>
      </div>

      {/* The elevator's own display while it climbs: the only thing on screen. */}
      <div
        aria-live="polite"
        className="labs-afficheur pointer-events-none absolute top-24 left-1/2 z-30 -translate-x-1/2 transition-opacity duration-500"
        style={{ opacity: enMontee ? 1 : 0 }}
      >
        <ChevronUp className="size-4 text-ember-400" aria-hidden />
        <span key={etage} className="labs-chiffre font-display tabular-nums">{String(etage).padStart(2, "0")}</span>
        <span key={`n${etage}`} className="labs-chiffre text-bone-300">{noms[couches[etage]]}</span>
      </div>

      {/* The elevator's buttons. */}
      <nav aria-label={afficheur} className="absolute top-1/2 right-6 z-30 hidden -translate-y-1/2 md:block">
        <ol className="flex flex-col gap-2">
          {[...couches].reverse().map((c) => {
            const n = couches.indexOf(c);
            const ici = z?.couche === c;
            return (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => onAller(c)}
                  aria-current={ici ? "step" : undefined}
                  aria-label={`${libelleEtage} ${n} · ${noms[c]}`}
                  title={noms[c]}
                  data-ici={ici ? "" : undefined}
                  className="labs-bouton grid size-11 place-items-center rounded-full font-display text-xs tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-400"
                >
                  {String(n).padStart(2, "0")}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
