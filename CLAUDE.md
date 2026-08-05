# hugobetelu.fr — site perso (refonte front)

Refonte complète du site perso pro de **Hugo Betelu** (designer & journaliste — trail, images, récits). On **garde le contenu** (articles), on **refait design + architecture**. Projet **100 % personnel**, aucun lien avec un quelconque projet client.

## Stack
- **Astro** (v7, TypeScript) — front statique, ce dépôt.
- **WordPress en headless** = source de contenu uniquement. Hugo garde son admin WP pour écrire ; le front tire articles/pages via l'**API REST** (`/wp-json/wp/v2/`).
- Direction : **noir & blanc éditorial, mobile-first**, mêmes URLs que l'actuel (SEO préservé).

## Développement
Depuis ce dossier :
- `npx astro dev --background` puis `npx astro dev status|logs|stop` → http://localhost:4321
- Node v24 (`/usr/local/bin/node`).
- Piège npm 11 : si esbuild est bloqué, `npm approve-scripts esbuild && npm rebuild esbuild`.

## Contenu (WordPress headless)
- Base API : variable `PUBLIC_WP_API` dans `.env`. Dev = copie locale ; prod = `https://hugobetelu.fr`.
- Couche de données : `src/lib/wordpress.ts` (`getPosts` / `getPostBySlug` / `getPageBySlug`).
- **Copie locale WordPress** (app *Local*) : `~/Local Sites/hugobetelufr/app/public`, URL `http://hugobetelufr.local`, login wp-admin `admin4921`. Le site doit être **démarré dans Local** pour que l'API réponde.
- Piloter WP-CLI hors shell Local : charger l'env depuis `~/Local Sites/hugobetelufr/app/.envrc` (`PHPRC`, `MYSQL_HOME`, `PATH` ; l'identifiant de run change à chaque redémarrage). Les commandes **PHP** (`wp option get`, `wp search-replace`, `wp post list`) marchent ; les commandes **binaire mysql** (`wp db query/import/export`) cherchent le mauvais socket `/tmp/mysql.sock` → préférer les commandes PHP.

## Design
- Polices **auto-hébergées** (`public/fonts/`, WOFF2) : **League Gothic** = titres/sections (toujours CAPITALES) ; **Lora** = corps (regular), CTA (bold), emphase (italic). Fichiers sources dans `design-inbox/`.
- **Portrait dessiné** : déposer le fichier en **`public/portrait.png`** → l'accueil l'affiche automatiquement (sinon placeholder).
- Maquettes **Figma** : fichier « Site-web », fileKey `5JfkB4AVLas1vnPlyAGNHe` ; accueil mobile = node `1:2`. Pas de variables/tokens Figma définis.

## Structure du code
- `src/pages/index.astro` — accueil (v0 fidèle à la maquette, branché sur les vrais articles).
- `src/layouts/Base.astro` — layout + préchargement polices + `<Header/>`.
- `src/components/Header.astro` — nav desktop + burger mobile. **Liens de nav = PROVISOIRES**, en attente de la nouvelle architecture de Hugo.
- `src/styles/global.css` — tokens (couleurs, typo), boutons pastille.

## Contact (formulaire → email)
- Front : `src/pages/contact.astro` poste (form-urlencoded) vers l'endpoint WP `POST /wp-json/hugo/v1/contact`.
- Back : mu-plugin WordPress `hugo-contact.php` (validation, honeypot anti-spam, `wp_mail` vers hugobetelu@gmail.com, en-tête CORS `*`).
  - **Copie versionnée** dans ce dépôt : `wordpress/mu-plugins/hugo-contact.php`. Le fichier ACTIF est côté WordPress : `~/Local Sites/hugobetelufr/app/public/wp-content/mu-plugins/`.
  - En local, l'email est capturé par **Mailpit** (Local), pas envoyé au vrai Gmail.
  - **Déploiement** : copier ce mu-plugin dans le WordPress de prod + installer **WP Mail SMTP** pour une livraison fiable vers Gmail.

## À faire (prochaines étapes)
- **Nouvelle architecture** (Hugo doit la fournir) → ajuster la nav et les pages.
- Déposer `public/portrait.png`.
- Construire les pages : article, blog, portfolio, à-propos (selon la nouvelle archi).
- Déploiement front statique (Netlify / Vercel / Cloudflare) + brancher l'API sur le WordPress de prod.
- (Optionnel) pousser ce dépôt sur un GitHub privé pour la sauvegarde.
