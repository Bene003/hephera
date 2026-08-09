/**
 * Businesses Hephera has delivered for. Kept out of the dictionaries on purpose:
 * a company name and its address are the same in both languages, and copying
 * them into fr.ts and en.ts would mean two places to get a client's own name
 * wrong.
 *
 * Elyra and CapitalHype are deliberately absent. They are our own products, not
 * clients, and a reference list is the last place to blur that line.
 */
export type Client = {
  name: string;
  /** No scheme, no trailing slash: the band prints this and links to it. */
  url: string;
};

export const clients: Client[] = [
  { name: "Castellana Clínica Dental", url: "castellanaclinicadental.es" },
  { name: "Wrong Sense", url: "wrongsense.com" },
  { name: "Lisbon by Design", url: "www.lisbonbydesign.com" },
  { name: "Ericeira Sense", url: "ericeirasense.com" },
  { name: "Black Cat Cinema", url: "www.theblackcatcinema.com" },
  { name: "Inside Marbella", url: "insidemarbella.es" },
  { name: "Ceramiche De Simone", url: "www.ceramichedesimone.com" },
  { name: "Athens Food on Foot", url: "www.athensfoodonfoot.com" },
  { name: "Les Caves du Père Auguste", url: "www.pereauguste.com" },
  { name: "Frédéric Rent a Bike", url: "www.frederic.nl" },
];
