# Planificateur de week-ends

PWA pour un couple qui planifie ses fins de semaine sur une base annuelle : obligations, choses prévues d'avance, idées — avec détection automatique de la règle "au moins 1 fin de semaine sur 2 sans rien à l'extérieur de la ville".

Stack : Next.js (App Router) + Supabase (Postgres, Auth, Realtime) + Vercel.

## Structure du projet

```
src/
  app/                  routes (Next.js App Router)
    login/              écran de connexion
    page.tsx            écran principal (rend PlannerApp)
  components/           écrans + planner.module.css (styles, tous via tokens CSS)
  hooks/usePlannerData.ts  fetch initial + sync temps réel Supabase + mutations
  lib/
    weekends.ts         logique métier pure (statuts, violations, récurrences...)
    weekends.test.ts     tests unitaires de cette logique
    types.ts             types partagés (DB rows + types applicatifs)
    supabase/            clients Supabase (browser/server/proxy) + contexte auth
  proxy.ts               proxy Next.js 16 (anciennement middleware) : protège les routes
supabase/migrations/0001_init.sql   schéma complet + RLS + realtime
scripts/generate-icons.mjs          régénère les icônes PWA placeholder
```

Le design system implémenté est **"Confettis"** (direction 1a retenue lors de la passe 1) : fond crème, cases en "papier découpé" aux coins arrondis avec ombre décalée, Anton (titres) + Archivo (texte) + Space Mono (labels/mono). Toutes les couleurs/espacements passent par les tokens CSS définis dans `src/app/globals.css` (`--color-*`, `--space-*`, `--radius-*`, `--font-*`, `--shadow-*`) — un futur remaniement visuel n'a qu'à changer ces valeurs, pas les composants. Les icônes de statut (libre = anneau, protégé = bouclier, local = triangle, extérieur = losange) et les puces de catégorie (obligation = carré, prévu = cercle, envie = triangle) sont des composants dédiés (`StatusIcon`, `CategoryDot`) qui reproduisent exactement les formes du système de design.

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) et crée un nouveau projet.
2. Dans **SQL Editor**, colle le contenu de `supabase/migrations/0001_init.sql` et exécute-le. Ça crée les tables (`events`, `ideas`, `recurring_rules`, `protected_weekends`, `skipped_recurring_instances`), les policies RLS (accès partagé entre les deux comptes) et active Realtime sur ces tables.
3. Dans **Authentication → Providers**, assure-toi qu'Email est activé. Désactive les inscriptions publiques si tu veux garder l'app fermée aux deux comptes seulement (**Authentication → Settings → Allow new users to sign up** → off).
4. Dans **Authentication → Users**, crée manuellement les deux comptes du couple (email + mot de passe). C'est volontairement à deux comptes fixes, pas d'inscription libre.
5. Récupère l'URL du projet et la clé `anon public` dans **Project Settings → API**.

## 2. Configurer l'environnement local

```bash
cp .env.local.example .env.local
```

Renseigne `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local`.

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) — tu devrais être redirigé vers `/login`. Connecte-toi avec un des deux comptes créés à l'étape précédente.

## 3. Vérifications

```bash
npm run test    # logique métier (statuts, violations, récurrences...)
npm run lint
npm run build
```

> Dans cet environnement de build, `npm run build` a été validé avec des identifiants Supabase factices (les pages sont statiques/côté client, aucun appel réseau n'a lieu à la compilation). Le flux complet (connexion, sync temps réel entre deux comptes) n'a pas pu être testé de bout en bout faute d'un vrai projet Supabase provisionné ici — à vérifier une fois `.env.local` rempli avec un vrai projet. L'écran de connexion et le rendu des trois écrans principaux (vue annuelle, backlog d'idées, récurrents) ont été vérifiés visuellement avec des données factices.

## 4. Déploiement sur Vercel

1. Importe le repo dans Vercel.
2. Ajoute les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans les réglages du projet Vercel (Production + Preview).
3. Déploie. Next.js détecte automatiquement le framework, aucune config supplémentaire requise.

## 5. Installer la PWA sur les deux téléphones

- **iOS (Safari)** : ouvrir l'URL du déploiement → bouton Partager → "Sur l'écran d'accueil".
- **Android (Chrome)** : ouvrir l'URL → menu ⋮ → "Ajouter à l'écran d'accueil" (ou bannière d'installation automatique).

L'app est installable sans passer par un app store (`public/manifest.json` + `public/sw.js`). Les icônes actuelles (`public/icons/`, `public/apple-touch-icon.png`) sont des placeholders générés par `scripts/generate-icons.mjs` — à remplacer lors de la passe de design (mêmes noms de fichiers/tailles pour que rien d'autre n'ait à changer).

## Logique métier

Toute la logique (statuts de fin de semaine, détection de violation, génération des récurrences, ratio d'occupation, assignation bidirectionnelle idée ↔ fin de semaine) vit dans `src/lib/weekends.ts`, portée fidèlement depuis le prototype `planificateur-weekends.jsx` fourni. Les fins de semaine ne sont jamais stockées en base ; elles sont recalculées à la volée (année courante + année suivante) à partir de la date du jour. Voir `src/lib/weekends.test.ts` pour les cas couverts (priorité des statuts, détection de paires consécutives, portée du ratio par année affichée, etc.).

## Hors scope (cette version)

Import Google Calendar, notifications, historique/statistiques, multi-couples.
