"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Mic, MicOff, Sparkles } from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { labs } from "@/lib/labs";

type Phase = "repos" | "ecoute" | "reponse" | "fait";

/**
 * Ruby's voice orb. With the microphone (optional, asked on click) it reacts
 * to the visitor's voice: the sound is analysed in the browser only, nothing
 * is recorded or sent. The example sentences play the real flow: transcript,
 * spoken answer, action done in a tool.
 */
export function DemoRuby({ locale, compact = false, actif = false }: { locale: Locale; compact?: boolean; actif?: boolean }) {
  const t = labs[locale];
  const d = t.ruby;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const niveauRef = useRef(0);            // 0..1, what the orb follows
  const microRef = useRef<{ flux: MediaStream; ctx: AudioContext } | null>(null);
  const minuteurs = useRef<number[]>([]);
  const [micro, setMicro] = useState<"non" | "oui" | "refuse">("non");
  const [phase, setPhase] = useState<Phase>("repos");
  const [choix, setChoix] = useState(0);
  const [dit, setDit] = useState("");
  const [repond, setRepond] = useState("");

  // The orb: a glowing core whose edge ripples with the voice level.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext("2d");
    if (!g) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let lisse = 0;
    const dessiner = (ms: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      lisse += (niveauRef.current - lisse) * 0.15;
      const r0 = Math.min(w, h) * 0.26;
      const s = ms / 1000;
      for (let couche = 3; couche >= 0; couche--) {
        g.beginPath();
        const points = 96;
        for (let i = 0; i <= points; i++) {
          const a = (i / points) * Math.PI * 2;
          const onde = reduit ? 0 : Math.sin(a * (3 + couche) + s * (1.4 + couche * 0.5)) * (2 + lisse * 18) + Math.sin(a * 7 - s * 2.1) * lisse * 8;
          const r = r0 * (1 + couche * 0.16) + onde;
          const x = w / 2 + Math.cos(a) * r;
          const y = h / 2 + Math.sin(a) * r;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        const grad = g.createRadialGradient(w / 2, h / 2, r0 * 0.1, w / 2, h / 2, r0 * (1.6 + couche * 0.2));
        const alpha = couche === 0 ? 0.95 : 0.16 - couche * 0.03 + lisse * 0.1;
        grad.addColorStop(0, `rgba(255,214,160,${alpha})`);
        grad.addColorStop(0.45, `rgba(255,122,24,${alpha * 0.8})`);
        grad.addColorStop(1, "rgba(184,60,20,0)");
        g.fillStyle = grad;
        g.fill();
      }
      raf = requestAnimationFrame(dessiner);
    };
    raf = requestAnimationFrame(dessiner);
    return () => cancelAnimationFrame(raf);
  }, []);

  const arreterMicro = () => {
    microRef.current?.flux.getTracks().forEach((piste) => piste.stop());
    microRef.current?.ctx.close().catch(() => {});
    microRef.current = null;
    niveauRef.current = 0;
  };

  useEffect(
    () => () => {
      arreterMicro();
      minuteurs.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  const basculerMicro = async () => {
    if (micro === "oui") {
      arreterMicro();
      setMicro("non");
      return;
    }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const ctx = new AudioContext();
      const analyse = ctx.createAnalyser();
      analyse.fftSize = 512;
      ctx.createMediaStreamSource(flux).connect(analyse);
      const donnees = new Uint8Array(analyse.fftSize);
      microRef.current = { flux, ctx };
      setMicro("oui");
      const lire = () => {
        if (!microRef.current) return;
        analyse.getByteTimeDomainData(donnees);
        let somme = 0;
        for (const v of donnees) somme += ((v - 128) / 128) ** 2;
        niveauRef.current = Math.min(1, Math.sqrt(somme / donnees.length) * 6);
        requestAnimationFrame(lire);
      };
      lire();
    } catch {
      setMicro("refuse");
    }
  };

  const jouer = (n: number) => {
    minuteurs.current.forEach((id) => window.clearTimeout(id));
    minuteurs.current = [];
    const ex = d.exemples[n];
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const plus = (fn: () => void, ms: number) => minuteurs.current.push(window.setTimeout(fn, reduit ? 0 : ms));
    setChoix(n);
    setRepond("");
    setPhase("ecoute");
    // The visitor "speaks": words arrive one by one and the orb moves with them.
    const mots = ex.phrase.split(" ");
    mots.forEach((_, i) =>
      plus(() => {
        setDit(mots.slice(0, i + 1).join(" "));
        if (!microRef.current) niveauRef.current = 0.35 + Math.random() * 0.45;
      }, 90 + i * 110),
    );
    const finDit = 90 + mots.length * 110 + 350;
    plus(() => {
      if (!microRef.current) niveauRef.current = 0.1;
      setPhase("reponse");
    }, finDit);
    const lettres = ex.reponse.length;
    for (let i = 1; i <= lettres; i += 2) {
      plus(() => {
        setRepond(ex.reponse.slice(0, i + 1));
        if (!microRef.current) niveauRef.current = 0.2 + Math.random() * 0.3;
      }, finDit + 200 + i * 18);
    }
    plus(() => {
      if (!microRef.current) niveauRef.current = 0;
      setPhase("fait");
    }, finDit + 400 + lettres * 18);
  };

  // First arrival on her screen: Ruby plays her first example by herself.
  const dejaJoue = useRef(false);
  useEffect(() => {
    if (!actif || dejaJoue.current) return;
    dejaJoue.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => jouer(0), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif]);

  return (
    <div className={compact ? "" : "rounded-2xl border border-white/8 bg-ink-950/55 p-4"}>
      <p className="flex items-center gap-2 text-[0.7rem] font-medium tracking-[0.18em] text-ember-300 uppercase">
        <Sparkles className="size-3.5" aria-hidden /> {t.demo} · {t.essayer}
      </p>

      <div className="mt-3 grid items-center gap-4 sm:grid-cols-[9rem_1fr]">
        <div className="relative mx-auto size-36">
          <canvas ref={canvasRef} className="size-full" aria-hidden />
          <button
            type="button"
            onClick={basculerMicro}
            aria-pressed={micro === "oui"}
            aria-label={micro === "oui" ? d.microActif : d.micro}
            className="absolute inset-0 m-auto grid size-14 place-items-center rounded-full border border-white/15 bg-ink-950/50 text-bone-50 backdrop-blur transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-ember-400"
          >
            {micro === "oui" ? <MicOff className="size-5" aria-hidden /> : <Mic className="size-5" aria-hidden />}
          </button>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-bone-50">{micro === "oui" ? d.microActif : d.micro}</p>
          <p className="mt-1 text-xs leading-relaxed text-bone-300">{micro === "refuse" ? d.microRefus : d.microNote}</p>
          <div className="mt-3 flex flex-col gap-2">
            {d.exemples.map((ex, n) => (
              <button
                key={ex.phrase}
                type="button"
                onClick={() => jouer(n)}
                className={`min-h-11 rounded-xl border px-3 py-2 text-left text-xs leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-ember-400 ${
                  choix === n && phase !== "repos" ? "border-ember-400/50 bg-ember-500/10 text-bone-50" : "border-white/10 text-bone-300 hover:border-white/25 hover:text-bone-50"
                }`}
              >
                « {ex.phrase} »
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm" aria-live="polite">
        {phase !== "repos" && (
          <p className="rounded-xl bg-white/[0.04] px-3 py-2 text-bone-100">
            <span className="mr-2 text-[0.65rem] tracking-[0.16em] text-bone-500 uppercase">{d.ecoute}</span>
            {dit}
          </p>
        )}
        {(phase === "reponse" || phase === "fait") && (
          <p className="rounded-xl border border-ember-400/25 bg-ember-500/10 px-3 py-2 text-bone-50">
            <span className="mr-2 text-[0.65rem] tracking-[0.16em] text-ember-300 uppercase">Ruby</span>
            {repond}
          </p>
        )}
        {phase === "fait" && (
          <p className="labs-apparition flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-emerald-100">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            <span className="text-[0.65rem] tracking-[0.16em] uppercase">{d.action}</span>
            <span className="text-bone-50">{d.exemples[choix].action}</span>
          </p>
        )}
      </div>
    </div>
  );
}
