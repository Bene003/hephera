"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 1400;
const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Back of the sphere (dim, deep copper) → front (bright, molten). */
const BACK_COLOR = [140, 52, 18] as const;
const FRONT_COLOR = [255, 214, 168] as const;

type Point = { x: number; y: number; z: number };

function fibonacciSphere(count: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN_ANGLE;
    points.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
    });
  }
  return points;
}

export default function ParticleSphereAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const points = fibonacciSphere(PARTICLE_COUNT);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // Tilt the pole slightly towards the viewer, like a globe on a stand.
    const tilt = -0.38;
    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);

    let angle = 0;
    let frame = 0;

    const draw = () => {
      if (width === 0 || height === 0) {
        frame = requestAnimationFrame(draw);
        return;
      }

      context.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.46;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      for (const point of points) {
        // Spin around the vertical axis…
        const rx = point.x * cosAngle - point.z * sinAngle;
        const rz = point.x * sinAngle + point.z * cosAngle;
        // …then tilt around the horizontal one.
        const ry = point.y * cosTilt - rz * sinTilt;
        const rzTilted = point.y * sinTilt + rz * cosTilt;

        const depth = (rzTilted + 1) / 2; // 0 = far, 1 = near
        const perspective = 1 / (1.9 - rzTilted * 0.55);

        const screenX = centerX + rx * radius * perspective;
        const screenY = centerY + ry * radius * perspective;

        const red = Math.round(
          BACK_COLOR[0] + (FRONT_COLOR[0] - BACK_COLOR[0]) * depth,
        );
        const green = Math.round(
          BACK_COLOR[1] + (FRONT_COLOR[1] - BACK_COLOR[1]) * depth,
        );
        const blue = Math.round(
          BACK_COLOR[2] + (FRONT_COLOR[2] - BACK_COLOR[2]) * depth,
        );

        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.14 + depth * 0.86})`;
        context.beginPath();
        context.arc(screenX, screenY, 0.5 + depth * depth * 1.7, 0, TAU);
        context.fill();
      }

      if (reduceMotion) return;
      angle += 0.0021;
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative size-full">
      <div
        aria-hidden
        className="absolute inset-[4%] rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(255,140,40,0.3),rgba(226,87,30,0.12)_45%,transparent_72%)] blur-2xl"
      />
      <canvas ref={canvasRef} className="relative size-full" aria-hidden />
    </div>
  );
}
