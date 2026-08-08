"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { Icon } from "../icons";

export interface MethodStep {
  n: string;
  title: string;
  description: string;
  icon: string;
}

export interface SpatialMethodShowcaseProps {
  steps: MethodStep[];
  labels: { step: string; of: string; prev: string; next: string };
}

export function SpatialMethodShowcase({
  steps,
  labels,
}: SpatialMethodShowcaseProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || steps.length === 0) return;
    gsap.registerPlugin(ScrollTrigger);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07070a, 0.0021);

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 1400);
    camera.position.set(0, 0, 125);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor(0x07070a, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.55, 0.35),
    );

    const starCount = reduced ? 450 : 1200;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const ember = new THREE.Color(0xff7a18);
    const bone = new THREE.Color(0xebe6dd);
    for (let index = 0; index < starCount; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 520;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 300;
      positions[index * 3 + 2] = 150 - Math.random() * 900;
      const color = Math.random() > 0.78 ? ember : bone;
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        size: 0.9,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(stars);

    const rings = steps.map((_, index) => {
      const group = new THREE.Group();
      const z = 20 - index * 190;
      group.position.z = z;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(42 + index * 4, 0.42, 10, 110),
        new THREE.MeshBasicMaterial({
          color: index === 0 ? 0xff9d42 : 0xff7a18,
          transparent: true,
          opacity: index === 0 ? 0.9 : 0.38,
        }),
      );
      const inner = new THREE.Mesh(
        new THREE.TorusGeometry(30 + index * 3, 0.12, 8, 90),
        new THREE.MeshBasicMaterial({
          color: 0xffc078,
          transparent: true,
          opacity: 0.28,
        }),
      );
      ring.rotation.z = index * 0.38;
      inner.rotation.z = -index * 0.28;
      group.add(ring, inner);
      scene.add(group);
      return group;
    });

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(window.innerHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
    };
    resize();

    let frame = 0;
    const render = () => {
      const progress = progressRef.current;
      const travel = progress * Math.max(steps.length - 1, 1);
      camera.position.z = 125 - travel * 190;
      camera.position.x = Math.sin(travel * Math.PI) * 7;
      camera.position.y = Math.cos(travel * Math.PI * 0.7) * 4;
      camera.lookAt(0, 0, camera.position.z - 150);

      const time = performance.now() * 0.0002;
      stars.rotation.z = reduced ? 0 : time;
      rings.forEach((group, index) => {
        const distance = Math.abs(travel - index);
        group.rotation.z += reduced ? 0 : 0.0015 * (index % 2 ? -1 : 1);
        const material = (group.children[0] as THREE.Mesh)
          .material as THREE.MeshBasicMaterial;
        material.opacity = THREE.MathUtils.lerp(0.25, 0.95, Math.max(0, 1 - distance));
      });
      composer.render();
      if (!reduced) frame = requestAnimationFrame(render);
    };
    render();

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        const next = Math.min(
          Math.round(self.progress * Math.max(steps.length - 1, 1)),
          steps.length - 1,
        );
        if (activeRef.current !== next) {
          setDirection(next > activeRef.current ? 1 : -1);
          activeRef.current = next;
          setActive(next);
        }
        if (reduced) render();
      },
    });

    window.addEventListener("resize", resize);
    return () => {
      trigger.kill();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points))
          return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      });
      composer.dispose();
      renderer.dispose();
    };
  }, [steps]);

  const goTo = (index: number) => {
    const root = rootRef.current;
    if (!root) return;
    const range = root.offsetHeight - window.innerHeight;
    const top = window.scrollY + root.getBoundingClientRect().top;
    window.scrollTo({
      top: top + (index / Math.max(steps.length - 1, 1)) * range,
      behavior: "smooth",
    });
  };

  const current = steps[active];
  if (!current) return null;

  return (
    <div ref={rootRef} className="relative h-[440svh] sm:h-[400vh]">
      <div className="sticky top-0 h-svh overflow-hidden sm:h-screen">
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 h-full w-full opacity-90 sm:opacity-80"
        />
        <div className="bg-anvil pointer-events-none absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,transparent_12%,rgba(7,7,10,0.86)_84%)] sm:bg-[radial-gradient(circle_at_center,transparent_20%,rgba(7,7,10,0.82)_82%)]" />

        <motion.span
          key={`mobile-${current.n}`}
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1 }}
          aria-hidden
          className="pointer-events-none absolute top-[7%] left-1/2 -translate-x-1/2 font-display text-[clamp(8rem,46vw,12rem)] leading-none font-semibold text-white/[0.055] lg:hidden"
        >
          {current.n}
        </motion.span>

        <div className="relative mx-auto flex h-full w-full max-w-7xl items-end px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:items-center sm:px-10 sm:pb-0 lg:px-16">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="hidden lg:block" aria-hidden>
              <span className="font-display text-[clamp(9rem,18vw,18rem)] leading-none font-semibold text-white/[0.035]">
                {current.n}
              </span>
            </div>

            <div className="mx-auto w-full max-w-[34rem] rounded-[1.35rem] border border-white/10 bg-ink-950/75 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:max-w-xl sm:rounded-3xl sm:p-9 lg:mx-0">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current.n}
                  custom={direction}
                  initial={{ opacity: 0, y: direction * 30, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: direction * -20, filter: "blur(8px)" }}
                  transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl border border-ember-500/30 bg-ember-500/10 text-ember-400 sm:size-12 sm:rounded-2xl">
                      <Icon name={current.icon} className="size-5 sm:size-6" />
                    </span>
                    <span className="text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
                      {labels.step} {current.n} {labels.of} {steps.length}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-[1.7rem] leading-tight font-semibold text-bone-50 sm:mt-8 sm:text-5xl">
                    {current.title}
                  </h3>
                  <p className="mt-3 text-[0.78rem] leading-relaxed text-bone-300 sm:mt-5 sm:text-base">
                    {current.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex items-center gap-3 sm:mt-9">
                <button
                  type="button"
                  onClick={() => goTo(Math.max(active - 1, 0))}
                  disabled={active === 0}
                  aria-label={labels.prev}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 text-bone-300 transition hover:border-ember-500/40 hover:text-bone-50 disabled:pointer-events-none disabled:opacity-30 sm:size-10"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <div className="relative h-px flex-1 overflow-hidden bg-white/10">
                  <motion.span
                    animate={{ width: `${((active + 1) / steps.length) * 100}%` }}
                    className="absolute inset-y-0 left-0 bg-ember-400 shadow-[0_0_12px_#ff7a18]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => goTo(Math.min(active + 1, steps.length - 1))}
                  disabled={active === steps.length - 1}
                  aria-label={labels.next}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 text-bone-300 transition hover:border-ember-500/40 hover:text-bone-50 disabled:pointer-events-none disabled:opacity-30 sm:size-10"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 sm:mt-5">
                {steps.map((step, index) => (
                  <button
                    key={step.n}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-current={index === active ? "step" : undefined}
                    aria-label={`${labels.step} ${step.n}: ${step.title}`}
                    className={`h-1.5 rounded-full transition-colors ${index <= active ? "bg-ember-500" : "bg-white/10 hover:bg-white/20"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
