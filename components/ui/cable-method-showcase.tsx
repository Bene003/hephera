"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { WebGLRenderer } from "three";
import { Icon } from "../icons";

/** Une ligne de la carte : une valeur en texte, ou une pastille quand elle compte. */
export interface MethodSpec {
  k: string;
  v?: string;
  tag?: string;
}

export interface MethodStep {
  n: string;
  title: string;
  description: string;
  icon: string;
  specs: MethodSpec[];
}

export interface CableMethodShowcaseProps {
  steps: MethodStep[];
  labels: { step: string; of: string };
}

/**
 * LA MÉTHODE RACONTÉE PAR LES MÊMES CÂBLES, EN QUATRE ÉTATS.
 *
 *   Comprendre     des câbles qui pendent en vrac : la matière qu'on étudie
 *   Concevoir      rangés côte à côte en nappe : chaque fil a sa place
 *   Construire     la nappe se torsade en un seul câble multibrin
 *   Faire évoluer  le câble se serre, fait une boucle et son bout s'allume
 *
 * CE SONT DES CÂBLES JUSQU'AU BOUT. Une première version finissait en grille,
 * en tour et en tore : belles formes, mais dès la deuxième étape on ne voyait
 * plus de câble, et le câble est le fil de la section.
 *
 * Ce sont toujours les mêmes points. Chaque point porte ses quatre positions
 * comme attributs et la carte graphique fait le mélange : le processeur
 * n'envoie qu'un nombre par image, au lieu de réécrire treize mille
 * coordonnées. Les quatre formes sont paramétrées par le même couple (câble,
 * position le long du câble), donc un câble reste un câble d'une forme à
 * l'autre : on voit la matière se réorganiser, pas un nuage qui se déforme.
 *
 * C'EST LA TRANSFORMATION QUI SE MONTRE, PAS SEULEMENT LE RÉSULTAT. Il n'y a
 * aucun palier. Chaque câble suit son propre chemin à travers les quatre
 * formes, un peu en retard sur le précédent, et ce chemin est une courbe
 * lisse : un câble ne s'arrête jamais sur une forme, il la traverse. Avec des
 * transitions séparées, chacune démarrait et finissait à l'arrêt, et autour
 * de chaque forme plus rien ne bougeait.
 */

const NB_CABLES = 34;
const PAR_CABLE = 400;
const NB_POINTS = NB_CABLES * PAR_CABLE;
const NB_FORMES = 4;

/* L'encombrement des formes en unités de scène, pour les faire tenir à
   l'écran quelle que soit sa taille. La largeur est celle du câble qui
   traverse l'écran, la hauteur celle des câbles qui pendent. */
const LARGEUR_FORMES = 6.4;
const HAUTEUR_FORMES = 4.2;

/* Une orientation par état. La nappe s'incline pour montrer sa surface, sinon
   elle se lit comme un trait. Le câble fini se présente presque de face : sa
   boucle doit se lire comme une boucle, pas comme un nœud écrasé. */
const INCLINAISON = [0.08, 0.35, 0.18, 0.12];
const PIVOT = [-0.25, -0.3, 0.15, 0];

/* L'écart, en formes, entre le premier et le dernier câble. À 0.45, la scène
   mélange toujours un peu deux formes : on reconnaît chacune, mais on voit en
   permanence la vague qui la transforme. Les vignettes du menu le mettent à
   zéro, pour montrer chaque forme nette. */
const ETALEMENT = 0.45;

/* Au-delà de cette largeur, menu à gauche et carte à droite ; en dessous, la
   carte passe en bas et le menu devient une bande qui défile sous elle. */
const LARGEUR_BUREAU = 900;

const sommet = /* glsl */ `
  attribute vec3 aForme0;
  attribute vec3 aForme1;
  attribute vec3 aForme2;
  attribute vec3 aForme3;
  attribute float aRetard;
  attribute float aPointe;
  uniform float uForme;
  uniform float uTaille;
  uniform float uDpr;
  uniform float uEtalement;
  varying float vPointe;
  varying float vChaleur;

  // Courbe d'Hermite passant par b puis c. Les tangentes regardent les formes
  // voisines, donc un point garde sa vitesse en traversant une forme au lieu
  // de s'y arrêter. Elles sont moitié moins fortes qu'une Catmull-Rom : assez
  // pour ne pas freiner, pas assez pour que la matière déborde des formes.
  vec3 passage(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    vec3 tb = 0.25 * (c - a);
    vec3 tc = 0.25 * (d - b);
    return (2.0 * t3 - 3.0 * t2 + 1.0) * b + (t3 - 2.0 * t2 + t) * tb
      + (-2.0 * t3 + 3.0 * t2) * c + (t3 - t2) * tc;
  }

  void main() {
    // La position propre du point sur le parcours, de 0 à 3. Le dernier câble
    // a uEtalement de retard sur le premier, et tous sont arrivés à la fin.
    float s = clamp(uForme * (1.0 + uEtalement / 3.0) - aRetard * uEtalement, 0.0, 3.0);

    vec3 position3;
    if (s < 1.0) {
      position3 = passage(aForme0, aForme0, aForme1, aForme2, s);
    } else if (s < 2.0) {
      position3 = passage(aForme0, aForme1, aForme2, aForme3, s - 1.0);
    } else {
      position3 = passage(aForme1, aForme2, aForme3, aForme3, s - 2.0);
    }

    vPointe = aPointe;
    // La chaleur suit le point, pas la page : elle avance avec la vague.
    vChaleur = s / 3.0;

    vec4 vue = modelViewMatrix * vec4(position3, 1.0);
    gl_PointSize = uTaille * uDpr * (1.0 + aPointe * 2.2) * (220.0 / -vue.z);
    gl_Position = projectionMatrix * vue;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  varying float vPointe;
  varying float vChaleur;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float masque = smoothstep(0.5, 0.18, d);
    if (masque <= 0.001) discard;

    // Le projet chauffe à mesure qu'il avance : des câbles couleur os au
    // départ, un coeur braise à la dernière étape.
    vec3 os = vec3(0.92, 0.9, 0.87);
    vec3 or = vec3(1.0, 0.72, 0.25);
    vec3 braise = vec3(1.0, 0.48, 0.09);

    vec3 teinte = mix(os, or, vPointe);
    teinte = mix(teinte, braise, vChaleur * 0.7);

    float alpha = masque * (0.3 + vPointe * 0.6 + vChaleur * 0.25);
    gl_FragColor = vec4(teinte, alpha);
  }
`;

/* Hasard semé : la même graine redonne la même scène à chaque visite. */
function alea(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * La valeur d'un réglage par forme, à une position continue. Catmull-Rom : la
 * courbe passe par chaque valeur sans y ralentir, donc la rotation ne marque
 * pas d'arrêt quand on traverse une forme.
 */
function entre(valeurs: number[], position: number) {
  const dernier = valeurs.length - 1;
  const base = Math.min(Math.max(Math.floor(position), 0), dernier - 1);
  const t = Math.min(Math.max(position - base, 0), 1);
  const a = valeurs[Math.max(base - 1, 0)];
  const b = valeurs[base];
  const c = valeurs[base + 1];
  const d = valeurs[Math.min(base + 2, dernier)];
  return (
    0.5 *
    (2 * b +
      (c - a) * t +
      (2 * a - 5 * b + 4 * c - d) * t * t +
      (3 * b - a - 3 * c + d) * t * t * t)
  );
}

/**
 * L'avancement du défilement (0 à 1) devient la position sur le parcours des
 * formes (0 à 3), proportionnellement et sans palier : c'est le défilement qui
 * dicte la vitesse de la transformation, jamais une pause imposée.
 */
function versForme(progression: number) {
  return Math.min(Math.max(progression, 0), 1) * (NB_FORMES - 1);
}

/**
 * Le tracé commun des trois dernières formes : un câble qui traverse tout
 * l'écran de gauche à droite en ondulant. `boucle` (0 ou 1) lui fait faire un
 * tour sur lui-même en son milieu, et `decalage` recentre la forme en hauteur
 * quand la boucle la fait monter.
 */
function trace(u: number, boucle: number, decalage: number): [number, number, number] {
  let x = -3.2 + 6.4 * u;
  let y = 0.35 * Math.sin(u * Math.PI * 2 + 0.3) + decalage;
  let z = 0.4 * Math.cos(u * Math.PI * 1.5);
  /* La boucle : entre 40 % et 60 % du tracé, on ajoute un cercle parcouru une
     fois. Il vaut zéro à ses deux bouts, donc le câble y entre et en sort sans
     cassure. Le cercle recule plus vite que le tracé n'avance : c'est ce qui
     referme la boucle au lieu de dessiner une simple bosse. */
  if (boucle > 0 && u > 0.4 && u < 0.6) {
    const a = ((u - 0.4) / 0.2) * Math.PI * 2;
    x += boucle * 0.7 * Math.sin(a);
    y += boucle * 0.7 * (1 - Math.cos(a));
    z += boucle * 0.3 * Math.sin(a);
  }
  return [x, y, z];
}

/**
 * Un point à `rayon` du tracé, à l'`angle` donné autour de lui. Le repère
 * suit la direction du câble : sans lui, là où le tracé monte dans la boucle,
 * les brins s'écraseraient les uns sur les autres au lieu de l'entourer.
 */
function autour(
  u: number,
  boucle: number,
  decalage: number,
  rayon: number,
  angle: number,
): [number, number, number] {
  const [x, y, z] = trace(u, boucle, decalage);
  const pas = u < 0.999 ? 0.001 : -0.001;
  const [x2, y2] = trace(u + pas, boucle, decalage);
  const dx = (x2 - x) * Math.sign(pas);
  const dy = (y2 - y) * Math.sign(pas);
  const norme = Math.hypot(dx, dy) || 1;
  const nx = -dy / norme;
  const ny = dx / norme;
  return [
    x + rayon * Math.cos(angle) * nx,
    y + rayon * Math.cos(angle) * ny,
    z + rayon * Math.sin(angle),
  ];
}

function construireFormes() {
  const formes = Array.from(
    { length: NB_FORMES },
    () => new Float32Array(NB_POINTS * 3),
  );
  const [vrac, nappe, torsade, cable] = formes;
  const retards = new Float32Array(NB_POINTS);
  const pointes = new Float32Array(NB_POINTS);

  const poser = (forme: Float32Array, k: number, p: [number, number, number]) => {
    forme[k] = p[0];
    forme[k + 1] = p[1];
    forme[k + 2] = p[2];
  };

  for (let c = 0; c < NB_CABLES; c += 1) {
    const rang = c / (NB_CABLES - 1);
    const depart = (c / NB_CABLES) * Math.PI * 2;

    for (let j = 0; j < PAR_CABLE; j += 1) {
      const i = c * PAR_CABLE + j;
      const k = i * 3;
      const t = j / (PAR_CABLE - 1);

      /* Comprendre. Chaque câble pend d'une longueur différente et ondule sur
         deux fréquences : une seule se lirait comme un rideau bien rangé. */
      vrac[k] =
        (rang - 0.5) * 4.8 +
        Math.sin(t * 2.6 + c) * 0.22 * t +
        Math.sin(t * 7.1 + c * 1.7) * 0.05;
      vrac[k + 1] = 1.9 - t * (3.2 + alea(c + 91) * 0.9);
      vrac[k + 2] = (alea(c + 17) - 0.5) * 2.2 + Math.cos(t * 2.2 + c) * 0.14 * t;

      /* Concevoir. Les câbles se rangent côte à côte en nappe, chacun à sa
         place, comme un câble plat. La nappe vrille à peine le long du tracé :
         assez pour qu'on voie sa surface, pas assez pour qu'elle se torde. */
      poser(nappe, k, autour(t, 0, 0, (rang - 0.5) * 0.9, t * 0.9));

      /* Construire. La nappe s'enroule en un câble multibrin : chaque brin
         fait six tours autour de l'axe, décalé des autres autour du cercle. */
      poser(torsade, k, autour(t, 0, 0, 0.32, depart + t * Math.PI * 12));

      /* Faire évoluer. Les brins se serrent en un câble fini, qui fait une
         boucle en son milieu : le cycle mesurer, ajuster, ajouter. La boucle
         monte d'environ 1,4 unité, d'où le recentrage vers le bas. */
      poser(cable, k, autour(t, 1, -0.45, 0.12, depart + t * Math.PI * 20));

      /* Les câbles partent l'un après l'autre, et chacun se détache depuis
         son origine : la réorganisation balaie la scène au lieu de tout
         basculer d'un bloc. */
      retards[i] = rang * 0.75 + t * 0.25;
      /* Le bout de chaque brin brille : sur le câble fini, c'est son
         extrémité qui s'allume, comme une prise sous tension. */
      pointes[i] = Math.pow(t, 9);
    }
  }

  return { formes, retards, pointes };
}

export function CableMethodShowcase({
  steps,
  labels,
}: CableMethodShowcaseProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [miniatures, setMiniatures] = useState<string[]>([]);
  const nbEtapes = steps.length;

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!root || !stage || !canvas || nbEtapes === 0) return;

    /* THREE.JS ET GSAP NE SONT TÉLÉCHARGÉS QU'À L'APPROCHE DE LA SECTION.
       Importés en tête de fichier, ils partaient avec la page d'accueil et
       s'exécutaient à son ouverture, pour une section située bien plus bas.
       Ils arrivent maintenant quand la section est à un écran et demi : le
       temps de défiler jusqu'à elle suffit à les charger. Le texte des étapes,
       lui, est rendu par le serveur et visible sans eux. */
    const monter = (
      THREE: typeof import("three"),
      gsap: typeof import("gsap").gsap,
      ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger,
    ) => {
      gsap.registerPlugin(ScrollTrigger);

      const reduit = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const majEtape = (forme: number) => {
        const etape = Math.min(
          Math.round((forme * (nbEtapes - 1)) / (NB_FORMES - 1)),
          nbEtapes - 1,
        );
        if (etape === activeRef.current) return;
        setDirection(etape > activeRef.current ? 1 : -1);
        activeRef.current = etape;
        setActive(etape);
      };

      /* Sans WebGL, la scène reste un fond sombre : les étapes continuent de
         défiler, parce qu'elles sont le contenu et les câbles le décor. */
      let rendu: WebGLRenderer | null = null;
      try {
        rendu = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          powerPreference: "high-performance",
        });
      } catch {
        rendu = null;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0, 6.2);

      const { formes, retards, pointes } = construireFormes();
      const geometrie = new THREE.BufferGeometry();
      geometrie.setAttribute("position", new THREE.BufferAttribute(formes[0], 3));
      formes.forEach((forme, index) =>
        geometrie.setAttribute(
          `aForme${index}`,
          new THREE.BufferAttribute(forme, 3),
        ),
      );
      geometrie.setAttribute("aRetard", new THREE.BufferAttribute(retards, 1));
      geometrie.setAttribute("aPointe", new THREE.BufferAttribute(pointes, 1));

      const materiau = new THREE.ShaderMaterial({
        vertexShader: sommet,
        fragmentShader: fragment,
        uniforms: {
          uForme: { value: 0 },
          uTaille: { value: 0.04 },
          uDpr: { value: 1 },
          uEtalement: { value: ETALEMENT },
        },
        transparent: true,
        depthWrite: false,
        /* Le fondu additif fait la lueur : les pointes irradient et les zones
           denses brûlent. Il n'a de sens que sur ce fond presque noir. */
        blending: THREE.AdditiveBlending,
      });

      const nuage = new THREE.Points(geometrie, materiau);
      /* La sphère englobante est calculée sur la première forme seulement : on
         coupe le tri par champ de vision pour qu'aucune autre forme ne soit
         jugée hors cadre à tort. */
      nuage.frustumCulled = false;
      scene.add(nuage);

      /* Les câbles occupent tout l'écran, le menu et la carte se posent
         par-dessus dans les coins bas. Sur téléphone, carte et menu prennent la
         moitié basse : la forme remonte dans la moitié haute. */
      const miseEnPage = () => {
        if (!rendu) return;
        const largeur = stage.clientWidth;
        const hauteur = stage.clientHeight;
        if (!largeur || !hauteur) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        rendu.setPixelRatio(dpr);
        rendu.setSize(largeur, hauteur, false);
        camera.aspect = largeur / hauteur;
        camera.updateProjectionMatrix();

        const hauteurVue =
          2 *
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
          camera.position.z;
        const unite = hauteurVue / hauteur;
        const etroit = largeur <= LARGEUR_BUREAU;
        const centreY = etroit ? hauteur * 0.3 : hauteur / 2;

        const echelle = Math.min(
          1.35,
          (largeur * 0.94 * unite) / LARGEUR_FORMES,
          (hauteur * (etroit ? 0.5 : 0.88) * unite) / HAUTEUR_FORMES,
        );
        nuage.scale.setScalar(echelle);
        nuage.position.set(0, (hauteur / 2 - centreY) * unite, 0);
        /* La taille d'un point ne suit pas l'échelle du modèle : sans cette
           correction, une forme réduite sur téléphone se lirait en pâté. */
        materiau.uniforms.uDpr.value = dpr * (0.55 + 0.45 * echelle);
      };

      const peindre = (forme: number, temps: number) => {
        majEtape(forme);
        if (!rendu) return;
        materiau.uniforms.uForme.value = forme;
        nuage.rotation.x = entre(INCLINAISON, forme);
        /* Un balancement lent garde la forme vivante pendant qu'on lit. Il
           oscille au lieu de tourner : un câble qui traverse l'écran et fait
           des tours complets passerait la moitié du temps vu par le bout. */
        nuage.rotation.y =
          entre(PIVOT, forme) + (reduit ? 0 : Math.sin(temps * 0.00025) * 0.22);
        rendu.render(scene, camera);
      };

      let cible = 0;
      let lisse = 0;
      let raf = 0;
      let visible = false;

      /* La boucle continue tant que la forme n'a pas rattrapé le défilement, puis
         seulement si la section est à l'écran, pour le balancement. La
         transition ne dépend donc jamais de l'observateur de visibilité : s'il
         tarde à se prononcer, la forme suit quand même le défilement. */
      const image = (temps: number) => {
        lisse += (cible - lisse) * 0.07;
        if (Math.abs(cible - lisse) < 0.0005) lisse = cible;
        peindre(lisse, temps);
        raf = visible || lisse !== cible ? requestAnimationFrame(image) : 0;
      };

      const relancer = () => {
        if (!raf && !reduit && rendu) raf = requestAnimationFrame(image);
      };

      const trigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          cible = versForme(self.progress);
          if (reduit || !rendu) {
            lisse = cible;
            peindre(lisse, 0);
          } else {
            relancer();
          }
        },
      });

      /* La boucle ne tourne que lorsque la section est à l'écran : ailleurs,
         elle ferait travailler la carte graphique pour une image invisible. */
      const vigie = new IntersectionObserver(([entree]) => {
        visible = entree?.isIntersecting ?? false;
        if (visible) relancer();
      });
      vigie.observe(root);

      const surveillance = new ResizeObserver(() => {
        miseEnPage();
        if (!raf) peindre(lisse, performance.now());
      });
      surveillance.observe(stage);

      /* LES VIGNETTES DU MENU SONT DES PHOTOS DES QUATRE FORMES, prises par la
         scène elle-même au montage : aucun fichier à produire ni à héberger, et
         une vignette toujours fidèle à la forme réelle. Tout se passe dans la
         même tâche que la remise en place : le navigateur ne peint jamais le
         canevas pendant qu'il est réduit à la taille d'une vignette. */
      const photographier = () => {
        if (!rendu) return;
        const largeur = 480;
        const hauteur = 300;
        rendu.setPixelRatio(1);
        rendu.setSize(largeur, hauteur, false);
        camera.aspect = largeur / hauteur;
        camera.updateProjectionMatrix();
        const unite =
          (2 *
            Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
            camera.position.z) /
          hauteur;
        nuage.scale.setScalar(
          Math.min(
            (largeur * 0.86 * unite) / LARGEUR_FORMES,
            (hauteur * 0.86 * unite) / HAUTEUR_FORMES,
          ),
        );
        nuage.position.set(0, 0, 0);
        /* Plus épais qu'à l'écran : la vignette est affichée plus petite
           qu'elle n'est rendue, et des points fins y disparaîtraient. */
        materiau.uniforms.uDpr.value = 1.5;
        materiau.uniforms.uEtalement.value = 0;

        const photos: string[] = [];
        for (let forme = 0; forme < NB_FORMES; forme += 1) {
          materiau.uniforms.uForme.value = forme;
          nuage.rotation.set(INCLINAISON[forme], PIVOT[forme], 0);
          rendu.render(scene, camera);
          photos.push(canvas.toDataURL("image/webp", 0.82));
        }

        materiau.uniforms.uEtalement.value = ETALEMENT;
        setMiniatures(photos);
      };

      cible = versForme(trigger.progress);
      lisse = cible;
      photographier();
      miseEnPage();
      peindre(lisse, performance.now());

      return () => {
        trigger.kill();
        vigie.disconnect();
        surveillance.disconnect();
        if (raf) cancelAnimationFrame(raf);
        geometrie.dispose();
        materiau.dispose();
        rendu?.dispose();
      };
    };

    let arret: (() => void) | undefined;
    let annule = false;
    const approche = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((entree) => entree.isIntersecting)) return;
        approche.disconnect();
        void Promise.all([
          import("three"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]).then(([three, { gsap }, { ScrollTrigger }]) => {
          if (!annule) arret = monter(three, gsap, ScrollTrigger);
        });
      },
      { rootMargin: "150% 0px" },
    );
    approche.observe(root);

    return () => {
      annule = true;
      approche.disconnect();
      arret?.();
    };
  }, [nbEtapes]);

  /* Sur téléphone le menu est une bande qui défile à l'horizontale : l'étape
     active doit y être centrée, sinon elle sort de l'écran dès la deuxième. */
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu || window.innerWidth > LARGEUR_BUREAU) return;
    const option = menu.children[active] as HTMLElement | undefined;
    if (!option) return;
    const a = option.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    menu.scrollBy({
      left: a.left + a.width / 2 - (m.left + m.width / 2),
      behavior: "smooth",
    });
  }, [active]);

  /* Choisir une étape dans le menu fait défiler jusqu'à elle : la forme s'y
     transforme en chemin, au lieu de sauter d'un coup. */
  const goTo = (index: number) => {
    const root = rootRef.current;
    if (!root) return;
    const range = root.offsetHeight - window.innerHeight;
    const top = window.scrollY + root.getBoundingClientRect().top;
    window.scrollTo({
      top: top + (index / Math.max(steps.length - 1, 1)) * range,
      behavior: "smooth",
    });
  };

  const current = steps[active];
  if (!current) return null;

  const verre = "backdrop-blur-[28px]";

  return (
    <div ref={rootRef} className="relative h-[640svh] sm:h-[600vh]">
      <div
        ref={stageRef}
        className="sticky top-0 h-svh overflow-hidden bg-ink-950 sm:h-screen"
      >
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 h-full w-full"
        />
        <div className="bg-anvil pointer-events-none absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(7,7,10,0.75)_100%)]" />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(7,7,10,0.85)_0%,rgba(7,7,10,0.4)_42%,transparent_64%)] min-[901px]:hidden`}
        />

        {/* Le repère vise le centre de la forme, donc le centre exact de
            l'écran : placé dans la colonne du milieu de la grille, il se
            décalait dès que menu et carte n'avaient pas la même largeur. Il
            fixe le regard pendant que la matière se réorganise autour. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 hidden size-[54px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-white/85 min-[901px]:grid"
        >
          <i className="block size-2 rounded-full bg-ember-400 shadow-[0_0_14px_#ff7a18]" />
        </div>

        <div
          className={`pointer-events-none absolute inset-0 grid grid-cols-1 content-end gap-2.5 pt-[calc(72px+env(safe-area-inset-top))] pr-[max(14px,env(safe-area-inset-right))] pb-[calc(20px+max(14px,env(safe-area-inset-bottom)))] pl-[max(14px,env(safe-area-inset-left))] min-[901px]:grid-cols-[auto_1fr_auto] min-[901px]:content-stretch min-[901px]:items-end min-[901px]:gap-0 min-[901px]:pt-[calc(88px+env(safe-area-inset-top))] min-[901px]:pr-[max(clamp(14px,4vw,36px),env(safe-area-inset-right))] min-[901px]:pb-[34px] min-[901px]:pl-[max(clamp(14px,4vw,36px),env(safe-area-inset-left))]`}
        >
          {/* LE MENU. Sur grand écran, une colonne vitrée où l'étape active
              déplie la photo de sa forme ; sur téléphone, une bande de
              pastilles qui défile sous la carte. */}
          <div
            ref={menuRef}
            className={`pointer-events-auto order-2 flex w-full snap-x snap-proximity gap-2 overflow-x-auto overflow-y-hidden rounded-[10px] bg-[rgba(36,36,38,0.42)] p-2.5 [scrollbar-width:none] ${verre} [&::-webkit-scrollbar]:hidden min-[901px]:order-none min-[901px]:block min-[901px]:w-[min(320px,38vw)] min-[901px]:overflow-visible min-[901px]:px-[18px] min-[901px]:py-[22px] min-[1025px]:w-80`}
          >
            {steps.map((step, index) => {
              const actif = index === active;
              const photo = miniatures[index];
              return (
                <button
                  key={step.n}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-current={actif ? "step" : undefined}
                  className={`min-h-11 w-[min(168px,44vw)] flex-none snap-center rounded-md px-1.5 py-2 text-left text-[13px] leading-tight font-medium tracking-[-0.02em] transition-colors duration-[250ms] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-ember-400 max-[480px]:w-[min(152px,48vw)] max-[480px]:text-xs min-[901px]:block min-[901px]:w-full min-[901px]:px-1 min-[901px]:py-[9px] min-[901px]:text-[17px] ${actif ? "text-white" : "text-white/40 hover:text-white/70"}`}
                >
                  <span className="mr-2 text-ember-400/80 tabular-nums">
                    {step.n}
                  </span>
                  {step.title}
                  {photo ? (
                    /* Une photo en data URL, prise par la scène : next/image
                       n'a rien à optimiser ici. */
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt=""
                      className={`block w-full rounded-lg object-cover transition-[height,opacity,margin] duration-[450ms] ease-out ${actif ? `mt-2 mb-1.5 h-16 opacity-100 min-[901px]:mt-3 min-[901px]:mb-2.5 min-[901px]:h-[172px] [@media(max-height:500px)_and_(orientation:landscape)]:h-12` : `h-0 opacity-0 max-[900px]:hidden`}`}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* LA CARTE. L'ancienne étape et la nouvelle s'empilent dans la même
              case : l'une sort pendant que l'autre entre, sans vide entre. */}
          <article
            className={`pointer-events-auto order-1 grid w-full rounded-[14px] bg-[rgba(28,28,30,0.48)] px-4 py-[18px] ${verre} min-[901px]:order-none min-[901px]:col-start-3 min-[901px]:min-h-[280px] min-[901px]:w-[min(420px,40vw)] min-[901px]:px-7 min-[901px]:pt-7 min-[901px]:pb-[26px] min-[1025px]:w-[min(420px,34vw)] [@media(max-height:500px)_and_(orientation:landscape)]:p-3.5`}
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={current.n}
                initial={{ opacity: 0, y: direction * 14, filter: "blur(8px)" }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] },
                }}
                exit={{
                  opacity: 0,
                  filter: "blur(6px)",
                  transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
                }}
                className="col-start-1 row-start-1"
              >
                <div className="flex items-center gap-2.5 text-[10px] font-semibold tracking-[0.12em] text-white/55 uppercase">
                  <Icon name={current.icon} className="size-4 text-ember-400" />
                  {labels.step} {current.n} {labels.of} {steps.length}
                </div>
                <h3
                  className={`mt-3 mb-3 font-display text-[clamp(22px,6vw,26px)] leading-tight font-semibold tracking-[-0.04em] text-bone-50 max-[480px]:text-[21px] min-[901px]:mb-[22px] min-[901px]:text-[clamp(28px,2.8vw,42px)] [@media(max-height:500px)_and_(orientation:landscape)]:mb-2 [@media(max-height:500px)_and_(orientation:landscape)]:text-xl`}
                >
                  {current.title}
                </h3>
                {current.specs.map((spec) => (
                  <div
                    key={spec.k}
                    className={`mb-3 flex items-start gap-2.5 min-[901px]:mb-4 [@media(max-height:500px)_and_(orientation:landscape)]:mb-2`}
                  >
                    <b className="mt-[3px] block h-3.5 w-[3px] shrink-0 rounded-sm bg-ember-500" />
                    <div className="min-w-0">
                      <small
                        className={`mb-1 block text-[9px] font-semibold tracking-[0.12em] text-white/55 uppercase min-[901px]:text-[10px]`}
                      >
                        {spec.k}
                      </small>
                      {spec.tag ? (
                        /* Texte sombre sur la braise : en blanc, la pastille
                           tomberait sous le seuil de contraste. */
                        <span className="mt-1 inline-block max-w-full rounded-md bg-ember-500 px-2 py-1 text-[11px] font-semibold break-words text-ink-950 max-[480px]:px-1.5 max-[480px]:py-[3px] max-[480px]:text-[10px]">
                          {spec.tag}
                        </span>
                      ) : (
                        <span
                          className={`text-sm font-medium break-words text-bone-100 min-[901px]:text-[15px]`}
                        >
                          {spec.v}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </article>
        </div>
      </div>
    </div>
  );
}
