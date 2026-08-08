import { Container, SectionHeading } from "../ui";
import { Reveal } from "../reveal";
import { SpatialMethodShowcase } from "../ui/spatial-method-showcase";
import type { Dictionary } from "@/lib/content";

export function Method({ dict }: { dict: Dictionary }) {
  const { method } = dict;

  return (
    <section
      id="methode"
      className="relative scroll-mt-24 border-y border-white/8 bg-ink-900/40 pt-24 sm:pt-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={method.eyebrow}
            title={method.title}
            subtitle={method.subtitle}
            align="center"
          />
        </Reveal>
      </Container>

      <div className="mt-8 sm:mt-12">
        <SpatialMethodShowcase
          steps={method.steps}
          labels={{
            step: method.stepLabel,
            of: method.stepOf,
            prev: method.prev,
            next: method.next,
          }}
        />
      </div>
    </section>
  );
}
