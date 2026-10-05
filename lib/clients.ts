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
  /** The stack the site runs on, shown next to the name. */
  tech: string;
};

export const clients: Client[] = [
  { name: "Wrong Sense", url: "wrongsense.com", tech: "Shopify" },
  { name: "Frédéric Rent a Bike", url: "www.frederic.nl", tech: "Wix" },
  { name: "Les Petits Yéyés", url: "www.lespetitsyeyes.com", tech: "Shopify" },
  { name: "Mello", url: "mello-matelas.fr", tech: "Shopify" },
  { name: "361 Studios", url: "www.361studios.ca", tech: "Next.js" },
  { name: "DeezShop", url: "www.deezshop.ca", tech: "Next.js" },
  { name: "Lambert", url: "www.designlambert.com", tech: "Shopify" },
  { name: "Synergy Homes", url: "synergyhomeswpg.ca", tech: "Next.js" },
];
