"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronUp } from "lucide-react";

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

/** A stretch of scroll. "scrub" plays its segment of the video along the scroll; "tenue" holds the
 *  segment's last frame with its screen on. `lieu`: the place it belongs to (shown while travelling). */
export type ZoneVoyage = { segment: string; mode: "scrub" | "tenue"; hauteur: number; lieu?: string; page?: number };

/** Where each segment sits in the video, and each landing's screen (fractions of the frame). */
export type DonneesVoyage = {
  duree: number;
  largeur: number;
  hauteur: number;
  segments: Record<
    string,
    {
      debut: number;
      fin: number;
      ecran?: {
        x: number; y: number; w: number; h: number;
        coins?: [number, number][];
        /** where the content may light up (fractions of the screen): never over a character in front */
        libre?: { x: number; y: number; w: number; h: number };
        /** the frame's screen already shows something: the content covers it instead of adding light */
        opaque?: boolean;
      };
    }
  >;
};

/** A journey: its video files (desktop + vertical phone version), its scroll layout, its places. */
export type ConfigVoyage = {
  bureau: string;
  mobile: string;
  /** light versions (≈ 2-3 MB, 12 fps) downloaded first so scrolling drives the video within seconds;
   *  the HD file then arrives in the background and takes over without a cut */
  bureauRapide?: string;
  mobileRapide?: string;
  donnees: string;
  donneesMobile: string;
  affiche: string;
  afficheMobile: string;
  dossier: string;
  dossierMobile: string;
  zones: ZoneVoyage[];
  /** every segment, in video order */
  ordre: string[];
  /** the landings: segments ending on a wall screen */
  paliers: string[];
  /** the travelling segments: the display shows where we are heading */
  transits: string[];
  /** the places, in order (elevator floors, city districts) */
  lieux: string[];
  /** how far the camera may push in toward a lit screen (1.05 by default: the video does the close-up;
   *  higher when the scene's screens are far, at the cost of a slightly softer picture) */
  zoomMax?: number;
  /** same, on phones (the portrait screens are smaller in the frame: push in further so the text stays readable) */
  zoomMaxMobile?: number;
  /** width (px) the screen content is laid out at before being scaled onto the wall: smaller = bigger text */
  largeurEcran?: number;
};
/** The screen content is laid out once at this size, then scaled onto each wall. */
export const ECRAN_L = 970;
export const ECRAN_H = 540;
/** Phones: portrait screens, laid out at phone width. */
const ECRAN_L_MOBILE = 400;
/** Same breakpoint as the pages' useMobile(). */
const MOBILE = "(max-width: 47.99rem)";

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
  config: ConfigVoyage;
  sectionRef: RefObject<HTMLElement | null>;
  titre: ReactNode;
  noms: Record<string, string>;
  libelleEtage: string;
  afficheur: string;
  mobile: boolean;
  /** What a landing's screen shows for a given zone (desktop: drawn on the wall). */
  ecran: (zone: number) => ReactNode;
  onZone: (zone: number) => void;
  onAller: (lieu: string) => void;
  /** the display's icon while travelling (an up arrow in an elevator) */
  iconeTransit?: ReactNode;
  /** the side navigation: numbered elevator buttons, or small dots for a long journey */
  boutons?: "numeros" | "points";
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
export function SceneVoyage({ config, sectionRef, titre, noms, libelleEtage, afficheur, mobile, ecran, onZone, onAller, iconeTransit, boutons = "numeros" }: Props) {
  const { zones, ordre, paliers, transits, lieux } = config;
  const tour = config;
  const sceneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoHDRef = useRef<HTMLVideoElement>(null);   // the HD file, once it has caught up with the light one
  const titreRef = useRef<HTMLDivElement>(null);
  const [donnees, setDonnees] = useState<DonneesVoyage | null>(null);
  const [zone, setZone] = useState(0);
  const [boite, setBoite] = useState<(Rect & { cw: number; ch: number }) | null>(null);   // video box + stage size, px
  const [video, setVideo] = useState<"attente" | "ok" | "non">("attente");
  const [hd, setHd] = useState(false);               // the HD player has taken over
  const [arrive, setArrive] = useState(false);       // second half of a climb: the display shows the new floor
  const [charge, setCharge] = useState(0);           // share of the video already downloaded

  useEffect(() => {
    let annule = false;
    fetch(mobile ? tour.donneesMobile : tour.donnees)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: DonneesVoyage | null) => !annule && j && setDonnees(j))
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [mobile, tour.donnees, tour.donneesMobile]);

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

  // Read through refs by the camera loop: when these change, the loop keeps running and the video
  // is NOT downloaded again (it used to be fetched up to three times on a phone).
  const donneesRef = useRef(donnees);
  const placerRef = useRef(placer);
  const onZoneRef = useRef(onZone);
  useEffect(() => {
    donneesRef.current = donnees;
    placerRef.current = placer;
    onZoneRef.current = onZone;
  });

  useEffect(() => {
    const section = sectionRef.current;
    const v0 = videoRef.current;
    const v1 = videoHDRef.current;
    if (!section || !v0 || !v1) return;
    let v = v0;                          // the player the scroll drives (light file first, then HD)
    const espaceurs = [...section.querySelectorAll<HTMLElement>("[data-zone]")];
    const economie = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let zoneActuelle = -1;
    let arriveActuel = false;
    let lisse = 0;
    let enCours = false;
    let raf = 0;
    let visible = true;
    let dernierTic = performance.now();
    const eveillees = new WeakSet<HTMLVideoElement>();   // players Safari has woken up (see reveiller)

    const segment = (id: string) => {
      const donnees = donneesRef.current;
      if (donnees) {
        // A partial video (trial cut): missing segments hold on the last frame there is.
        const s = donnees.segments[id];
        return s ?? { debut: donnees.duree - 0.05, fin: donnees.duree };
      }
      const d = Number.isFinite(v.duration) ? v.duration : 60;
      const n = ordre.indexOf(id);
      return { debut: (d * n) / ordre.length, fin: (d * (n + 1)) / ordre.length };
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
        onZoneRef.current(i);
      }
      // The title card belongs to the first metres of the approach.
      if (titreRef.current) {
        const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 1.1)));
        titreRef.current.style.opacity = String(Math.max(0, 1 - p * 1.3));
        titreRef.current.style.transform = `translate3d(0, ${(-p * 40).toFixed(1)}px, 0) scale(${(1 + p * 0.06).toFixed(3)})`;
      }
      const z = zones[i];
      const a = !!z && z.mode === "scrub" && transits.includes(z.segment) && local > 0.6;
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

    const onSeeked = (e: Event) => {
      if (e.target === v) enCours = false;
    };
    const onPlay = (e: Event) => {
      const el = e.target as HTMLVideoElement;
      if (eveillees.has(el)) el.pause();
    };
    const onErreur = (e: Event) => {
      if (e.target !== v) return;        // a failed HD file: stay on the light one
      enCours = false;
      setVideo("non");
    };
    const onMeta = (e: Event) => {
      if (e.target !== v0) return;
      setVideo("ok");
      placerRef.current();
    };
    const onProgres = () => {
      const d = v0.duration;
      if (!Number.isFinite(d) || d <= 0 || !v0.buffered.length) return;
      setCharge((c) => Math.max(c, Math.min(1, v0.buffered.end(v0.buffered.length - 1) / d)));
    };
    v0.addEventListener("progress", onProgres);
    v0.addEventListener("canplaythrough", onProgres);
    for (const el of [v0, v1]) {
      el.addEventListener("play", onPlay);
      el.addEventListener("seeked", onSeeked);
      el.addEventListener("error", onErreur);
      el.addEventListener("loadedmetadata", onMeta);
    }

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

    // The video waits for the page to load (a short idle at most: it is what the visitor waits for). Data saving: stills only.
    let attente = 0;
    const charger = () => {
      const connexion = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (connexion?.saveData) {
        setVideo("non");
        return;
      }
      const telephone = window.matchMedia(MOBILE).matches;
      const adresseHD = telephone ? tour.mobile : tour.bureau;
      const rapide = telephone ? tour.mobileRapide : tour.bureauRapide;
      // On a slow connection the light file is all we load (the HD one would take minutes).
      const lent = /(^|-)2g$|^3g$/.test(connexion?.effectiveType ?? "");
      const premiere = rapide ?? adresseHD;
      /* Each file is downloaded WHOLE first, then played from memory: scrubbing a video that is still
         streaming makes every jump past the downloaded part wait for the network (the jerks seen in
         production). Progress feeds the loading bar; until then each floor shows its still. */
      for (const el of [v0, v1]) el.preload = "auto";   // Safari loads nothing with preload="none", even after load()
      enMemoire(premiere, true)
        .then((url) => {
          if (annule) return;
          v0.src = url;
          v0.load();
          reveiller();
          if (rapide && !lent) enMemoire(adresseHD, false).then(basculer).catch(() => {});
        })
        .catch(() => {
          if (annule) return;
          v0.src = premiere;                       // no fetch streaming: let the browser stream it
          v0.load();
          reveiller();
        });
    };
    /* The HD file is ready: it is put on the same frame as the light one, then shown on top; the light
       one is emptied (memory). The scroll keeps driving whichever player is active: no cut, no jump. */
    const basculer = (url: string) => {
      if (annule) return;
      v1.src = url;
      v1.load();
      const caler = () => {
        v1.currentTime = v.currentTime;
        v1.addEventListener(
          "seeked",
          () => {
            if (annule) return;
            v = v1;
            enCours = false;
            setHd(true);
            window.setTimeout(() => {
              if (annule) return;
              v0.removeAttribute("src");
              v0.load();
              URL.revokeObjectURL(urlsMemoire[0] ?? "");
            }, 800);
          },
          { once: true },
        );
      };
      v1.addEventListener("loadeddata", caler, { once: true });
      reveiller();
    };
    let annule = false;
    const urlsMemoire: string[] = [];
    const arret = new AbortController();
    const enMemoire = async (adresse: string, barre: boolean) => {
      const rep = await fetch(adresse, { signal: arret.signal });
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
        if (taille && barre) setCharge(Math.min(0.99, recu / taille));
      }
      if (annule) throw new Error("annulé");
      if (barre) setCharge(1);
      const url = URL.createObjectURL(new Blob(morceaux as BlobPart[], { type: "video/mp4" }));
      urlsMemoire.push(url);
      return url;
    };
    /* Safari (iPhone first) decodes and buffers nothing until play() has been called once, so
       seeking does nothing: a muted, inline play() then an immediate pause() wakes it up. A refused
       play() (low power mode) is tried again on the first touch or key press. */
    const reveiller = () => {
      for (const el of [v0, v1]) {
        if (eveillees.has(el) || !el.getAttribute("src")) continue;
        el.muted = true;
        el.setAttribute("muted", "");           // Safari reads the attribute, React only sets the property
        const essai = el.play();
        if (!essai) continue;
        essai
          .then(() => {
            eveillees.add(el);
            el.pause();
            if (el === v) el.currentTime = Math.max(0, lisse);
          })
          .catch(() => {});
      }
    };
    window.addEventListener("touchstart", reveiller, { passive: true });
    window.addEventListener("pointerdown", reveiller);
    window.addEventListener("keydown", reveiller);
    const plusTard = () => {
      const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
      attente = w.requestIdleCallback ? w.requestIdleCallback(charger, { timeout: 250 }) : window.setTimeout(charger, 50);
    };
    if (document.readyState === "complete") plusTard();
    else window.addEventListener("load", plusTard, { once: true });

    raf = requestAnimationFrame(boucle);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      annule = true;
      arret.abort();
      urlsMemoire.forEach((u) => URL.revokeObjectURL(u));
      window.clearTimeout(attente);
      window.clearInterval(secours);
      window.removeEventListener("scroll", surDefilement);
      window.removeEventListener("touchstart", reveiller);
      window.removeEventListener("pointerdown", reveiller);
      window.removeEventListener("keydown", reveiller);
      window.removeEventListener("resize", surDefilement);
      vigie.disconnect();
      for (const el of [v0, v1]) {
        el.removeEventListener("seeked", onSeeked);
        el.removeEventListener("play", onPlay);
        el.removeEventListener("error", onErreur);
        el.removeEventListener("loadedmetadata", onMeta);
      }
      v0.removeEventListener("progress", onProgres);
      v0.removeEventListener("canplaythrough", onProgres);
    };
  }, [sectionRef, zones, ordre, transits, tour.bureau, tour.mobile, tour.bureauRapide, tour.mobileRapide]);

  const z = zones[zone];
  const allume = z?.mode === "tenue";
  const destination = z?.lieu ? lieux.indexOf(z.lieu) : 0;
  const etage = z?.mode === "scrub" && z && transits.includes(z.segment) && !arrive ? Math.max(0, destination - 1) : destination;
  const enMontee = z?.mode === "scrub" && !!z && transits.includes(z.segment);

  // Each landing's screen rectangle, in stage pixels.
  const rectEcran = (id: string): Rect | null => {
    const e = donnees?.segments[id]?.ecran;
    if (!e || !boite) return null;
    return { x: boite.x + e.x * boite.w, y: boite.y + e.y * boite.h, w: e.w * boite.w, h: e.h * boite.h };
  };

  // On a landing the camera pushes in until the screen fills about three quarters of the view,
  // and pulls back out before the elevator. Phones push in up to zoomMaxMobile when the scene sets it.
  const cible = allume ? rectEcran(z.segment) : null;
  let zoom = "none";
  if (cible && boite) {
    const k = Math.min((mobile ? config.zoomMaxMobile : undefined) ?? config.zoomMax ?? 1.05, Math.max(1, Math.min((0.9 * boite.cw) / cible.w, (0.86 * boite.ch) / cible.h)));
    const cx = cible.x + cible.w / 2;
    const cy = cible.y + cible.h / 2;
    zoom = `translate(${boite.cw / 2}px, ${boite.ch / 2}px) scale(${k.toFixed(4)}) translate(${-cx}px, ${-cy}px)`;
  }

  return (
    <div ref={sceneRef} className="labs-scene sticky top-0 -mb-[100svh] h-svh overflow-hidden bg-ink-950">
      <div className="labs-camera absolute inset-0">
        <div className="labs-zoom absolute inset-0 origin-top-left" style={{ transform: zoom }}>
        {/* Until the video arrives, the approach's first frame. */}
        {/* The phone or desktop poster is chosen by the browser from the first HTML (<picture>):
            no desktop picture downloaded then swapped on a phone once the script runs. */}
        <picture>
          <source media={MOBILE} srcSet={tour.afficheMobile} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tour.affiche}
            alt=""
            aria-hidden
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover transition-opacity duration-700"
            style={{ opacity: video === "ok" ? 0 : 1 }}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </picture>
        {/* Until the video is there, the current landing's still (only that one is downloaded). */}
        {video !== "ok" && z && paliers.includes(z.segment) && (
          <picture key={z.segment}>
            <source media={MOBILE} srcSet={`${tour.dossierMobile}/${z.segment}.jpg`} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${tour.dossier}/${z.segment}.jpg`} alt="" aria-hidden className="labs-apparition absolute inset-0 size-full object-cover" />
          </picture>
        )}
{[videoRef, videoHDRef].map((ref, n) => (
          <video
            key={n}
            ref={ref}
            muted
            playsInline
            preload="none"
            aria-hidden
            className="absolute max-w-none transition-opacity duration-500"
            style={
              boite
                ? { left: boite.x, top: boite.y, width: boite.w, height: boite.h, opacity: video === "ok" && (n === 1) === hd ? 1 : 0 }
                : { inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0 }
            }
          />
        ))}

        {/* The wall screens (desktop). On a phone the content flows in the page instead.
            No box of their own: the content is light added onto the real screen of the frame
            (mix-blend screen), projected onto its four measured corners, edges feathered. */}
        {boite &&
          paliers.map((id) => {
            const e = donnees?.segments[id]?.ecran;
            if (!e) return null;
            const coins: Point[] = (e.coins ?? [[e.x, e.y], [e.x + e.w, e.y], [e.x + e.w, e.y + e.h], [e.x, e.y + e.h]]).map(
              ([cx, cy]) => [boite.x + cx * boite.w, boite.y + cy * boite.h],
            );
            const largeurPx = (Math.hypot(coins[1][0] - coins[0][0], coins[1][1] - coins[0][1]) + Math.hypot(coins[2][0] - coins[3][0], coins[2][1] - coins[3][1])) / 2;
            const hauteurPx = (Math.hypot(coins[3][0] - coins[0][0], coins[3][1] - coins[0][1]) + Math.hypot(coins[2][0] - coins[1][0], coins[2][1] - coins[1][1])) / 2;
            const ratio = largeurPx / hauteurPx;
            // Phones: always laid out at phone width (a wide billboard just gets a short layout).
            const base = config.largeurEcran ?? ECRAN_L;
            const W = mobile ? ECRAN_L_MOBILE : Math.max(base, ECRAN_H * (base / ECRAN_L) * ratio);
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
                <div
                  className="labs-ecran-contenu absolute"
                  data-opaque={e.opaque ? "" : undefined}
                  style={{
                    left: `${(e.libre?.x ?? 0) * 100}%`,
                    top: `${(e.libre?.y ?? 0) * 100}%`,
                    width: `${(e.libre?.w ?? 1) * 100}%`,
                    height: `${(e.libre?.h ?? 1) * 100}%`,
                  }}
                >
                  {zones.map((zz, n) =>
                    zz.segment === id && zz.mode === "tenue" ? (
                      <div key={n} className="labs-page absolute inset-0 overflow-hidden" data-visible={n === zone ? "" : undefined} inert={n !== zone}>
                        <Ajuste hauteur={H * (e.libre?.h ?? 1)}>{ecran(n)}</Ajuste>
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
        {iconeTransit ?? <ChevronUp className="size-4 text-ember-400" aria-hidden />}
        <span key={etage} className="labs-chiffre font-display tabular-nums">{String(etage).padStart(2, "0")}</span>
        <span key={`n${etage}`} className="labs-chiffre text-bone-300">{noms[lieux[etage]]}</span>
      </div>

      {/* The elevator's buttons. */}
      <nav aria-label={afficheur} className="absolute top-1/2 right-6 z-30 hidden -translate-y-1/2 md:block">
        <ol className={`flex flex-col ${boutons === "points" ? "gap-1" : "gap-2"}`}>
          {[...lieux].reverse().map((c) => {
            const n = lieux.indexOf(c);
            const ici = z?.lieu === c;
            return (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => onAller(c)}
                  aria-current={ici ? "step" : undefined}
                  aria-label={`${libelleEtage} ${n} · ${noms[c]}`}
                  title={noms[c]}
                  data-ici={ici ? "" : undefined}
                  className={
                    boutons === "points"
                      ? "group grid size-6 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-ember-400"
                      : "labs-bouton grid size-11 place-items-center rounded-full font-display text-xs tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-400"
                  }
                >
                  {boutons === "points" ? (
                    <span aria-hidden className={`block rounded-full transition-all duration-300 ${ici ? "size-2.5 bg-ember-400 shadow-[0_0_10px_rgba(255,157,66,0.9)]" : "size-1.5 bg-bone-300/50 group-hover:bg-bone-50"}`} />
                  ) : (
                    String(n).padStart(2, "0")
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
