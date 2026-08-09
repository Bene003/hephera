import { Container, Eyebrow } from "../ui";
import { Reveal } from "../reveal";
import { ServiceScene } from "../ui/service-scenes";
import type { Dictionary } from "@/lib/content";
import type { ServiceKey } from "@/lib/services";

/**
 * `overflow-clip`, never `overflow-hidden`: a scene may pin itself, and an
 * `overflow-hidden` ancestor becomes the scrollport of a descendant sticky and
 * silently kills it. The heading is wrapped in `<Reveal>` but the scene is not —
 * `reveal-up` is `forwards`, so it leaves a `matrix(1,0,0,1,0,0)` transform,
 * which is a containing block.
 */
export function ServiceProblems({
  serviceKey,
  dict,
}: {
  serviceKey: ServiceKey;
  dict: Dictionary;
}) {
  const labels = dict.serviceDetail;
  const { scene } = dict.serviceContent[serviceKey];

  return (
    <section className="relative scroll-mt-24 overflow-clip py-20 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-anvil opacity-40 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,black,transparent)]"
      />
      <Container className="relative">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow>{labels.problemsEyebrow}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl leading-[1.15] font-semibold text-balance text-bone-50 sm:text-4xl">
              {labels.problemsTitle}
            </h2>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-bone-300">
              {scene.lead}
            </p>
          </div>
        </Reveal>

        <ServiceScene
          kind={serviceKey}
          scene={scene}
          beforeLabel={labels.beforeLabel}
          afterLabel={labels.afterLabel}
          scrollHint={dict.services.scrollHint}
        />
      </Container>
    </section>
  );
}
