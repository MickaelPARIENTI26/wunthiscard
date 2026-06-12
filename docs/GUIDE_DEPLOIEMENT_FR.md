# 🚀 Guide de déploiement WinUCard — pas à pas pour débutant

Ce guide t'emmène de **rien du tout** jusqu'à un site **en ligne et fonctionnel**.
Tu vas créer ~6 comptes (gratuits au départ), récupérer des "clés", et les coller
dans Vercel. Compte ~2-3 heures la première fois. Suis les étapes **dans l'ordre**.

> 💡 Une "clé" / "secret" / "token" = un mot de passe technique que les services
> te donnent. Tu les copies-colles, tu ne les inventes pas (sauf 2 indiqués).

---

## 🗺️ Vue d'ensemble — ce qu'on va brancher

| Service | À quoi ça sert | Gratuit pour démarrer ? |
|---|---|---|
| **GitHub** | Stocke ton code (déjà fait ✅) | Oui |
| **Vercel** | Héberge le site (le met en ligne) | Oui |
| **Neon** | Base de données (utilisateurs, tickets…) | Oui |
| **Upstash** | Redis (anti-triche, limites de requêtes) | Oui |
| **Resend** | Envoi des emails | Oui (3000/mois) |
| **Cloudflare** | Stockage images (R2) + Captcha (Turnstile) | Oui |
| **Stripe** | Paiements par carte | Gratuit, commission par vente |

Tu auras **2 sites** en ligne : le site public (`web`) et le panneau admin (`admin`).

---

## ÉTAPE 0 — Préparer ton ordinateur (15 min)

Tu as besoin de pouvoir lancer 2-3 commandes pour la base de données.

1. Installe **Node.js 20** : va sur https://nodejs.org → télécharge la version "LTS" → installe.
2. Vérifie que ça marche : ouvre le **Terminal** (Mac : app "Terminal" ; Windows : "PowerShell")
   et tape :
   ```
   node --version
   ```
   Tu dois voir quelque chose comme `v20.x.x`.
3. Place-toi dans le dossier du projet (adapte le chemin) :
   ```
   cd /Users/elinoreparienti/Documents/winthiscard
   ```
4. Installe les dépendances une fois :
   ```
   npm install
   ```

✅ Ton code est déjà sur GitHub (`MickaelPARIENTI26/wunthiscard`). Rien à faire de plus côté GitHub.

---

## ÉTAPE 1 — La base de données (Neon) (15 min)

1. Va sur https://neon.tech → **Sign up** (connecte-toi avec GitHub, c'est le plus simple).
2. Clique **Create project** :
   - Name : `winucard`
   - Region : choisis **Europe (Frankfurt)** ou **London** (proche de tes joueurs UK).
   - Postgres version : laisse par défaut.
3. Une fois créé, Neon affiche une **Connection string**. Tu vas avoir besoin de **deux** versions :
   - Repère le sélecteur **"Pooled connection"** (interrupteur on/off) au-dessus de la chaîne.
   - **Version POOLED (interrupteur ON)** → copie-la, garde-la de côté, c'est ta `DATABASE_URL` **pour le site**.
     Elle ressemble à : `postgresql://...-pooler.eu-...neon.tech/winucard?sslmode=require`
   - **Version DIRECTE (interrupteur OFF)** → copie-la aussi, garde-la de côté. Tu t'en serviras
     **une seule fois** pour installer les tables (étape 9).

> 📝 Note ces 2 chaînes dans un fichier texte temporaire. On les appellera plus bas
> `DATABASE_URL_POOLED` et `DATABASE_URL_DIRECT`.

---

## ÉTAPE 2 — Redis (Upstash) (10 min)

1. Va sur https://upstash.com → **Sign up** (avec GitHub).
2. **Create Database** :
   - Name : `winucard`
   - Type : **Regional**
   - Region : **EU-West-1 (Ireland)** ou la plus proche de l'UK.
3. Une fois créé, va dans l'onglet **REST API** de la base. Copie :
   - `UPSTASH_REDIS_REST_URL`  (commence par `https://...upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (longue chaîne)

> Note-les. (Le champ `REDIS_URL` du projet est optionnel, tu peux le laisser vide.)

---

## ÉTAPE 3 — Emails (Resend) (20 min — inclut le domaine)

1. Va sur https://resend.com → **Sign up**.
2. **API Keys** → **Create API Key** → nomme-la `winucard` → copie la clé
   (commence par `re_...`). C'est ta `RESEND_API_KEY`.
3. **Vérifier ton domaine** (obligatoire pour que les emails partent vraiment) :
   - Il te faut un **nom de domaine** (ex : `winucards.com`). Si tu n'en as pas,
     achètes-en un (~10€/an) chez Namecheap, OVH, Cloudflare, etc.
   - Dans Resend : **Domains** → **Add Domain** → entre ton domaine.
   - Resend te donne des enregistrements **DNS** (SPF, DKIM, DMARC) à ajouter.
   - Va chez ton fournisseur de domaine → zone DNS → ajoute ces enregistrements
     (copie-colle exactement). Reviens dans Resend et clique **Verify**.
     (Ça peut prendre quelques minutes à quelques heures.)
4. Choisis ton **adresse d'envoi** : par exemple `noreply@winucards.com`.
   C'est ta variable `FROM_EMAIL`.

> ⚠️ Choisis **UN seul** domaine et garde-le partout (le code mentionnait
> `winucards.com` / `winucard.co.uk` — décide-toi pour un seul).

---

## ÉTAPE 4 — Stockage des images (Cloudflare R2) (20 min)

C'est là que seront stockées les photos de profil (et tu peux y mettre les images de cartes).

1. Va sur https://cloudflare.com → **Sign up** (gratuit).
2. Dans le menu de gauche : **R2** → active-le (il peut demander une carte bancaire
   pour vérification, mais le palier gratuit est large : 10 Go).
3. **Create bucket** :
   - Name : `winucard-images`
   - Location : **Automatic** ou **EU**.
4. Récupère ton **Account ID** : en haut à droite du tableau R2, ou dans l'URL.
   C'est `R2_ACCOUNT_ID`.
5. **Manage R2 API Tokens** (bouton en haut à droite de la page R2) → **Create API Token** :
   - Permissions : **Object Read & Write**
   - Bucket : `winucard-images`
   - Crée → copie **Access Key ID** (`R2_ACCESS_KEY_ID`) et **Secret Access Key**
     (`R2_SECRET_ACCESS_KEY`). ⚠️ Le secret n'est affiché **qu'une fois**, copie-le tout de suite.
6. Rendre les images **publiquement lisibles** :
   - Dans ton bucket → onglet **Settings** → **Public access** → active **r2.dev subdomain**
     (ou connecte un domaine perso plus tard).
   - Copie l'URL publique fournie (ressemble à `https://pub-xxxx.r2.dev`).
     C'est `R2_PUBLIC_URL`.

> Tu as maintenant : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
> `R2_BUCKET_NAME=winucard-images`, `R2_PUBLIC_URL`.

---

## ÉTAPE 5 — Captcha anti-robots (Cloudflare Turnstile) (5 min)

Toujours dans Cloudflare (même compte) :

1. Menu de gauche → **Turnstile** → **Add site** :
   - Name : `winucard`
   - Domain : ton domaine (ex `winucards.com`) — tu pourras ajouter le domaine Vercel après.
   - Widget type : **Managed**.
2. Copie :
   - **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - **Secret Key** → `TURNSTILE_SECRET_KEY`

---

## ÉTAPE 6 — Paiements (Stripe) (20 min)

1. Va sur https://stripe.com → **Sign up**. Remplis les infos de ton entreprise
   (Stripe demande des infos légales/bancaires pour t'envoyer l'argent — tu peux
   commencer en mode test sans tout finaliser).
2. **Important** : en haut à droite il y a un interrupteur **"Test mode" / "Live mode"**.
   - Pour les **vrais paiements**, il faut passer en **Live mode** (l'entreprise doit
     être validée par Stripe). Tu peux d'abord tout configurer en **Test mode** pour
     répéter, puis refaire avec les clés Live.
3. **Developers → API keys** → copie :
   - **Secret key** (`sk_live_...` en live, `sk_test_...` en test) → `STRIPE_SECRET_KEY`
   - **Publishable key** (`pk_live_...` / `pk_test_...`) → `STRIPE_PUBLISHABLE_KEY`
4. Le **webhook** (`STRIPE_WEBHOOK_SECRET`) se configure **après** le déploiement,
   à l'étape 10 (car il faut l'adresse de ton site).

---

## ÉTAPE 7 — Générer la clé secrète d'authentification (2 min)

Cette clé chiffre les sessions de connexion. **Tu la génères toi-même.**

Dans le Terminal :
```
openssl rand -base64 32
```
Copie le résultat (une longue chaîne aléatoire). C'est ton `AUTH_SECRET`.
👉 La **même** valeur sera utilisée pour le site ET pour l'admin.

---

## ÉTAPE 8 — Déployer sur Vercel (30 min)

Tu vas créer **2 projets Vercel** à partir du **même** dépôt GitHub.

### 8A. Le site public (web)

1. Va sur https://vercel.com → **Sign up** avec GitHub.
2. **Add New… → Project** → autorise Vercel à accéder à ton repo → choisis
   `wunthiscard`.
3. Dans l'écran de config :
   - **Root Directory** → clique **Edit** → choisis `apps/web`. ⚠️ Étape cruciale.
   - Framework Preset : **Next.js** (auto-détecté).
   - Laisse Build/Install par défaut (Vercel comprend le monorepo).
4. **Environment Variables** : ajoute **toutes** les variables ci-dessous
   (clique "Add" pour chacune, Name = à gauche, Value = ce que tu as récupéré).
   ⚠️ **Avant** de cliquer Deploy — certaines variables `NEXT_PUBLIC_*` sont
   "gravées" au moment du build, donc elles doivent être présentes dès le 1er déploiement.

   **Variables pour le SITE (web) :**
   ```
   NEXT_PUBLIC_APP_URL        = https://VOTRE-DOMAINE-WEB.vercel.app   (tu corrigeras après si domaine perso)
   NEXT_PUBLIC_ADMIN_URL      = https://VOTRE-DOMAINE-ADMIN.vercel.app
   DATABASE_URL               = (DATABASE_URL_POOLED de Neon)
   UPSTASH_REDIS_REST_URL     = ...
   UPSTASH_REDIS_REST_TOKEN   = ...
   AUTH_SECRET                = (généré à l'étape 7)
   AUTH_TRUST_HOST            = true
   STRIPE_SECRET_KEY          = sk_live_...
   STRIPE_PUBLISHABLE_KEY     = pk_live_...
   STRIPE_WEBHOOK_SECRET      = (on le mettra à l'étape 10 — mets une valeur bidon "whsec_temp" pour l'instant)
   RESEND_API_KEY             = re_...
   FROM_EMAIL                 = noreply@VOTRE-DOMAINE
   NEXT_PUBLIC_TURNSTILE_SITE_KEY = ...
   TURNSTILE_SECRET_KEY       = ...
   R2_ACCOUNT_ID              = ...
   R2_ACCESS_KEY_ID           = ...
   R2_SECRET_ACCESS_KEY       = ...
   R2_BUCKET_NAME             = winucard-images
   R2_PUBLIC_URL              = https://pub-xxxx.r2.dev
   NODE_ENV                   = production
   ```
5. Clique **Deploy**. Attends ~2-3 min. Tu obtiens une URL type
   `https://wunthiscard-web.vercel.app`.
6. **Reviens dans Settings → Environment Variables** et corrige `NEXT_PUBLIC_APP_URL`
   avec la **vraie** URL obtenue. Puis **Redeploy** (onglet Deployments → … → Redeploy).

### 8B. Le panneau admin

1. **Add New… → Project** → **le même repo** `wunthiscard`.
2. **Root Directory** → `apps/admin`.
3. **Environment Variables** : pour faire simple, **remets les MÊMES variables qu'au 8A**
   (les variables en trop ne gênent pas), en changeant juste :
   ```
   NEXT_PUBLIC_APP_URL   = https://(URL du site web)
   NEXT_PUBLIC_ADMIN_URL = https://(URL de cet admin)
   AUTH_TRUST_HOST       = true
   ```
4. **Deploy**. Tu obtiens `https://wunthiscard-admin.vercel.app`.

> 🔁 Si tu mets des domaines personnalisés plus tard (ex `winucards.com` et
> `admin.winucards.com`), reviens mettre à jour `NEXT_PUBLIC_APP_URL` /
> `NEXT_PUBLIC_ADMIN_URL` / `AUTH_URL` puis Redeploy.

---

## ÉTAPE 9 — Installer les tables + créer ton compte admin (15 min)

Le site est en ligne mais la base est **vide** (aucune table). On va les créer
depuis ton ordinateur, en pointant vers la base de prod.

> On utilise ici la **DATABASE_URL_DIRECT** de Neon (étape 1), pas la pooled,
> car les migrations ont besoin d'une connexion directe.

1. Dans le Terminal, va dans le dossier base de données :
   ```
   cd /Users/elinoreparienti/Documents/winthiscard/packages/database
   ```
2. Crée toutes les tables (remplace `<DIRECT>` par ta chaîne directe Neon) :
   ```
   DATABASE_URL="<DIRECT>" npm run db:migrate:deploy
   ```
   Tu dois voir la liste des migrations "applied".
3. Crée ton **compte super-admin** + réglages de base (remplace les valeurs) :
   ```
   DATABASE_URL="<DIRECT>" ADMIN_EMAIL="toi@tondomaine.com" ADMIN_PASSWORD="UnMotDePasseFort123!" npm run db:bootstrap
   ```
   Tu dois voir `✅ SUPER_ADMIN ready`.

> ❌ **Ne lance JAMAIS** `npm run db:seed` sur la prod : c'est le jeu de données
> de test, **il efface tout**. (Le code le bloque déjà en production, mais évite.)

4. Teste la connexion admin : va sur l'URL de ton admin Vercel → `/login` →
   connecte-toi avec l'email + mot de passe que tu viens de créer. 🎉

---

## ÉTAPE 10 — Brancher le webhook Stripe (10 min)

Le webhook permet à Stripe de prévenir ton site quand un paiement réussit
(pour créer les tickets). **Indispensable.**

1. Dans Stripe (en **Live mode**) : **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL** :
   ```
   https://(URL de ton site web)/api/webhooks/stripe
   ```
3. **Select events** → ajoute au minimum :
   - `checkout.session.completed`
   (et si proposés : `charge.refunded`, `payment_intent.payment_failed`)
4. Crée l'endpoint → Stripe affiche un **Signing secret** (`whsec_...`).
   Copie-le.
5. Va dans **Vercel → projet web → Settings → Environment Variables** →
   remplace la valeur bidon de `STRIPE_WEBHOOK_SECRET` par ce vrai `whsec_...`.
6. **Redeploy** le site web (Deployments → … → Redeploy).

---

## ÉTAPE 11 — Test complet (smoke test) (20 min)

Fais le parcours d'un vrai joueur, sur ton site **en ligne** :

1. **Crée une compétition** depuis l'admin (avec une image, une question, une date de tirage).
2. Sur le site public : **inscris-toi** avec une vraie adresse email à toi.
   → Tu dois **recevoir l'email de vérification**. Clique le lien → compte vérifié.
3. **Choisis des tickets** → réponds à la **question** → page **paiement**.
4. Paye (en Live = vraie carte ; ou répète d'abord en Test mode avec la carte
   test `4242 4242 4242 4242`, date future, CVC quelconque).
5. Après paiement → tu dois être redirigé en "succès", **recevoir l'email de
   confirmation**, et voir tes tickets dans **Mon compte → Mes tickets**.
6. Teste **mot de passe oublié** → tu dois recevoir l'email de réinitialisation.
7. Teste un **upload de photo de profil** → elle doit rester affichée après refresh
   (preuve que R2 marche).
8. Depuis l'admin : lance un **tirage** sur la compétition → un gagnant est choisi.

✅ Si tout ça marche, ton site est **fonctionnel en production**.

---

## ÉTAPE 12 — Avant d'ouvrir au public (à ne pas oublier)

- [ ] **Domaine perso** : dans Vercel → projet → Settings → Domains → ajoute
      `winucards.com` (web) et `admin.winucards.com` (admin). Suis les instructions DNS.
      Puis mets à jour `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_URL`, l'URL du
      webhook Stripe, le domaine Turnstile, et Redeploy.
- [ ] **Pages légales** (Terms, Privacy, Competition Rules…) : fais-les **relire par
      un juriste UK** (le contenu existe mais n'est pas validé). Obligatoire pour une
      plateforme de prize competition au Royaume-Uni.
- [ ] **Stripe Live activé** : ton compte Stripe doit être complètement validé pour
      recevoir l'argent.
- [ ] **Sauvegarde** : Neon fait des backups automatiques — vérifie que c'est activé.
- [ ] **Mots de passe** : garde précieusement `AUTH_SECRET`, le mot de passe admin,
      et toutes les clés (ne les mets jamais dans le code / GitHub).

---

## 📋 Antisèche — la check-list rapide

```
1.  Node 20 installé, npm install fait
2.  Neon  → DATABASE_URL (pooled + direct)
3.  Upstash → UPSTASH_REDIS_REST_URL + TOKEN
4.  Resend → RESEND_API_KEY + domaine vérifié + FROM_EMAIL
5.  Cloudflare R2 → R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET/BUCKET/PUBLIC_URL
6.  Cloudflare Turnstile → SITE_KEY + SECRET_KEY
7.  Stripe → SECRET_KEY + PUBLISHABLE_KEY (webhook plus tard)
8.  openssl rand -base64 32 → AUTH_SECRET
9.  Vercel projet WEB (Root = apps/web) + toutes les variables → Deploy
10. Vercel projet ADMIN (Root = apps/admin) + variables → Deploy
11. cd packages/database → db:migrate:deploy → db:bootstrap (avec URL directe)
12. Stripe webhook → /api/webhooks/stripe → coller STRIPE_WEBHOOK_SECRET → Redeploy
13. Smoke test complet
14. Domaine perso + relecture juridique → ouverture
```

---

## ❓ Problèmes fréquents

- **"UntrustedHost" sur l'admin** → vérifie `AUTH_TRUST_HOST=true` dans le projet admin.
- **Aucun email ne part** → `RESEND_API_KEY` correcte ? domaine **vérifié** ? `FROM_EMAIL`
  sur le domaine vérifié ? (En prod le site refuse de démarrer si la clé manque — c'est voulu.)
- **Erreur "AUTH_SECRET"** → tu as peut-être mis `NEXTAUTH_SECRET` (ancien nom v4).
  Le bon nom est **`AUTH_SECRET`**.
- **L'upload de photo plante en prod** → les 5 variables `R2_*` doivent être remplies.
- **Trop de connexions à la base** → utilise bien la chaîne **pooled** de Neon pour `DATABASE_URL` sur Vercel.
- **Le paiement marche mais aucun ticket créé** → le webhook Stripe n'est pas branché /
  `STRIPE_WEBHOOK_SECRET` faux → refais l'étape 10.
```
