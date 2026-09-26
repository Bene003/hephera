/**
 * LE MOT SUR L'ÉCRAN DU ROBOT.
 *
 * De temps en temps, les yeux du robot se ferment en deux traits, les traits se
 * rejoignent en une ligne, et la ligne s'ouvre sur « HEPHERA », comme un vieil
 * écran qui s'allume. Puis tout se rejoue à l'envers et les yeux reviennent.
 *
 * L'animation est dessinée en direct sur un canevas « à plat » (1024x768), puis
 * plaquée sur l'écran de l'image affichée par une transformation en perspective.
 * Elle ne peut pas être précalculée en vidéo : la tête tourne au rythme de la
 * souris, donc l'écran change de forme pendant que le mot s'affiche.
 *
 * Les coins de l'écran et les yeux de chaque image de la vidéo ont été repérés
 * une fois pour toutes (lib/hero-robot-ecran.json). Les yeux dessinés partent
 * de la position des vrais yeux de l'image courante : le relais ne se voit pas.
 */

export const TEXTURE = { l: 1024, h: 768 };

/* Teintes relevées sur la vidéo : la vitre entre les yeux, et le coeur des
   yeux. À relever de nouveau si la vidéo change. */
const VITRE = "109, 108, 104";
const LUMIERE = "241, 218, 235";

/* La vraie vitre reste visible à 41 % à travers la nôtre, avec ses reflets :
   c'est ce qui rend le passage invisible. Les vrais yeux sont couverts en plein,
   sinon ils réapparaîtraient derrière les yeux dessinés une fois fermés. */
const OPACITE_VITRE = 0.59;

const MOT = "HEPHERA";
const POLICE = "500 132px 'Helvetica Neue', Helvetica, Arial, sans-serif";
const INTERLETTRE = 26;
const LIGNE_V = 384;
const DEMI_TRAIT = 5;

/** Durées en millisecondes. */
export const DUREES = {
  fondu: 80,
  fermer: 420,
  fusion: 500,
  ouvrir: 500,
  tenir: 1250,
};
const ALLER = DUREES.fermer + DUREES.fusion + DUREES.ouvrir;
export const DUREE_TOTALE = DUREES.fondu * 2 + ALLER * 2 + DUREES.tenir;

/** Un oeil dans le repère de la texture : centre et demi-axes. */
export type Oeil = { u: number; v: number; ru: number; rv: number };

function lisse(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Les trois avancements à l'aller : a = fermeture, b = fusion, c = ouverture. */
function aller(x: number) {
  const { fermer, fusion, ouvrir } = DUREES;
  if (x < fermer) return { a: lisse(x / fermer), b: 0, c: 0 };
  if (x < fermer + fusion) return { a: 1, b: lisse((x - fermer) / fusion), c: 0 };
  return { a: 1, b: 1, c: lisse((x - fermer - fusion) / ouvrir) };
}

/** L'état de l'écran à `t` ms du début : l'aller, le mot tenu, puis l'aller rejoué à l'envers. */
export function etat(t: number) {
  const opacite = Math.min(1, t / DUREES.fondu, (DUREE_TOTALE - t) / DUREES.fondu);
  const x = t - DUREES.fondu;
  if (x <= 0 || x >= ALLER * 2 + DUREES.tenir) return { a: 0, b: 0, c: 0, opacite };
  if (x < ALLER) return { ...aller(x), opacite };
  if (x < ALLER + DUREES.tenir) return { a: 1, b: 1, c: 1, opacite };
  return { ...aller(ALLER * 2 + DUREES.tenir - x), opacite };
}

/* Lignes de balayage : une bande sombre de 3 px toutes les 6 px. */
let motifBalayage: CanvasPattern | null = null;
function balayage(ctx: CanvasRenderingContext2D) {
  if (!motifBalayage) {
    const tuile = document.createElement("canvas");
    tuile.width = 1;
    tuile.height = 6;
    const t = tuile.getContext("2d");
    if (t) {
      t.fillStyle = "rgba(0, 0, 0, 0.07)";
      t.fillRect(0, 3, 1, 3);
    }
    motifBalayage = ctx.createPattern(tuile, "repeat");
  }
  return motifBalayage;
}

/* Le mot, lettre par lettre : l'interlettrage du canevas n'existe pas partout. */
function mesurerMot(ctx: CanvasRenderingContext2D) {
  ctx.font = POLICE;
  const avances = [...MOT].map((lettre) => ctx.measureText(lettre).width);
  const largeur =
    avances.reduce((somme, a) => somme + a, 0) + INTERLETTRE * (MOT.length - 1);
  return { avances, largeur };
}

function dessinerMot(ctx: CanvasRenderingContext2D, gauche: number) {
  const { avances } = mesurerMot(ctx);
  ctx.textBaseline = "middle";
  let x = gauche;
  [...MOT].forEach((lettre, index) => {
    ctx.fillText(lettre, x, LIGNE_V);
    x += (avances[index] ?? 0) + INTERLETTRE;
  });
}

function capsule(ctx: CanvasRenderingContext2D, g: number, d: number, v: number) {
  ctx.beginPath();
  ctx.roundRect(g, v - DEMI_TRAIT, Math.max(d - g, DEMI_TRAIT * 2), DEMI_TRAIT * 2, DEMI_TRAIT);
  ctx.fill();
}

/**
 * Dessine l'écran à l'instant `t`, pour les vrais yeux de l'image courante.
 */
export function dessinerEcran(
  ctx: CanvasRenderingContext2D,
  t: number,
  yeux: [Oeil, Oeil],
) {
  const { l, h } = TEXTURE;
  const { a, b, c } = etat(t);
  ctx.clearRect(0, 0, l, h);

  /* La vitre, et les caches pleins sur les vrais yeux, à bords adoucis. */
  ctx.fillStyle = `rgba(${VITRE}, ${OPACITE_VITRE})`;
  ctx.fillRect(0, 0, l, h);
  for (const oeil of yeux) {
    ctx.save();
    ctx.translate(oeil.u, oeil.v);
    ctx.scale(oeil.ru * 1.3, oeil.rv * 1.25);
    const cache = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.3);
    cache.addColorStop(0, `rgba(${VITRE}, 1)`);
    cache.addColorStop(0.75, `rgba(${VITRE}, 1)`);
    cache.addColorStop(1, `rgba(${VITRE}, 0)`);
    ctx.fillStyle = cache;
    ctx.beginPath();
    ctx.arc(0, 0, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* La lumière : yeux, traits, ligne ou mot, avec leur halo. */
  ctx.save();
  ctx.fillStyle = `rgb(${LUMIERE})`;
  ctx.shadowColor = `rgba(${LUMIERE}, 0.85)`;
  ctx.shadowBlur = 28;
  const { largeur } = mesurerMot(ctx);
  const motGauche = (l - largeur) / 2;
  const motDroite = motGauche + largeur;
  const milieu = (motGauche + motDroite) / 2;

  if (c > 0) {
    /* La ligne s'ouvre en bande : le mot apparaît entre ses deux bords, qui
       s'écartent et s'éteignent. */
    const demi = c * (132 / 2 + 14);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, LIGNE_V - demi, l, demi * 2);
    ctx.clip();
    dessinerMot(ctx, motGauche);
    ctx.restore();
    ctx.globalAlpha = 1 - c;
    capsule(ctx, motGauche, motDroite, LIGNE_V - demi);
    capsule(ctx, motGauche, motDroite, LIGNE_V + demi);
  } else {
    yeux.forEach((oeil, index) => {
      if (b === 0) {
        ctx.beginPath();
        ctx.ellipse(oeil.u, oeil.v, oeil.ru, lerp(oeil.rv, DEMI_TRAIT, a), 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        /* Chaque trait s'étire vers sa moitié du mot ; ensemble ils forment la ligne. */
        const g = lerp(oeil.u - oeil.ru, index === 0 ? motGauche : milieu, b);
        const d = lerp(oeil.u + oeil.ru, index === 0 ? milieu : motDroite, b);
        capsule(ctx, g, d, lerp(oeil.v, LIGNE_V, b));
      }
    });
  }
  ctx.restore();

  const motif = balayage(ctx);
  if (motif) {
    ctx.fillStyle = motif;
    ctx.fillRect(0, 0, l, h);
  }
}

/**
 * La transformation CSS qui plaque un élément de la taille de la texture sur
 * un quadrilatère quelconque (coins haut-gauche, haut-droit, bas-gauche,
 * bas-droit). Formule fermée d'Heckbert pour le carré unité, remise à
 * l'échelle de la texture.
 */
export function matricePerspective(
  quad: [[number, number], [number, number], [number, number], [number, number]],
) {
  const [[x0, y0], [x1, y1], [x3, y3], [x2, y2]] = quad;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = det === 0 ? 0 : (dx3 * dy2 - dx2 * dy3) / det;
  const h = det === 0 ? 0 : (dx1 * dy3 - dx3 * dy1) / det;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  const { l, h: ht } = TEXTURE;
  return `matrix3d(${a / l}, ${d / l}, 0, ${g / l}, ${b / ht}, ${e / ht}, 0, ${h / ht}, 0, 0, 1, 0, ${x0}, ${y0}, 0, 1)`;
}
