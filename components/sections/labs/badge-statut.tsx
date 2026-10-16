import { CheckCircle2, FlaskConical, GraduationCap, Rocket } from "lucide-react";

import type { Statut } from "@/lib/labs";

const STYLES: Record<Statut, { icone: typeof FlaskConical; classe: string }> = {
  test: { icone: FlaskConical, classe: "border-ember-400/40 bg-ember-500/12 text-ember-300" },
  beta: { icone: Rocket, classe: "border-sky-300/35 bg-sky-400/10 text-sky-200" },
  disponible: { icone: CheckCircle2, classe: "border-emerald-300/40 bg-emerald-400/10 text-emerald-200" },
  diplome: { icone: GraduationCap, classe: "border-violet-300/35 bg-violet-400/10 text-violet-200" },
};

/** Status of a Labs product: an icon and a word, never colour alone. */
export function BadgeStatut({ statut, libelle, titre }: { statut: Statut; libelle: string; titre?: string }) {
  const { icone: Icone, classe } = STYLES[statut];
  return (
    <span
      title={titre}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md ${classe}`}
    >
      <Icone className="size-3.5" aria-hidden />
      {libelle}
    </span>
  );
}
