import type { ComponentType } from "react";
import type { ServiceSceneContent } from "@/lib/content";
import type { ServiceKey } from "@/lib/services";
import { AdvisoryFocusScene } from "./advisory-focus";
import { AutomationFlowScene } from "./automation-flow";
import { ServiceSceneFallback } from "./fallback";
import { SeoRankScene } from "./seo-rank";
import { WebRebuildScene } from "./web-rebuild";

export type ServiceSceneProps = {
  scene: ServiceSceneContent;
  beforeLabel: string;
  afterLabel: string;
  scrollHint: string;
};

/**
 * `Partial`, not `Record`: a service without a signature scene has to be a typed
 * absence, so the fallback branch is compulsory rather than something we can
 * forget. Each scene owns its own layout — nothing here assumes a pin, which is
 * what lets a new scene be added by touching one file plus one line below.
 */
const scenes: Partial<Record<ServiceKey, ComponentType<ServiceSceneProps>>> = {
  web: WebRebuildScene,
  seo: SeoRankScene,
  automation: AutomationFlowScene,
  consulting: AdvisoryFocusScene,
};

export function ServiceScene({
  kind,
  ...props
}: ServiceSceneProps & { kind: ServiceKey }) {
  const Scene = scenes[kind] ?? ServiceSceneFallback;
  return <Scene {...props} />;
}
