import type { ZoneVoyage } from "@/components/voyage/scene";
import type { Locale } from "./i18n";

/**
 * The homepage as a journey through the Hephera city, led by the monitor-headed guide of the hero.
 * Video made by hephera-labs-medias/fabriquer_ville.py. The copy itself comes from lib/content
 * (hero, services, method...): this file only adds the journey's own words.
 */

export type LieuVille = "arrivee" | "forge" | "web" | "seo" | "automation" | "consulting" | "atelier" | "tour" | "place";

export const lieuxVille: LieuVille[] = ["arrivee", "forge", "web", "seo", "automation", "consulting", "atelier", "tour", "place"];

export const fichiersVille = {
  bureau: "/accueil/ville/tour-1600.mp4",
  mobile: "/accueil/ville/mobile/tour-720.mp4",
  donnees: "/accueil/ville/tour.json",
  donneesMobile: "/accueil/ville/mobile/tour.json",
  affiche: "/accueil/ville/A.jpg",
  afficheMobile: "/accueil/ville/mobile/A.jpg",
  dossier: "/accueil/ville",
  dossierMobile: "/accueil/ville/mobile",
};

/** Video order: R0 (the guide beckons, the door opens), R1 (walkway), then one segment per place. */
export const ordreVille = ["R0", "R1", "F0", "F1", "F2", "F3", "F4", "A1", "T1", "P1"];
export const paliersVille = ["F0", "F1", "F2", "F3", "F4", "A1", "T1", "P1"];

export const zonesVille: ZoneVoyage[] = [
  { segment: "R0", mode: "scrub", hauteur: 150, lieu: "arrivee" },
  { segment: "R1", mode: "scrub", hauteur: 120, lieu: "forge" },
  { segment: "F0", mode: "scrub", hauteur: 80, lieu: "forge" },
  { segment: "F0", mode: "tenue", hauteur: 150, lieu: "forge" },
  { segment: "F1", mode: "scrub", hauteur: 80, lieu: "web" },
  { segment: "F1", mode: "tenue", hauteur: 140, lieu: "web" },
  { segment: "F2", mode: "scrub", hauteur: 80, lieu: "seo" },
  { segment: "F2", mode: "tenue", hauteur: 140, lieu: "seo" },
  { segment: "F3", mode: "scrub", hauteur: 80, lieu: "automation" },
  { segment: "F3", mode: "tenue", hauteur: 140, lieu: "automation" },
  { segment: "F4", mode: "scrub", hauteur: 80, lieu: "consulting" },
  { segment: "F4", mode: "tenue", hauteur: 140, lieu: "consulting" },
  { segment: "A1", mode: "scrub", hauteur: 100, lieu: "atelier" },
  { segment: "A1", mode: "tenue", hauteur: 170, lieu: "atelier" },
  { segment: "T1", mode: "scrub", hauteur: 100, lieu: "tour" },
  { segment: "T1", mode: "tenue", hauteur: 130, lieu: "tour" },
  { segment: "P1", mode: "scrub", hauteur: 100, lieu: "place" },
  { segment: "P1", mode: "tenue", hauteur: 190, lieu: "place" },
];

export const villeTextes = {
  fr: {
    lieux: {
      arrivee: "L'arrivée",
      forge: "La Forge",
      web: "Le poste Web",
      seo: "Le poste SEO",
      automation: "Le poste Automatisation",
      consulting: "Le poste Conseil",
      atelier: "L'Atelier",
      tour: "La Tour",
      place: "La Place",
    } satisfies Record<LieuVille, string>,
    suivre: "Faites défiler : suivez le guide",
    carte: "Carte de la ville",
    etape: "Étape",
    forgeTitre: "La Forge",
    forgeTexte: "Ici, on transforme ce qui vous ralentit en outils qui travaillent. Quatre postes, quatre leviers.",
    atelierTitre: "L'Atelier du fondateur",
    atelierTexte: "Je conçois et je construis moi-même chaque projet, du premier échange à la mise en ligne.",
    methodeTitre: "Comment on travaille",
    tourTitre: "La Tour : Hephera Labs",
    tourTexte: "Les outils que nous construisons d'abord pour nous : logiciels, gabarits de sites, prototypes IA. Entrez dans la tour pour les essayer.",
    tourCta: "Entrer dans la tour",
    placeTitre: "Votre site, au crible",
    placeTexte: "Entrez l'adresse de votre site : on le passe au diagnostic, en direct.",
    voirService: "Voir le service",
    aPropos: "Mon parcours",
  },
  en: {
    lieux: {
      arrivee: "Arrival",
      forge: "The Forge",
      web: "The Web station",
      seo: "The SEO station",
      automation: "The Automation station",
      consulting: "The Consulting station",
      atelier: "The Workshop",
      tour: "The Tower",
      place: "The Square",
    } satisfies Record<LieuVille, string>,
    suivre: "Scroll: follow the guide",
    carte: "City map",
    etape: "Stop",
    forgeTitre: "The Forge",
    forgeTexte: "This is where what slows you down becomes tools that do the work. Four stations, four levers.",
    atelierTitre: "The founder's workshop",
    atelierTexte: "I design and build every project myself, from the first conversation to launch.",
    methodeTitre: "How we work",
    tourTitre: "The Tower: Hephera Labs",
    tourTexte: "The tools we build for ourselves first: software, website templates, AI prototypes. Step into the tower to try them.",
    tourCta: "Enter the tower",
    placeTitre: "Your website, put to the test",
    placeTexte: "Enter your website address: we run it through a live check-up.",
    voirService: "See the service",
    aPropos: "My background",
  },
} satisfies Record<Locale, unknown>;
