import { aProposSlug } from "./a-propos-slug";
import type { Locale } from "./i18n";
import { serviceSlugs, type ServiceKey } from "./services";
import type { LieuVille } from "./ville";

/**
 * The city map (components/carte.tsx): every place of the homepage journey, where it sits on the
 * drawing (SVG viewBox 1000 × 640), and which page it belongs to.
 */
export type LieuCarte = { id: LieuVille; x: number; y: number; taille: "grand" | "moyen" | "petit" };

export const lieuxCarte: LieuCarte[] = [
  { id: "arrivee", x: 120, y: 470, taille: "moyen" },
  { id: "forge", x: 360, y: 330, taille: "grand" },
  { id: "web", x: 285, y: 250, taille: "petit" },
  { id: "seo", x: 440, y: 250, taille: "petit" },
  { id: "automation", x: 285, y: 410, taille: "petit" },
  { id: "consulting", x: 440, y: 410, taille: "petit" },
  { id: "atelier", x: 630, y: 470, taille: "moyen" },
  { id: "tour", x: 820, y: 170, taille: "grand" },
  { id: "place", x: 820, y: 500, taille: "moyen" },
];

/** The guide's route, in journey order (drawn as a glowing path). */
export const routeCarte: LieuVille[] = ["arrivee", "forge", "web", "seo", "automation", "consulting", "atelier", "tour", "place"];

/** Which place a page of the site belongs to (for « you are here » outside the homepage). */
export function lieuDeLaPage(chemin: string, locale: Locale): LieuVille | null {
  const morceaux = chemin.split("/").filter(Boolean);
  const page = morceaux[1];
  if (!page) return null;                          // the homepage follows the guide itself
  if (page === "labs") return "tour";
  if (page === aProposSlug[locale]) return "atelier";
  if (page === "contact") return "place";
  if (page === "services") {
    const cle = (Object.keys(serviceSlugs[locale]) as ServiceKey[]).find((k) => serviceSlugs[locale][k] === morceaux[2]);
    return cle ?? "forge";
  }
  return null;
}

export const carteTextes = {
  fr: {
    titre: "La ville Hephera",
    sousTitre: "Choisissez un lieu : le guide vous y emmène.",
    ici: "Vous êtes ici",
    fermer: "Fermer la carte",
    cta: "Démarrer un projet",
    descriptions: {
      arrivee: "Le studio, là où tout commence.",
      forge: "Les quatre leviers d'Hephera.",
      web: "Des sites qui travaillent pour vous.",
      seo: "Être trouvé par ceux qui vous cherchent.",
      automation: "Rendre ses heures à votre équipe.",
      consulting: "Savoir quoi construire, et dans quel ordre.",
      atelier: "Le fondateur et la méthode.",
      tour: "Hephera Labs : nos logiciels, à essayer.",
      place: "Le diagnostic de votre site, et le contact.",
    } satisfies Record<LieuVille, string>,
  },
  en: {
    titre: "The Hephera city",
    sousTitre: "Pick a place: the guide takes you there.",
    ici: "You are here",
    fermer: "Close the map",
    cta: "Start a project",
    descriptions: {
      arrivee: "The studio, where it all starts.",
      forge: "Hephera's four levers.",
      web: "Websites that work for you.",
      seo: "Be found by those looking for you.",
      automation: "Give your team its hours back.",
      consulting: "Know what to build, and in what order.",
      atelier: "The founder and the method.",
      tour: "Hephera Labs: our software, to try.",
      place: "Your website's check-up, and contact.",
    } satisfies Record<LieuVille, string>,
  },
} satisfies Record<Locale, unknown>;
