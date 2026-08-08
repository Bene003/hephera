import { Container, SectionHeading } from "../ui";
import { Reveal } from "../reveal";
import { ValuesForge } from "../ui/values-forge";
import type { Dictionary } from "@/lib/content";

export function Values({ dict }: { dict: Dictionary }) {
  const { values } = dict;

  return (
    <section
      id="valeurs"
      // overflow-clip, not overflow-hidden: hidden would make this section the
      // scrollport of the forge's sticky stage, so the box would scroll away
      // instead of staying pinned to the middle of the screen.
      className="relative scroll-mt-24 overflow-clip pt-16 pb-24 sm:pt-20 sm:pb-28"
    >
      <div className="bg-anvil pointer-events-none absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-ember-500/[0.07] blur-3xl" />

      <Container className="relative">
        <Reveal>
          <SectionHeading
            eyebrow={values.eyebrow}
            title={values.title}
            align="center"
          />
        </Reveal>

        {/* Not wrapped in <Reveal>: its transform would become a containing
            block for the sticky stage, and the scroll animation is its own
            entrance anyway. */}
        {/* Pulled up: the stage is a full screen tall and centres the box in it,
            which would otherwise leave a large gap under the heading. */}
        <div className="-mt-44 sm:-mt-16">
          <ValuesForge items={values.items} />
        </div>
      </Container>
    </section>
  );
}
