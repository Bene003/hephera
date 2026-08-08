import { Container } from "../ui";
import { Reveal } from "../reveal";
import type { Dictionary } from "@/lib/content";

export function Manifesto({ dict }: { dict: Dictionary }) {
  const { manifesto } = dict;

  return (
    <section className="relative pt-24 pb-8 sm:pt-32 sm:pb-10">
      <Container>
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-display text-2xl leading-snug font-light text-balance text-bone-500 sm:text-3xl">
            {manifesto.lineOne}
          </p>
          <p className="mt-2 font-display text-2xl leading-snug font-semibold text-balance text-bone-50 sm:text-4xl">
            {manifesto.lineTwo}
          </p>
          <div className="hr-metal mx-auto mt-10 w-40" />
        </Reveal>
      </Container>
    </section>
  );
}
