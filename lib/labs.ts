import type { Locale } from "./i18n";

/**
 * Hephera Labs: the products Hephera builds for itself first. The page is a
 * journey through a tower, one layer per kind of work (components/sections/labs).
 */

export type CoucheId = "hall" | "logiciels" | "templates" | "labo" | "toit";
export type Statut = "test" | "beta" | "disponible" | "diplome";
export type ProjetId = "hephetion" | "ruby" | "studio";

/** The tower video (v2), made by hephera-labs-medias (fabriquer_tour.py + monter_tour.py). One camera:
 *  an approach, then landings (the camera stops in front of a wall screen, where the page lights up the
 *  floor's content) and climbs (the same glass elevator, nothing else on screen). Times and the screen
 *  rectangle of each landing come from tour.json; the scroll layout below never changes. */
export const tour = {
  bureau: "/labs/tour/v3/tour-1600.mp4",
  donnees: "/labs/tour/v3/tour.json",
  affiche: "/labs/tour/v3/A.jpg",
  /** Phones get their own vertical tower (9:16), with portrait wall screens. */
  mobile: "/labs/tour/v3/mobile/tour-720.mp4",
  /** Light versions (12 fps), downloaded first: hephera-labs-medias/video_rapide.py */
  bureauRapide: "/labs/tour/v3/tour-rapide.mp4",
  mobileRapide: "/labs/tour/v3/mobile/tour-rapide.mp4",
  donneesMobile: "/labs/tour/v3/mobile/tour.json",
  afficheMobile: "/labs/tour/v3/mobile/A.jpg",
  dossierMobile: "/labs/tour/v3/mobile",
  dossier: "/labs/tour/v3",
} as const;

export type SegmentId = "A" | "P0" | "M1" | "P1" | "M2" | "P2" | "M3" | "P3" | "M4" | "T";

/** A stretch of scroll. "scrub" plays its segment's video along the scroll; "tenue" holds the
 *  landing's last frame with the screen on (page = which project the screen shows). Heights in svh. */
export type Zone = { segment: SegmentId; mode: "scrub" | "tenue"; hauteur: number; couche?: CoucheId; page?: number };

export const zones: Zone[] = [
  { segment: "A", mode: "scrub", hauteur: 150 },
  { segment: "P0", mode: "scrub", hauteur: 70 },
  { segment: "P0", mode: "tenue", hauteur: 170, couche: "hall" },
  { segment: "M1", mode: "scrub", hauteur: 130, couche: "logiciels" },
  { segment: "P1", mode: "scrub", hauteur: 70 },
  { segment: "P1", mode: "tenue", hauteur: 160, couche: "logiciels", page: 0 },
  { segment: "P1", mode: "tenue", hauteur: 160, couche: "logiciels", page: 1 },
  { segment: "M2", mode: "scrub", hauteur: 130, couche: "templates" },
  { segment: "P2", mode: "scrub", hauteur: 70 },
  { segment: "P2", mode: "tenue", hauteur: 170, couche: "templates", page: 0 },
  { segment: "M3", mode: "scrub", hauteur: 130, couche: "labo" },
  { segment: "P3", mode: "scrub", hauteur: 70 },
  { segment: "P3", mode: "tenue", hauteur: 140, couche: "labo" },
  { segment: "M4", mode: "scrub", hauteur: 130, couche: "toit" },
  { segment: "T", mode: "scrub", hauteur: 70 },
  { segment: "T", mode: "tenue", hauteur: 140, couche: "toit" },
];

/** What tour.json holds: where each segment sits in the video, and each landing's screen
 *  (x, y, w, h as fractions of the video frame). */
export type DonneesTour = {
  duree: number;
  largeur: number;
  hauteur: number;
  segments: Record<
    SegmentId,
    {
      debut: number;
      fin: number;
      /** bounding box + the 4 real corners (top-left, top-right, bottom-right, bottom-left): screens are
       *  rarely a perfect rectangle in the frame, the content is projected onto the corners. */
      ecran?: { x: number; y: number; w: number; h: number; coins?: [number, number][] };
    }
  >;
};

export const couches: CoucheId[] = ["hall", "logiciels", "templates", "labo", "toit"];

type Projet = {
  id: ProjetId;
  couche: CoucheId;
  statut: Statut;
  technologies: string[];
  lien?: string;
};

export const projets: Projet[] = [
  {
    id: "hephetion",
    couche: "logiciels",
    statut: "test",
    technologies: ["Python", "Claude", "Remotion", "React", "FastAPI"],
  },
  {
    id: "ruby",
    couche: "logiciels",
    statut: "test",
    technologies: ["Python", "Claude", "Whisper", "ElevenLabs", "PyQt", "Twilio"],
  },
  {
    id: "studio",
    couche: "templates",
    statut: "disponible",
    technologies: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4", "Three.js"],
    lien: "https://gabarit-studio.vercel.app",
  },
];

type TexteProjet = {
  nom: string;
  categorie: string;
  accroche: string;
  probleme: string;
  pourQui: string;
  etapes: string[];
  etat: string;
};

type Textes = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  titre: string;
  titreAccent: string;
  intro: string;
  defiler: string;
  statuts: Record<Statut, { nom: string; detail: string }>;
  couches: Record<CoucheId, { nom: string; titre: string; texte: string }>;
  projets: Record<ProjetId, TexteProjet>;
  demo: string;
  essayer: string;
  voirFiche: string;
  fermer: string;
  ouvrirDemo: string;
  technologies: string;
  problemeTitre: string;
  pourQuiTitre: string;
  commentTitre: string;
  etatTitre: string;
  chantierTitre: string;
  chantier: string[];
  ctaTitre: string;
  ctaTexte: string;
  cta: string;
  afficheur: string;
  etage: string;
  hephetion: {
    label: string;
    placeholder: string;
    generer: string;
    etapes: string[];
    formats: string;
    accroches: string[];
    erreurUrl: string;
  };
  ruby: {
    micro: string;
    microActif: string;
    microRefus: string;
    microNote: string;
    exemples: { phrase: string; reponse: string; action: string }[];
    ecoute: string;
    action: string;
  };
  studio: {
    couleur: string;
    nom: string;
    nomDefaut: string;
    bureau: string;
    mobile: string;
    apercuTitre: string;
    apercuTexte: string;
    apercuBouton: string;
    voirDemo: string;
  };
};

export const labs: Record<Locale, Textes> = {
  fr: {
    metaTitle: "Hephera Labs, les outils que nous construisons",
    metaDescription:
      "Hephera Labs : les logiciels, gabarits de sites et prototypes IA conçus par Hephera. Entrez dans la tour et testez-les en direct.",
    eyebrow: "Hephera Labs",
    titre: "Les outils que nous construisons",
    titreAccent: "d'abord pour nous.",
    intro:
      "Avant de construire un outil pour un client, nous le construisons pour nous. Ce qui marche ici devient un produit. Entrez dans la tour : chaque étage est un type de travail, et tout se teste en direct.",
    defiler: "Faites défiler pour entrer",
    statuts: {
      test: { nom: "En test", detail: "Utilisé chez nous, pas encore ouvert." },
      beta: { nom: "Bêta", detail: "Ouvert à quelques entreprises." },
      disponible: { nom: "Disponible", detail: "Prêt pour votre projet." },
      diplome: { nom: "Diplômé", detail: "Parti vivre sous sa propre marque." },
    },
    couches: {
      hall: {
        nom: "Hall",
        titre: "Bienvenue dans la tour",
        texte: "Ici, on ne promet rien qu'on n'utilise pas déjà. Chaque outil porte son statut, honnêtement.",
      },
      logiciels: {
        nom: "Logiciels",
        titre: "Des logiciels qui travaillent",
        texte: "Des outils complets, avec de l'IA au cœur, qui font gagner des heures chaque semaine.",
      },
      templates: {
        nom: "Templates",
        titre: "Des sites prêts à prendre votre marque",
        texte: "Nos meilleurs sites, transformés en gabarits : votre couleur, votre nom, en ligne en quelques jours.",
      },
      labo: {
        nom: "Labo",
        titre: "Ce qui se prépare",
        texte: "Les prototypes en cours. Rien n'est montré avant de fonctionner.",
      },
      toit: {
        nom: "Toit",
        titre: "Un outil comme ça pour votre entreprise ?",
        texte: "Parlez-nous du travail qui vous prend le plus de temps. On regarde ensemble ce qu'un outil sur mesure pourrait faire.",
      },
    },
    projets: {
      hephetion: {
        nom: "Hephetion",
        categorie: "Logiciel pour les entreprises",
        accroche: "L'adresse de votre site devient une série de pubs vidéo en motion design.",
        probleme:
          "Une pub vidéo de qualité coûte cher et prend des semaines. Résultat : la plupart des entreprises n'en publient presque jamais.",
        pourQui: "Les entreprises de services et les logiciels en ligne qui veulent publier des pubs chaque semaine.",
        etapes: [
          "Hephetion lit votre site et garde l'essentiel : bénéfices, prix, avis.",
          "Claude trouve les angles qui vendent et écrit les scripts.",
          "Les modèles de motion design prennent votre marque : couleurs, typo, ton.",
          "Les vidéos sortent dans tous les formats : 9:16, 1:1 et 16:9.",
        ],
        etat: "En test sur les pubs d'Hephera. Ouverture à quelques entreprises ensuite.",
      },
      ruby: {
        nom: "Ruby",
        categorie: "Assistante IA vocale",
        accroche: "Une secrétaire qu'on pilote à la voix : tâches, courriels, réunions, écrans.",
        probleme:
          "Un dirigeant passe des heures sur des tâches qui se feraient en une phrase : noter, relancer, résumer, chercher.",
        pourQui: "Les dirigeants et les équipes qui veulent déléguer le travail répétitif sans changer d'outils.",
        etapes: [
          "Ruby écoute et comprend le français, l'anglais, et le mélange des deux.",
          "Elle décide seule de la bonne action : une tâche, un courriel, un tableau, une recherche.",
          "Elle agit dans vos outils (Notion, Gmail, agenda) et affiche le résultat à l'écran.",
          "Elle se joint aussi par téléphone et par SMS.",
        ],
        etat: "Utilisée chaque jour par son créateur. Licence prévue pour les entreprises.",
      },
      studio: {
        nom: "Studio",
        categorie: "Gabarit de site",
        accroche: "Un site de studio ou d'agence, bilingue, avec un héros animé et des services racontés en scènes.",
        probleme:
          "Un site sur mesure prend du temps. Beaucoup d'entreprises ont surtout besoin d'un excellent site, vite.",
        pourQui: "Les studios, agences et indépendants qui veulent un site haut de gamme en quelques jours.",
        etapes: [
          "On choisit le gabarit tiré d'un vrai site d'Hephera.",
          "Votre nom, votre couleur et vos textes prennent la place.",
          "La palette entière se recalcule, jusqu'aux animations 3D.",
          "Mise en ligne, bilingue et optimisée pour le référencement.",
        ],
        etat: "Disponible. Une démo complète est en ligne.",
      },
    },
    demo: "Démo",
    essayer: "Essayez",
    voirFiche: "Voir la fiche",
    fermer: "Fermer",
    ouvrirDemo: "Ouvrir la démo en ligne",
    technologies: "Technologies",
    problemeTitre: "Le problème",
    pourQuiTitre: "Pour qui",
    commentTitre: "Comment ça marche",
    etatTitre: "Où on en est",
    chantierTitre: "En chantier",
    chantier: [
      "Quatre nouveaux gabarits de sites",
      "Immobilius : trouver un appartement sans perdre ses soirées",
      "Des agents IA pour les petites équipes",
    ],
    ctaTitre: "Un outil comme ça pour votre entreprise ?",
    ctaTexte: "Un premier échange suffit pour savoir ce qu'un outil sur mesure ferait gagner à votre équipe.",
    cta: "Démarrer un projet",
    afficheur: "Étages de la tour",
    etage: "Étage",
    hephetion: {
      label: "L'adresse d'un site",
      placeholder: "votre-site.com",
      generer: "Générer la pub",
      etapes: ["Lecture de la page", "Recherche des angles", "Écriture du script", "Rendu de la vidéo"],
      formats: "Format",
      accroches: ["Vos heures reviennent.", "Moins de tâches, plus de clients.", "Lancez-vous cette semaine."],
      erreurUrl: "Entrez une adresse de site, par exemple hephera.com",
    },
    ruby: {
      micro: "Parler à Ruby",
      microActif: "Ruby vous écoute",
      microRefus: "Micro refusé : essayez une phrase d'exemple.",
      microNote: "Le son reste dans votre navigateur : rien n'est enregistré ni envoyé.",
      exemples: [
        {
          phrase: "Ruby, ajoute une tâche : rappeler le fournisseur demain à 10 h.",
          reponse: "C'est noté, je te le rappelle demain à 10 h.",
          action: "Tâche ajoutée dans Notion · demain 10:00",
        },
        {
          phrase: "Mets-moi le tableau des ventes de la semaine.",
          reponse: "Voilà le tableau, les ventes montent de 12 % depuis lundi.",
          action: "Tableau de bord affiché à l'écran",
        },
        {
          phrase: "Résume la réunion de ce matin.",
          reponse: "Trois décisions et deux actions pour toi, je te les envoie.",
          action: "Résumé envoyé · 2 actions créées",
        },
      ],
      ecoute: "Transcription",
      action: "Action faite",
    },
    studio: {
      couleur: "Votre couleur",
      nom: "Votre marque",
      nomDefaut: "Atelier Nord",
      bureau: "Bureau",
      mobile: "Mobile",
      apercuTitre: "Nous créons les outils qui font grandir votre entreprise.",
      apercuTexte: "Sites, référencement et automatisation, construits sur mesure.",
      apercuBouton: "Démarrer un projet",
      voirDemo: "Voir la démo complète",
    },
  },
  en: {
    metaTitle: "Hephera Labs, the tools we build",
    metaDescription:
      "Hephera Labs: the software, website templates and AI prototypes built by Hephera. Step into the tower and try them live.",
    eyebrow: "Hephera Labs",
    titre: "The tools we build",
    titreAccent: "for ourselves first.",
    intro:
      "Before we build a tool for a client, we build it for ourselves. What works here becomes a product. Step into the tower: each floor is a kind of work, and everything can be tried live.",
    defiler: "Scroll to step in",
    statuts: {
      test: { nom: "In testing", detail: "Used in house, not open yet." },
      beta: { nom: "Beta", detail: "Open to a few businesses." },
      disponible: { nom: "Available", detail: "Ready for your project." },
      diplome: { nom: "Graduated", detail: "Now living under its own brand." },
    },
    couches: {
      hall: {
        nom: "Hall",
        titre: "Welcome to the tower",
        texte: "We promise nothing here that we don't already use. Every tool carries its status, honestly.",
      },
      logiciels: {
        nom: "Software",
        titre: "Software that does the work",
        texte: "Complete tools with AI at their core, saving hours every week.",
      },
      templates: {
        nom: "Templates",
        titre: "Websites ready to take your brand",
        texte: "Our best websites, turned into templates: your colour, your name, live in a few days.",
      },
      labo: {
        nom: "Lab",
        titre: "What's coming",
        texte: "Prototypes in progress. Nothing is shown before it works.",
      },
      toit: {
        nom: "Rooftop",
        titre: "A tool like this for your business?",
        texte: "Tell us about the work that takes up most of your time. We'll look at what a custom tool could do.",
      },
    },
    projets: {
      hephetion: {
        nom: "Hephetion",
        categorie: "Software for businesses",
        accroche: "Your website address becomes a series of motion design video ads.",
        probleme:
          "A good video ad is expensive and takes weeks. So most businesses almost never publish one.",
        pourQui: "Service businesses and online software that want to publish ads every week.",
        etapes: [
          "Hephetion reads your website and keeps what matters: benefits, prices, reviews.",
          "Claude finds the angles that sell and writes the scripts.",
          "Motion design templates take on your brand: colours, type, tone.",
          "Videos come out in every format: 9:16, 1:1 and 16:9.",
        ],
        etat: "In testing on Hephera's own ads. Opening to a few businesses next.",
      },
      ruby: {
        nom: "Ruby",
        categorie: "AI voice assistant",
        accroche: "An assistant you run by voice: tasks, emails, meetings, screens.",
        probleme:
          "Business owners spend hours on tasks that would take one sentence: note, follow up, summarise, search.",
        pourQui: "Owners and teams who want to hand off repetitive work without changing tools.",
        etapes: [
          "Ruby listens and understands French, English, and a mix of both.",
          "She picks the right action on her own: a task, an email, a dashboard, a search.",
          "She acts in your tools (Notion, Gmail, calendar) and shows the result on screen.",
          "She can also be reached by phone and text message.",
        ],
        etat: "Used every day by her creator. A business licence is planned.",
      },
      studio: {
        nom: "Studio",
        categorie: "Website template",
        accroche: "A bilingual website for a studio or agency, with an animated hero and services told as scenes.",
        probleme:
          "A custom website takes time. Many businesses mostly need an excellent website, fast.",
        pourQui: "Studios, agencies and freelancers who want a premium website in a few days.",
        etapes: [
          "Pick the template, taken from a real Hephera website.",
          "Your name, colour and copy take their place.",
          "The whole palette is recalculated, down to the 3D animations.",
          "Launch, bilingual and SEO ready.",
        ],
        etat: "Available. A full demo is live.",
      },
    },
    demo: "Demo",
    essayer: "Try it",
    voirFiche: "View details",
    fermer: "Close",
    ouvrirDemo: "Open the live demo",
    technologies: "Technologies",
    problemeTitre: "The problem",
    pourQuiTitre: "Who it's for",
    commentTitre: "How it works",
    etatTitre: "Where it stands",
    chantierTitre: "Under construction",
    chantier: [
      "Four new website templates",
      "Immobilius: find a flat without losing your evenings",
      "AI agents for small teams",
    ],
    ctaTitre: "A tool like this for your business?",
    ctaTexte: "One conversation is enough to know what a custom tool would give your team back.",
    cta: "Start a project",
    afficheur: "Tower floors",
    etage: "Floor",
    hephetion: {
      label: "A website address",
      placeholder: "your-site.com",
      generer: "Generate the ad",
      etapes: ["Reading the page", "Finding the angles", "Writing the script", "Rendering the video"],
      formats: "Format",
      accroches: ["Get your hours back.", "Fewer tasks, more clients.", "Launch this week."],
      erreurUrl: "Enter a website address, for example hephera.com",
    },
    ruby: {
      micro: "Talk to Ruby",
      microActif: "Ruby is listening",
      microRefus: "Microphone blocked: try an example sentence.",
      microNote: "Sound stays in your browser: nothing is recorded or sent.",
      exemples: [
        {
          phrase: "Ruby, add a task: call the supplier back tomorrow at 10.",
          reponse: "Noted, I'll remind you tomorrow at 10.",
          action: "Task added in Notion · tomorrow 10:00",
        },
        {
          phrase: "Show me this week's sales dashboard.",
          reponse: "Here it is, sales are up 12% since Monday.",
          action: "Dashboard shown on screen",
        },
        {
          phrase: "Summarise this morning's meeting.",
          reponse: "Three decisions and two actions for you, sending them now.",
          action: "Summary sent · 2 actions created",
        },
      ],
      ecoute: "Transcript",
      action: "Done",
    },
    studio: {
      couleur: "Your colour",
      nom: "Your brand",
      nomDefaut: "North Studio",
      bureau: "Desktop",
      mobile: "Mobile",
      apercuTitre: "We build the tools that grow your business.",
      apercuTexte: "Websites, SEO and automation, custom built.",
      apercuBouton: "Start a project",
      voirDemo: "See the full demo",
    },
  },
};

export type LabsTextes = Textes;
