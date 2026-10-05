import { Container, SectionHeading } from "../ui";
import { Reveal } from "../reveal";
import { clients } from "@/lib/clients";
import type { Dictionary } from "@/lib/content";

export function Clients({ dict }: { dict: Dictionary }) {
  const band = dict.clients;

  return (
    <section
      id="references"
      className="relative scroll-mt-24 overflow-clip py-16 sm:py-20"
    >
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={band.eyebrow}
            title={band.title}
            subtitle={band.subtitle}
            align="center"
          />
        </Reveal>
      </Container>

      <div className="mt-12 flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)] motion-reduce:mt-8 motion-reduce:overflow-visible motion-reduce:[mask-image:none]">
        {/* Paused on hover, otherwise the links would slide out from under the
            cursor. Under reduced motion the track stops being a track: it wraps
            into a centred block, which is why the copy below is hidden rather
            than left half-clipped off-screen. */}
        <div className="flex shrink-0 animate-marquee-slow items-center hover:[animation-play-state:paused] motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:px-5">
          <ul className="flex shrink-0 items-center gap-x-10 pr-10 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-4 motion-reduce:pr-0">
            {clients.map((client) => (
              <li key={client.name} className="flex shrink-0 items-center gap-10">
                <a
                  href={`https://${client.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm font-display text-lg whitespace-nowrap text-bone-400 transition-colors duration-300 hover:text-bone-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-400 sm:text-xl"
                >
                  {client.name}
                  {" "}
                  <span className="ml-1.5 align-middle font-sans text-[0.62rem] tracking-[0.16em] text-bone-500 uppercase sm:text-[0.68rem]">
                    {client.tech}
                  </span>
                </a>
                <span
                  aria-hidden
                  className="size-1 rounded-full bg-ember-500/60 motion-reduce:hidden"
                />
              </li>
            ))}
          </ul>

          {/* The second lap. Plain text, not links: duplicating ten anchors
              would double the tab stops and read the whole list twice to a
              screen reader for a purely visual seam. */}
          <ul
            aria-hidden
            className="flex shrink-0 items-center gap-x-10 pr-10 motion-reduce:hidden"
          >
            {clients.map((client) => (
              <li key={client.name} className="flex shrink-0 items-center gap-10">
                <span className="font-display text-lg whitespace-nowrap text-bone-400 sm:text-xl">
                  {client.name}
                  {" "}
                  <span className="ml-1.5 align-middle font-sans text-[0.62rem] tracking-[0.16em] text-bone-500 uppercase sm:text-[0.68rem]">
                    {client.tech}
                  </span>
                </span>
                <span className="size-1 rounded-full bg-ember-500/60" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Container>
        <p className="mt-8 text-center text-[0.7rem] tracking-[0.16em] text-bone-600 uppercase">
          {band.hint}
        </p>
      </Container>
    </section>
  );
}
