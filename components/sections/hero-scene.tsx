"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import donneesEcran from "@/lib/hero-robot-ecran.json";
import boucle from "@/lib/hero-robot-boucle.json";
import {
  DUREE_TOTALE,
  TEXTURE,
  dessinerEcran,
  etat,
  matricePerspective,
  type Oeil,
} from "./hero-ecran";

/* The word shows up a few seconds after load, then every 7 seconds of eyes. */
const PREMIER_MOT = 3000;
const ENTRE_DEUX_MOTS = 7000;

/* Re-encoded all-intra (every frame a keyframe) at 1920px. Scrubbing seeks
   to a new time on every mouse move: with the original encode, one keyframe
   for 97 frames, each seek had to decode from the start of the clip. */
const VIDEO_URL = "/videos/hero-robot-intra.mp4";

/* The clip's first frame, shown at once. It is the hero's largest element, so
   it is what the page is judged on: a light, preloaded image instead of a
   4 MB video. The video, once loaded, starts on this exact frame and replaces
   it without a visible change. */
const POSTER_URL = "/videos/hero-robot-debut.jpg";

/* Touch screens have no mouse to turn the head, so the robot looks around on
   its own: an 11 s loop cut from the same frames (pause, front, far side,
   front, back), starting and ending on the first frame so it takes over from
   the image without a jump. lib/hero-robot-boucle.json maps each of its
   frames to the clip frame it shows, for the screen overlay. 1.2 MB, a
   regular encode: it plays, it is never scrubbed. */
const BOUCLE_URL = "/videos/hero-robot-boucle.mp4";

/* A full sweep across the screen moves through 80 % of the clip. */
const SENSITIVITY = 0.8;

const RATIO_VIDEO = 1920 / 1086;

/* How the video is cropped when it covers the hero (`object-position`). */
const CADRAGE = { x: 0.7, y: 0.5 };

/* The framing shared by the first-frame image and the video, so one replaces
   the other without moving. It covers the hero, except on portrait screens
   narrower than a laptop: covering those would blow the head up to the full
   width, with no room for the rings, so there the picture is shown whole,
   smaller, centred on the head, and fades out top and bottom.
   max-w-none: there the picture is wider than the screen, and Tailwind caps
   images and videos at 100% of their parent. */
const CADRE_VIDEO =
  "absolute inset-0 z-0 h-full w-full max-w-none object-cover object-[70%_center] max-lg:portrait:inset-auto max-lg:portrait:top-[12%] max-lg:portrait:left-[calc(50%-116.28%)] max-lg:portrait:aspect-[1920/1086] max-lg:portrait:h-auto max-lg:portrait:w-[170%] max-lg:portrait:[mask-image:linear-gradient(to_bottom,transparent,black_22%,black_58%,transparent_92%)]";

/**
 * Where the video frame sits in `repere`: its displayed size and the origin
 * of the full frame, crop included. The rings and the screen are both placed
 * from it, so they stay locked to the same picture.
 */
function cadrageAffiche(video: HTMLVideoElement, repere: HTMLElement) {
  const boite = video.getBoundingClientRect();
  const origine = repere.getBoundingClientRect();
  if (!boite.width || !boite.height) return null;
  const affichee =
    boite.width / boite.height > RATIO_VIDEO
      ? { l: boite.width, h: boite.width / RATIO_VIDEO }
      : { l: boite.height * RATIO_VIDEO, h: boite.height };
  return {
    x: boite.left - origine.left - (affichee.l - boite.width) * CADRAGE.x,
    y: boite.top - origine.top - (affichee.h - boite.height) * CADRAGE.y,
    l: affichee.l,
    h: affichee.h,
  };
}

type Logo = { src: string; alt: string; invert?: boolean };
type Orbite = {
  /** Radius as a share of the displayed video width, so the rings keep their
      size relative to the head whatever the screen. */
  rayon: number;
  duree: number;
  horaire: boolean;
  logos: Logo[];
};

/* Nothing may cross the robot. The monitor's half-diagonal is about 0.167 of
   the video width, a badge's half-width about 0.02, and the head drifts a
   little as it turns: 0.21 keeps the inner ring clear of all three. */
const ORBITES: Orbite[] = [
  {
    rayon: 0.21,
    duree: 26,
    horaire: true,
    logos: [
      { src: "/logos/react.svg", alt: "React" },
      { src: "/logos/supabase.svg", alt: "Supabase" },
      { src: "/logos/notion.svg", alt: "Notion" },
      { src: "/logos/google.svg", alt: "Google" },
      { src: "/logos/clude.svg", alt: "Claude" },
    ],
  },
  {
    rayon: 0.27,
    duree: 34,
    horaire: false,
    logos: [
      { src: "/logos/shopify.svg", alt: "Shopify" },
      { src: "/logos/wordpress.svg", alt: "WordPress" },
      { src: "/logos/figma.svg", alt: "Figma" },
      { src: "/logos/stripe.svg", alt: "Stripe" },
      { src: "/logos/vercel.svg", alt: "Vercel" },
    ],
  },
  {
    rayon: 0.33,
    duree: 42,
    horaire: true,
    logos: [
      { src: "/logos/openai.svg", alt: "OpenAI", invert: true },
      { src: "/logos/make.svg", alt: "Make" },
      { src: "/logos/n8n.svg", alt: "n8n" },
      { src: "/logos/python.svg", alt: "Python" },
      { src: "/logos/tailwindcss.svg", alt: "Tailwind CSS" },
    ],
  },
];

/**
 * The robot video, scrubbed by the mouse, with technology logos orbiting its
 * head.
 *
 * With a mouse, the video never plays on its own: horizontal mouse movement
 * scrubs it forward and back. On a touch screen, a loop plays instead, the
 * robot looking around by itself. Only the movement counts, not the position. One seek at a
 * time: a target set while the decoder is still seeking is picked up by
 * `seeked`, instead of flooding it with seeks it can't keep up with.
 *
 * The rings are placed from where the video actually is on screen, measured
 * from its box and its crop, so they follow the head whether the video covers
 * the hero or sits smaller at the top of a phone. The position goes to CSS
 * variables: the rings move without re-rendering anything.
 *
 * THE RINGS NEVER PASS OVER THE ROBOT. Their radii clear the head, and below
 * the head the body fills the frame: every ring fades out just above the
 * shoulders, so what shows is the upper arcs, framing the head. On wide
 * screens they also fade out before the text block: dark badges behind black
 * type would blank out letters.
 */
export function HeroScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cadreRef = useRef<HTMLDivElement>(null);
  const ecranRef = useRef<HTMLCanvasElement>(null);
  /* While the loop plays, the time of the frame actually on screen, from
     requestVideoFrameCallback: currentTime runs slightly ahead of the picture,
     and the screen overlay would lag the head by a frame. -1: not known. */
  const tempsAfficheRef = useRef(-1);

  /* The word on the robot's screen. The canvas is drawn flat, then warped
     onto the screen of the frame on display, every animation frame: the head
     keeps turning with the mouse while the word is up. Nothing runs between
     two words, and nothing starts while the hero is off screen. */
  useEffect(() => {
    const video = videoRef.current;
    const cadre = cadreRef.current;
    const ecran = ecranRef.current;
    if (!video || !cadre || !ecran) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = ecran.getContext("2d");
    if (!ctx) return;

    const images = donneesEcran.images;
    let visible = true;
    let debut = 0;
    let raf = 0;
    let minuteur = 0;

    /* Scrubbed, the video is the clip itself: its time gives the frame. The
       loop is a reordering of the clip: its frame gives, through the map,
       the clip frame on screen. */
    const imageAffichee = () => {
      const enBoucle = video.dataset.mode === "boucle";
      const temps =
        enBoucle && tempsAfficheRef.current >= 0
          ? tempsAfficheRef.current
          : video.currentTime;
      const rang = Math.round(temps * donneesEcran.fps);
      const index = enBoucle
        ? (boucle.sequence[Math.min(boucle.sequence.length - 1, rang)] ?? 0)
        : rang;
      return images[Math.min(images.length - 1, Math.max(0, index))];
    };

    const terminer = () => {
      ecran.style.opacity = "0";
      raf = 0;
      minuteur = window.setTimeout(lancer, ENTRE_DEUX_MOTS);
    };

    const dessiner = (maintenant: number) => {
      const t = maintenant - debut;
      const donnee = imageAffichee();
      const image = cadrageAffiche(video, cadre);
      if (t >= DUREE_TOTALE || !donnee || !image) {
        terminer();
        return;
      }
      const coin = (k: number): [number, number] => [
        image.x + (donnee[k * 2] ?? 0) * image.l,
        image.y + (donnee[k * 2 + 1] ?? 0) * image.h,
      ];
      const oeil = (k: number): Oeil => ({
        u: donnee[8 + k * 4] ?? 0,
        v: donnee[9 + k * 4] ?? 0,
        ru: donnee[10 + k * 4] ?? 0,
        rv: donnee[11 + k * 4] ?? 0,
      });
      ecran.style.transform = matricePerspective([coin(0), coin(1), coin(2), coin(3)]);
      dessinerEcran(ctx, t, [oeil(0), oeil(1)]);
      ecran.style.opacity = String(etat(t).opacite);
      raf = requestAnimationFrame(dessiner);
    };

    /* No need to wait for the video: until it loads (or on a touch screen,
       where it never does), the image shows its first frame, and the screen
       data for frame 0 matches it exactly. */
    const lancer = () => {
      if (!visible || document.hidden) {
        minuteur = window.setTimeout(lancer, 1000);
        return;
      }
      debut = performance.now();
      raf = requestAnimationFrame(dessiner);
    };

    const vigie = new IntersectionObserver(([entree]) => {
      visible = entree?.isIntersecting ?? true;
    });
    vigie.observe(cadre);
    minuteur = window.setTimeout(lancer, PREMIER_MOT);

    return () => {
      window.clearTimeout(minuteur);
      if (raf) cancelAnimationFrame(raf);
      vigie.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let previousX: number | null = null;
    let targetTime = 0;
    let seeking = false;

    const seek = () => {
      if (Math.abs(video.currentTime - targetTime) < 0.001) return;
      seeking = true;
      video.currentTime = targetTime;
    };

    /* The loop fires `seeked` each time it wraps around, and a tap fires a
       `mousemove`: neither may send it back to its start. */
    const enBoucle = () => video.dataset.mode === "boucle";

    const onSeeked = () => {
      seeking = false;
      if (enBoucle()) return;
      if (Math.abs(video.currentTime - targetTime) >= 0.001) seek();
    };

    /* A failed seek must not leave the scrub locked for good. */
    const onError = () => {
      seeking = false;
    };

    /* Some browsers, iOS Safari first, paint nothing until a frame has been
       decoded. A tiny seek once the metadata is in makes the first frame
       show up without playing anything. */
    const onMetadata = () => {
      targetTime = 0.001;
      seek();
    };

    const onMove = (event: MouseEvent) => {
      if (enBoucle()) return;
      if (previousX === null) {
        previousX = event.clientX;
        return;
      }
      const delta = event.clientX - previousX;
      previousX = event.clientX;
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      targetTime = Math.min(
        duration,
        Math.max(
          0,
          targetTime + (delta / window.innerWidth) * SENSITIVITY * duration,
        ),
      );
      if (!seeking) seek();
    };

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.addEventListener("loadedmetadata", onMetadata);
    window.addEventListener("mousemove", onMove, { passive: true });

    /* THE VIDEO ONLY LOADS ONCE THE PAGE IS UP. It waits for the page to
       finish loading and for the browser to be idle, so it never competes
       with what the visitor needs first. With a mouse, the 4 MB clip, to be
       scrubbed. On a touch screen, the 1.2 MB loop, played on its own; not at
       all with reduced motion or data saving, where the first frame, already
       on screen as an image, stays. */
    const souris = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const economie =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
        ?.saveData === true;

    let annule = false;
    let attente = 0;
    let heroVisible = true;
    let rappel = 0;

    /* Only plays while the hero is on screen and the tab in front. A refused
       play() (iOS low power mode) leaves the first frame: nothing breaks. */
    const jouer = () => {
      if (video.dataset.mode !== "boucle" || video.readyState < 2) return;
      if (heroVisible && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };
    const suivreImage = () => {
      if (typeof video.requestVideoFrameCallback !== "function") return;
      rappel = video.requestVideoFrameCallback((_, meta) => {
        tempsAfficheRef.current = meta.mediaTime;
        suivreImage();
      });
    };
    const vigie = new IntersectionObserver(([entree]) => {
      heroVisible = entree?.isIntersecting ?? true;
      jouer();
    });

    const charger = () => {
      if (annule || video.src) return;
      video.preload = "auto";
      if (souris) {
        video.src = VIDEO_URL;
        return;
      }
      video.dataset.mode = "boucle";
      video.loop = true;
      video.addEventListener("canplay", jouer, { once: true });
      suivreImage();
      vigie.observe(video);
      document.addEventListener("visibilitychange", jouer);
      video.src = BOUCLE_URL;
    };
    /* Safari has no requestIdleCallback: a short delay after load stands in. */
    const idle = typeof window.requestIdleCallback === "function";
    const quandInactif = () => {
      attente = idle
        ? window.requestIdleCallback(charger, { timeout: 2000 })
        : window.setTimeout(charger, 500);
    };
    if (souris || !economie) {
      if (document.readyState === "complete") quandInactif();
      else window.addEventListener("load", quandInactif, { once: true });
    }

    return () => {
      annule = true;
      vigie.disconnect();
      document.removeEventListener("visibilitychange", jouer);
      video.removeEventListener("canplay", jouer);
      if (rappel) video.cancelVideoFrameCallback(rappel);
      video.pause();
      if (idle) window.cancelIdleCallback(attente);
      else window.clearTimeout(attente);
      window.removeEventListener("load", quandInactif);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      video.removeEventListener("loadedmetadata", onMetadata);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    /* A padding-free box that is also a size container: the rings below are
       placed in container units, which measure the content box. Measured on
       the padded hero they would be off by its padding. */
    <div className="absolute inset-0 [container-type:size]">
      {/* The first frame, as an image: shown at once, with the video's exact
          framing, and the page's largest element. */}
      <Image
        src={POSTER_URL}
        alt=""
        aria-hidden
        width={1920}
        height={1086}
        /* preload + high priority: the image must arrive before the scripts
           start running, or the browser, busy executing them, paints it late
           even once downloaded. (`priority` is deprecated in Next 16.) */
        preload
        fetchPriority="high"
        sizes="(max-width: 1023px) and (orientation: portrait) 170vw, 100vw"
        className={CADRE_VIDEO}
      />

      {/* No src here: the effect above sets it, and only with a mouse, once
          the page has loaded. Until then it is transparent and the image
          shows through. */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="none"
        aria-hidden
        className={CADRE_VIDEO}
      />

      {/* The screen overlay: drawn at texture size, warped onto the robot's
          screen by a matrix3d from its top-left corner. Invisible between two
          words. */}
      <canvas
        ref={ecranRef}
        width={TEXTURE.l}
        height={TEXTURE.h}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-0 origin-top-left opacity-0"
        style={{ width: TEXTURE.l, height: TEXTURE.h }}
      />

      {/* THE RINGS ARE PLACED BY CSS ALONE, from the container's size and the
          same framing as the video: they are in place from the first paint.
          Placed by script, they appeared at a default spot and then jumped to
          the head once measured, a visible jump and a layout shift that
          cost the page its mobile score.
            --vl  width of the displayed frame (cover: the larger of the
                  container width and height x 1920/1086)
            --cx  head centre, 68.4 % across the frame, minus the crop
                  (object-position 70 %)
            --cy  head centre, 44.3 % down the frame, minus the crop (centred)
          Portrait phones: the frame is 170 % of the width, centred on the
          head, 12 % from the top. The text sits below the head there, so
          there is nothing to fade on the left (--fondu-gauche). */}
      <div
        ref={cadreRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden [--vl:max(100cqw,calc(100cqh*1.76796))] [--cx:calc(var(--vl)*0.684_-_(var(--vl)_-_100cqw)*0.7)] [--cy:calc(var(--vl)/1.76796*0.443_-_(var(--vl)/1.76796_-_100cqh)*0.5)] [--fondu-gauche:580px] max-lg:portrait:[--vl:170cqw] max-lg:portrait:[--cx:50cqw] max-lg:portrait:[--cy:calc(12cqh_+_var(--vl)/1.76796*0.443)] max-lg:portrait:[--fondu-gauche:0px] [-webkit-mask-composite:source-in] [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,black_calc(var(--cy)_+_0.07*var(--vl)),transparent_calc(var(--cy)_+_0.1*var(--vl))),linear-gradient(to_right,transparent_var(--fondu-gauche),black_calc(var(--fondu-gauche)_+_80px))]"
      >
        {ORBITES.map((orbite, index) => {
          const bras = orbite.horaire ? "orbite-horaire" : "orbite-antihoraire";
          const contre = orbite.horaire ? "contre-horaire" : "contre-antihoraire";
          return (
            <div
              key={orbite.rayon}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10"
              style={{
                left: "var(--cx)",
                top: "var(--cy)",
                width: `calc(var(--vl) * ${orbite.rayon * 2})`,
                height: `calc(var(--vl) * ${orbite.rayon * 2})`,
              }}
            >
              {orbite.logos.map((logo, rang) => {
                /* Each ring starts turned a little further than the one
                   inside it, so the logos don't line up on the same spokes. */
                const angle = (rang * 360) / orbite.logos.length + index * 24;
                return (
                  <div
                    key={logo.src}
                    className="orbite-bras absolute top-0 left-1/2 h-1/2 w-0 origin-bottom"
                    style={
                      {
                        "--angle": `${angle}deg`,
                        animation: `${bras} ${orbite.duree}s linear infinite`,
                      } as CSSProperties
                    }
                  >
                    {/* w-max: the arm is 0px wide, and without it the badge
                        would shrink to fit that, taking the logo with it
                        (Tailwind caps images at 100% of their parent). */}
                    <div className="absolute top-0 left-0 w-max -translate-x-1/2 -translate-y-1/2">
                      {/* Badge and logo scale with the video, within bounds:
                          the same proportions on a phone as on a desktop. */}
                      <div
                        className="orbite-pastille rounded-full border border-white/10 bg-ink-900 p-[clamp(6px,calc(var(--vl)*0.0095),14px)] shadow-[0_8px_28px_-14px_rgba(255,122,24,0.6)]"
                        style={
                          {
                            "--contre": `${-angle}deg`,
                            animation: `${contre} ${orbite.duree}s linear infinite`,
                          } as CSSProperties
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logo.src}
                          alt=""
                          width={32}
                          height={32}
                          className={`size-[clamp(14px,calc(var(--vl)*0.019),28px)] ${logo.invert ? "brightness-0 invert" : ""}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
