import {
  Bot,
  Brain,
  Globe,
  Hammer,
  Handshake,
  Rocket,
  Search,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

const registry: Record<string, LucideIcon> = {
  globe: Globe,
  search: Search,
  bot: Bot,
  target: Target,
  hammer: Hammer,
  brain: Brain,
  handshake: Handshake,
  trending: TrendingUp,
  rocket: Rocket,
};

export function Icon({
  name,
  className = "size-5",
}: {
  name: string;
  className?: string;
}) {
  const Component = registry[name] ?? Hammer;
  return <Component className={className} strokeWidth={1.6} aria-hidden />;
}
