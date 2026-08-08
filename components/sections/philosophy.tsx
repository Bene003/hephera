import { StoryPanel, StoryScroll } from "../ui/story-scroll";
import type { Dictionary } from "@/lib/content";

const panelStyles = [
  "bg-ember-500 text-ink-950",
  "bg-ink-950 text-bone-50",
  "bg-bone-100 text-ink-950",
  "bg-ink-800 text-bone-50",
] as const;

export function Philosophy({ dict }: { dict: Dictionary }) {
  const { philosophy } = dict;

  return (
    <div id="philosophie" className="scroll-mt-24 border-y border-white/8">
      <StoryScroll aria-label={philosophy.eyebrow}>
        <StoryPanel
          aria-label={philosophy.title}
          className="bg-ink-950 text-bone-50"
        >
          <div className="bg-anvil pointer-events-none absolute inset-0 opacity-35" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_22%,rgba(255,122,24,0.22),transparent_34%)]" />

          <header className="relative flex items-center justify-between border-b border-white/15 pb-4 text-[0.62rem] font-semibold tracking-[0.2em] uppercase sm:text-xs">
            <span className="text-ember-400">00 — {philosophy.eyebrow}</span>
            <span className="text-bone-500">Hephera</span>
          </header>

          <div className="relative flex flex-1 items-center py-10 sm:py-[4vw]">
            <h2 className="max-w-[11ch] font-display text-[clamp(3.25rem,10.5vw,10rem)] leading-[0.88] font-semibold tracking-[-0.055em] text-balance">
              {philosophy.title}
            </h2>
          </div>

          <div className="relative grid gap-6 border-t border-white/15 pt-5 sm:grid-cols-[1fr_1.2fr] sm:items-end">
            <span className="font-display text-6xl font-semibold text-white/[0.07] sm:text-8xl">
              00
            </span>
            <p className="max-w-[36ch] text-lg leading-relaxed text-bone-300 sm:ml-auto sm:text-2xl">
              {philosophy.body}
            </p>
          </div>
        </StoryPanel>

        {philosophy.principles.map((principle, index) => {
          const number = String(index + 1).padStart(2, "0");
          const dark = index === 1 || index === 3;

          return (
            <StoryPanel
              key={principle.title}
              aria-label={principle.title}
              className={panelStyles[index % panelStyles.length]}
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -top-[18vw] -right-[12vw] size-[clamp(18rem,48vw,52rem)] rounded-full border ${dark ? "border-ember-500/20" : "border-ink-950/15"}`}
              />
              <div
                aria-hidden
                className={`pointer-events-none absolute top-[14vw] -right-[2vw] size-[clamp(10rem,28vw,30rem)] rounded-full border ${dark ? "border-white/10" : "border-ink-950/10"}`}
              />

              <header
                className={`relative flex items-center justify-between border-b pb-4 text-[0.62rem] font-semibold tracking-[0.2em] uppercase sm:text-xs ${dark ? "border-white/20" : "border-ink-950/25"}`}
              >
                <span>{number} — {philosophy.eyebrow}</span>
                <span className="opacity-55">{number} / 04</span>
              </header>

              <div className="relative flex flex-1 items-center py-9 sm:py-[4vw]">
                <h3 className="max-w-[12ch] font-display text-[clamp(3.2rem,10vw,9.5rem)] leading-[0.88] font-semibold tracking-[-0.055em] text-balance">
                  {principle.title}
                </h3>
              </div>

              <div
                className={`relative grid gap-5 border-t pt-5 sm:grid-cols-[0.8fr_1.2fr] sm:items-end ${dark ? "border-white/20" : "border-ink-950/25"}`}
              >
                <span className="font-display text-6xl leading-none font-semibold opacity-10 sm:text-9xl">
                  {number}
                </span>
                <p className="max-w-[42ch] text-base leading-relaxed opacity-75 sm:ml-auto sm:text-2xl">
                  {principle.description}
                </p>
              </div>
            </StoryPanel>
          );
        })}
      </StoryScroll>
    </div>
  );
}
