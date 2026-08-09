import type { Locale } from "../i18n";
import { fr, type Dictionary } from "./fr";
import { en } from "./en";

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
export type {
  ServiceContent,
  ServiceProblem,
  ServiceSceneContent,
} from "./fr";
