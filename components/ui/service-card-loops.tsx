import { Fragment, type ReactElement } from "react";
import { Icon } from "../icons";
import type { ServiceKey } from "@/lib/services";

/**
 * Back-face illustrations for the service cards. Pure markup driven by the
 * `svc-*` CSS keyframes in globals.css — four `repeat: Infinity` framer loops
 * would run alongside the scroll spring, while these stay on the compositor.
 *
 * Every loop is authored so its *un-animated* resting state is the intended
 * poster (finished site, #1 ranking, wired graph, full bullseye), which is all
 * the `prefers-reduced-motion` block has to fall back to.
 *
 * They must stay readable at 96×132px, so sizes are mostly percentages.
 */

/** A site assembling itself, then un-assembling in the same order. */
const webBlocks = [
  {
    className:
      "h-[34%] rounded-[3px] bg-gradient-to-br from-ember-500/60 to-ember-700/30",
    delay: 0,
  },
  { className: "h-[7%] w-4/5 rounded-full bg-white/12", delay: 220 },
  { className: "h-[7%] w-3/5 rounded-full bg-white/12", delay: 380 },
  { className: "h-[7%] w-2/3 rounded-full bg-white/12", delay: 540 },
  { className: "h-[12%] w-1/2 rounded-[3px] bg-ember-500/70", delay: 820 },
];

function WebLoop() {
  return (
    <div className="flex h-full w-full flex-col gap-[6%] p-[12%]">
      <div className="flex shrink-0 items-center gap-[3px]">
        <span className="size-1 rounded-full bg-ember-500/60" />
        <span className="size-1 rounded-full bg-white/20" />
        <span className="size-1 rounded-full bg-white/20" />
        <span className="ml-[3px] h-1 flex-1 rounded-full bg-white/8" />
      </div>
      <div className="flex flex-1 flex-col gap-[5%]">
        {webBlocks.map((block) => (
          <span
            key={block.delay}
            className={`animate-svc-build origin-top ${block.className}`}
            style={{ animationDelay: `${block.delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/** A query being typed, then a result climbing to the top spot. */
function SeoLoop() {
  return (
    <div className="flex h-full w-full flex-col gap-[8%] p-[12%]">
      <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1.5 py-1">
        <Icon name="search" className="size-2 shrink-0 text-ember-400" />
        <span className="animate-svc-type h-[2px] flex-1 origin-left rounded-full bg-ember-400/60" />
      </div>
      {/* Rows fill exactly a third each with no gap, so the highlight's
          translateY(100%) lands on the next row at any card size. */}
      <div className="relative flex-1">
        <div
          className="animate-svc-rank absolute inset-x-0 top-0 h-1/3 p-[4%]"
          style={{ willChange: "transform" }}
        >
          <span className="block h-full w-full rounded-[3px] border border-ember-500/40 bg-ember-500/15" />
        </div>
        {["w-4/5", "w-3/5", "w-2/3"].map((width, index) => (
          <div
            key={width}
            className="flex h-1/3 flex-col justify-center gap-[3px] px-[7%]"
          >
            <span
              className={`h-[2px] rounded-full ${index === 0 ? "bg-ember-300/70" : "bg-white/25"} ${width}`}
            />
            <span className="h-[2px] w-1/2 rounded-full bg-white/12" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A signal travelling down a chain of nodes and firing each one. */
function AutomationLoop() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      {[0, 1, 2].map((index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <span className="relative block h-3 w-[2px] overflow-hidden bg-white/12 md:h-5">
              <span
                className="animate-svc-flow absolute inset-0 bg-gradient-to-b from-transparent via-ember-400 to-transparent opacity-0"
                style={{ animationDelay: `${index * 700}ms` }}
              />
            </span>
          ) : null}
          <span className="relative flex size-5 items-center justify-center rounded-md border border-ember-500/30 bg-ember-500/10 md:size-7">
            <span className="size-1.5 rounded-full bg-ember-400/70 md:size-2" />
            {/* A sibling ring instead of a box-shadow keeps the pulse on the
                compositor. */}
            <span
              className="animate-svc-node absolute inset-0 rounded-md opacity-0 ring-1 ring-ember-400"
              style={{ animationDelay: `${index * 700}ms` }}
            />
          </span>
        </Fragment>
      ))}
    </div>
  );
}

/** Rings closing in on a bullseye. The distinct base sizes are what make the
    resting state a real target rather than three coincident circles. */
const targetRings = [
  "size-4 border-ember-500/60 md:size-6",
  "size-8 border-ember-500/40 md:size-11",
  "size-12 border-ember-500/25 md:size-16",
];

function ConsultingLoop() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <span className="absolute h-px w-[52%] bg-white/8" />
      <span className="absolute h-[52%] w-px bg-white/8" />
      {targetRings.map((ring, index) => (
        <span
          key={ring}
          className={`animate-svc-ring absolute rounded-full border ${ring}`}
          style={{ animationDelay: `${index * 900}ms` }}
        />
      ))}
      <span className="animate-svc-hit absolute size-1.5 rounded-full bg-ember-400 md:size-2" />
    </div>
  );
}

const loops: Record<ServiceKey, () => ReactElement> = {
  web: WebLoop,
  seo: SeoLoop,
  automation: AutomationLoop,
  consulting: ConsultingLoop,
};

export function ServiceLoop({ kind }: { kind: ServiceKey }) {
  const Loop = loops[kind] ?? WebLoop;
  return <Loop />;
}
