"use client";

import type { ComponentProps } from "react";

import { SceneVoyage, type ConfigVoyage } from "@/components/voyage/scene";
import { couches, tour, zones } from "@/lib/labs";

export { ECRAN_H, ECRAN_L } from "@/components/voyage/scene";

/** The Labs tower: the journey engine (components/voyage/scene.tsx) set up as a glass elevator. */
const CONFIG: ConfigVoyage = {
  ...tour,
  zones: zones.map((z) => ({ ...z, lieu: z.couche })),
  ordre: ["A", "P0", "M1", "P1", "M2", "P2", "M3", "P3", "M4", "T"],
  paliers: ["P0", "P1", "P2", "P3", "T"],
  transits: ["M1", "M2", "M3", "M4"],
  lieux: couches,
};

export function Tour(props: Omit<ComponentProps<typeof SceneVoyage>, "config">) {
  return <SceneVoyage config={CONFIG} {...props} />;
}
