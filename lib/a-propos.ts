import type { Locale } from "./i18n";

/**
 * The founder page. Rewritten from the old personal portfolio (eben.live) for
 * prospects rather than recruiters: who builds their project, and why that
 * matters to them.
 */
export const aPropos = {
  fr: {
    metaTitle: "À propos d'Eben Kwete, fondateur",
    metaDescription:
      "Eben Kwete, fondateur d'Hephera : formé en informatique à l'UQAM, il conçoit et construit lui-même chaque projet, du premier échange à la mise en ligne.",
    eyebrow: "À propos",
    title: "Eben Kwete,",
    titleAccent: "fondateur d'Hephera",
    lead: "Je conçois et je construis moi-même chaque projet d'Hephera, du premier échange à la mise en ligne. Vous parlez directement à la personne qui fait le travail.",
    photoAlt: "Portrait d'Eben Kwete, fondateur d'Hephera",
    storyTitle: "Mon parcours",
    story: [
      "J'ai étudié l'informatique à l'UQAM, de 2019 à 2022. C'est là que j'ai appris à construire un logiciel de bout en bout : les données, l'architecture, puis l'interface.",
      "J'ai ensuite travaillé pour des entreprises en France et au Canada, sur des boutiques en ligne, des plateformes de réservation et des sites vitrines.",
      "Je travaille sur toute la chaîne, du design au développement, en passant par le référencement et l'automatisation. En parallèle, je construis mes propres produits, ce qui me garde au contact de ce qui fonctionne vraiment.",
      "Basé au Canada, je travaille à distance, en français comme en anglais.",
    ],
    stats: [
      { value: "UQAM", label: "Informatique, 2019 à 2022" },
      { value: "13+", label: "Projets livrés" },
      { value: "2", label: "Pays : France et Canada" },
    ],
    principlesTitle: "Ce qui guide chaque projet",
    principles: [
      { title: "Rapide", body: "Un site lent perd ses visiteurs avant d'avoir dit quoi que ce soit." },
      { title: "Clair", body: "Chaque page existe pour faire avancer quelqu'un d'une étape." },
      { title: "Livré", body: "Un projet qui n'est pas en ligne n'est qu'une maquette." },
    ],
    ctaTitle: "Parlons de votre projet",
    ctaBody: "Un premier échange suffit pour savoir ce qui ferait avancer votre entreprise.",
    cta: "Démarrer un projet",
  },
  en: {
    metaTitle: "About Eben Kwete, founder",
    metaDescription:
      "Eben Kwete, founder of Hephera: trained in computer science at UQAM, he designs and builds every project himself, from the first conversation to launch.",
    eyebrow: "About",
    title: "Eben Kwete,",
    titleAccent: "founder of Hephera",
    lead: "I design and build every Hephera project myself, from the first conversation to launch. You talk directly to the person doing the work.",
    photoAlt: "Portrait of Eben Kwete, founder of Hephera",
    storyTitle: "My background",
    story: [
      "I studied computer science at UQAM from 2019 to 2022. That is where I learned to build software end to end: the data, the architecture, then the interface.",
      "I then worked for businesses in France and Canada, on online stores, booking platforms and business websites.",
      "I work across the whole chain, from design to development, SEO and automation. On the side, I build products of my own, which keeps me close to what actually works.",
      "Based in Canada, I work remotely, in English and French.",
    ],
    stats: [
      { value: "UQAM", label: "Computer science, 2019 to 2022" },
      { value: "13+", label: "Projects delivered" },
      { value: "2", label: "Countries: France and Canada" },
    ],
    principlesTitle: "What guides every project",
    principles: [
      { title: "Fast", body: "A slow site loses its visitors before it has said anything." },
      { title: "Clear", body: "Every page exists to move someone one step forward." },
      { title: "Shipped", body: "A project that is not live is only a mockup." },
    ],
    ctaTitle: "Let's talk about your project",
    ctaBody: "One conversation is enough to see what would move your business forward.",
    cta: "Start a project",
  },
} satisfies Record<Locale, unknown>;

export { aProposSlug } from "./a-propos-slug";
