import { ServiceLoop } from "./service-card-loops";
import type { ServiceKey } from "@/lib/services";

/**
 * The service card's back-face loop, promoted to hero size. Server-rendered:
 * `ServiceLoop` is pure markup driven by the `svc-*` CSS keyframes, so this adds
 * no JS to a page that is otherwise static above the fold.
 */
export function ServiceHeroLoop({ kind }: { kind: ServiceKey }) {
  return (
    <div aria-hidden className="relative hidden lg:block">
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,122,24,0.16),transparent_65%)] blur-2xl" />
      <div className="card-forge aspect-4/5 overflow-hidden rounded-2xl p-5">
        <div className="h-full w-full">
          <ServiceLoop kind={kind} />
        </div>
      </div>
    </div>
  );
}
