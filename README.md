# Hephera

Site vitrine du studio numérique Hephera. Next.js 16 (App Router), TypeScript, Tailwind v4, bilingue FR/EN.

## Démarrer

```bash
npm run dev     # http://localhost:3000 → redirige vers /fr
npm run build   # build de production
npm run lint
```

## Structure

```
app/[locale]/                  # racine bilingue (fr | en) — contient le root layout
  page.tsx                     # accueil (hero, services, méthode, philosophie, studio, valeurs, FAQ, CTA)
  services/page.tsx            # index des services
  services/[slug]/page.tsx     # page détaillée d'un service
  contact/page.tsx             # formulaire de contact
app/api/contact/route.ts       # envoi du formulaire via Resend
lib/content/fr.ts | en.ts      # TOUT le texte du site
lib/services.ts                # clés + slugs localisés des 4 services
lib/i18n.ts                    # locales, URL du site, courriel de contact
components/                    # header, footer, formulaire, UI, sections
```

**Pour modifier un texte**, il n'y a qu'un seul endroit : `lib/content/fr.ts` et son miroir `lib/content/en.ts`.
Les deux fichiers partagent le même type, donc TypeScript signale immédiatement une traduction oubliée.

**Pour ajouter un service** : ajouter la clé dans `lib/services.ts` (avec ses slugs FR et EN), puis son contenu
dans les deux dictionnaires. Les pages, le menu, le footer et le sitemap se mettent à jour tout seuls.

## Variables d'environnement

Copier `.env.example` vers `.env.local` :

| Variable               | Rôle                                                       |
| ---------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | URL publique, utilisée pour le sitemap et les balises SEO   |
| `RESEND_API_KEY`       | Clé Resend pour l'envoi des courriels du formulaire         |
| `CONTACT_FROM_EMAIL`   | Expéditeur (domaine vérifié dans Resend)                    |
| `CONTACT_TO_EMAIL`     | Destinataire des demandes                                   |

Sans `RESEND_API_KEY`, le formulaire fonctionne en développement : la demande est affichée dans la
console du serveur au lieu d'être envoyée. En production, l'absence de clé renvoie une erreur.

## SEO

- `hreflang` FR/EN sur chaque page, slugs de services traduits (`/fr/services/automatisation` ↔ `/en/services/automation`)
- `sitemap.xml` et `robots.txt` générés automatiquement
- JSON-LD `ProfessionalService` sur l'accueil
