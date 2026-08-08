import { Plus } from "lucide-react";
import { Container, SectionHeading } from "../ui";
import { Reveal } from "../reveal";

export type FaqItem = { q: string; a: string };

export function Faq({
  eyebrow,
  title,
  items,
  id = "faq",
  bare = false,
}: {
  eyebrow?: string;
  title: string;
  items: FaqItem[];
  id?: string;
  bare?: boolean;
}) {
  const list = (
    <div className="mx-auto mt-12 max-w-3xl divide-y divide-white/8 border-y border-white/8">
      {items.map((item, index) => (
        <Reveal key={item.q} delay={index * 60}>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-base font-medium text-bone-50 transition-colors hover:text-ember-300 [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus className="size-4 shrink-0 text-ember-400 transition-transform duration-300 group-open:rotate-45" />
            </summary>
            <p className="pb-6 text-sm leading-relaxed text-bone-300">
              {item.a}
            </p>
          </details>
        </Reveal>
      ))}
    </div>
  );

  if (bare) {
    return (
      <div>
        <SectionHeading title={title} eyebrow={eyebrow} />
        {list}
      </div>
    );
  }

  return (
    <section id={id} className="scroll-mt-24 py-24 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={eyebrow} title={title} align="center" />
        </Reveal>
        {list}
      </Container>
    </section>
  );
}
