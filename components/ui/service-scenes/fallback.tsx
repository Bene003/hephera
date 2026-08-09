import { ArrowRight, Check } from "lucide-react";
import type { ServiceSceneProps } from ".";

/**
 * The before/after in two static columns, for the services that do not have a
 * signature scene yet. Server-rendered, zero JS, no pin: the section stays a
 * single screen tall.
 */
export function ServiceSceneFallback({
  scene,
  beforeLabel,
  afterLabel,
}: ServiceSceneProps) {
  return (
    <div className="mt-12">
      <p className="sr-only">{scene.sceneAlt}</p>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-7">
          <h3 className="font-display text-xs font-semibold tracking-[0.18em] text-bone-500 uppercase">
            {beforeLabel}
          </h3>
          <ul className="mt-6 space-y-4">
            {scene.problems.map((problem) => (
              <li key={problem.before} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-bone-500"
                />
                <span className="text-sm leading-relaxed text-bone-400">
                  {problem.before}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-forge rounded-2xl p-7">
          <h3 className="font-display text-xs font-semibold tracking-[0.18em] text-ember-400 uppercase">
            {afterLabel}
          </h3>
          <ul className="mt-6 space-y-4">
            {scene.problems.map((problem) => (
              <li key={problem.after} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-ember-500/15 text-ember-400">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="text-sm leading-relaxed text-bone-200">
                  {problem.after}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-white/8 bg-white/[0.02] px-7 py-5">
        <span className="font-display text-xs font-semibold tracking-[0.18em] text-bone-500 uppercase">
          {scene.metricLabel}
        </span>
        <span aria-hidden className="flex items-baseline gap-3">
          <span className="font-display text-2xl font-semibold text-bone-500 tabular-nums">
            {scene.metricFrom}
          </span>
          <ArrowRight className="size-4 text-ember-500/70" />
          <span className="text-molten font-display text-3xl font-semibold tabular-nums">
            {scene.metricTo}
          </span>
        </span>
        <span className="sr-only">{scene.metricSr}</span>
      </div>
    </div>
  );
}
