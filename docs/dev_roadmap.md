# WinThisCard — Development Roadmap

> Version 1.0 — February 2026

---

## Vue d'Ensemble

| Phase | Nom | Durée Estimée | Focus |
|-------|-----|---------------|-------|
| 0 | Setup & Foundation | 1 semaine | Monorepo, DB, Auth, CI/CD |
| 1 | Admin CMS — Core | 2 semaines | CRUD compétitions, gestion utilisateurs |
| 2 | Site Public — Core | 2 semaines | Pages, listing, détail compétition |
| 3 | Système de Tickets & Checkout | 2 semaines | Sélection, QCM, paiement Stripe |
| 4 | Tirage & Résultats | 1 semaine | Draw system, winners, notifications |
| 5 | Polish & Sécurité | 1 semaine | Security hardening, performance, SEO |
| 6 | Testing & Launch | 1 semaine | Tests, staging, mise en production |

**Total estimé : 10 semaines** (développeur solo, full-time)

---

## Phase 0 — Setup & Foundation (Semaine 1)

### Objectif
Avoir un monorepo fonctionnel avec auth, database, et les deux apps qui tournent en local.

### Tasks

#### 0.1 — Initialisation du Monorepo
- [ ] Créer le repo Git
- [ ] Setup Turborepo avec `apps/web`, `apps/admin`, `packages/database`, `packages/shared`
- [ ] Configurer TypeScript strict dans chaque package
- [ ] Configurer ESLint + Prettier (avec `eslint-plugin-security`)
- [ ] Configurer `.gitignore` (exclure `.env*`, `node_modules`, `.next`)
- [ ] Docker Compose pour PostgreSQL + Redis en local

#### 0.2 — Base de Données
- [ ] Écrire le schema Prisma complet (cf. `tech_architecture.md`)
- [ ] Première migration Prisma
- [ ] Script de seed avec des données de test (compétitions, users, tickets)
- [ ] Exporter le Prisma client depuis `packages/database`

#### 0.3 — Authentification (Site Public)
- [ ] Installer et configurer NextAuth v5
- [ ] Provider Credentials (email + password avec bcrypt)
- [ ] Provider Google OAuth
- [ ] Pages : `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- [ ] Middleware de protection des routes authentifiées
- [ ] Gestion des sessions JWT (HttpOnly, Secure, SameSite)
- [ ] Logique de verrouillage de compte (5 tentatives)

#### 0.4 — Authentification (Admin)
- [ ] Login admin séparé (`admin.winthiscard.com/login`)
- [ ] Vérification du rôle `ADMIN` ou `SUPER_ADMIN`
- [ ] Middleware admin qui bloque les non-admins
- [ ] Pas d'inscription publique pour l'admin (comptes créés manuellement en DB ou via seed)

#### 0.5 — Infrastructure de Base
- [ ] Setup Upstash Redis (rate limiting + ticket locks)
- [ ] Setup Resend pour les emails
- [ ] Template email de base (bienvenue, vérification, reset password)
- [ ] Setup Sentry pour error tracking
- [ ] Configurer les security headers dans `next.config.js`

#### Livrable Phase 0
> Les deux apps tournent en local. Un user peut s'inscrire, se connecter (email ou Google), vérifier son email. Un admin peut se connecter au panel admin. La DB est prête avec le schema complet.

---

## Phase 1 — Admin CMS Core (Semaines 2-3)

### Objectif
L'admin peut créer et gérer des compétitions via le CMS.

### Tasks

#### 1.1 — Layout Admin
- [ ] Sidebar navigation (Dashboard, Competitions, Users, Orders, Pages, Settings)
- [ ] Header avec nom admin + logout
- [ ] Layout responsive (mais optimisé desktop)
- [ ] Breadcrumbs

#### 1.2 — Dashboard
- [ ] Cards KPI : revenus jour/semaine/mois, tickets vendus, users inscrits, compétitions actives
- [ ] Graphique d'évolution des revenus (Recharts)
- [ ] Liste des 5 dernières commandes
- [ ] Liste des compétitions actives

#### 1.3 — CRUD Compétitions
- [ ] Page liste avec TanStack Table (tri, filtres par statut/catégorie, recherche, pagination)
- [ ] Formulaire de création complet :
  - Infos principales (titre, sous-titre, catégorie, prix ticket, nombre tickets, valeur lot)
  - Rich text editor pour la description longue (TipTap ou CKEditor)
  - Upload d'images (principale + galerie) vers Cloudflare R2
  - Vidéo URL (optionnel)
  - Infos d'authentification (certification, grade, condition)
  - Question QCM (question, 4 choix, réponse correcte)
  - Dates (ouverture vente, date tirage)
  - SEO (slug auto-généré, meta title, meta description)
- [ ] Formulaire d'édition (même formulaire, pré-rempli)
- [ ] Duplication d'une compétition existante
- [ ] Changement de statut : DRAFT -> UPCOMING -> ACTIVE (avec validations)
- [ ] Prévisualisation avant publication
- [ ] Suppression (uniquement si DRAFT)

#### 1.4 — Gestion des Utilisateurs
- [ ] Liste avec recherche par email/nom, filtres (actif/banni), pagination
- [ ] Vue détaillée d'un user : profil, historique d'achats, tickets, gains
- [ ] Actions : bannir/débannir, forcer reset password
- [ ] Ajout de notes admin sur un profil

#### 1.5 — Gestion des Pages Statiques (CMS)
- [ ] Éditeur de pages : About Us, How It Works (rich text)
- [ ] Gestion des FAQ : CRUD avec catégories et tri
- [ ] Preview avant sauvegarde

#### 1.6 — Settings
- [ ] Informations société (nom, adresse, email)
- [ ] Liens réseaux sociaux (Instagram, Twitter/X, TikTok, Facebook, Discord) + compteurs de followers
- [ ] Paliers de bonus tickets (configurables)
- [ ] Configuration Stripe (clés API — champ masqué)
- [ ] Email de notification par défaut

#### Livrable Phase 1
> L'admin peut créer des compétitions complètes avec images, QCM, et les publier. Il peut voir et gérer les utilisateurs. Les pages statiques sont éditables. Les settings sont configurés.

---

## Phase 2 — Site Public Core (Semaines 4-5)

### Objectif
Le site public affiche les compétitions et toutes les pages statiques. Mobile-first.

### Tasks

#### 2.1 — Layout & Design System
- [ ] Header responsive : logo, navigation, bouton login/compte
- [ ] Menu mobile (hamburger) avec navigation complète
- [ ] Footer complet :
  - Liens vers toutes les pages
  - Réseaux sociaux avec compteurs (fetch depuis settings)
  - Logos moyens de paiement (Stripe, Visa, MC, Apple Pay, Google Pay)
  - Badge 18+
  - Copyright
  - Mention free entry route
- [ ] Design system : typographie, couleurs, spacing, composants de base

#### 2.2 — Page d'Accueil
- [ ] Hero banner avec compétition phare (image plein écran, CTA)
- [ ] Section "Live Competitions" : cards avec image, titre, valeur, prix, countdown, barre progression
- [ ] Section "Coming Soon" (compétitions UPCOMING, non cliquables pour achat)
- [ ] Section "Recent Winners" : cards avec image lot, pseudonyme gagnant, date, valeur
- [ ] Section "How It Works" (résumé 4 étapes avec icônes)
- [ ] CTA vers la page compétitions

#### 2.3 — Page Liste des Compétitions
- [ ] Filtres par catégorie (tabs ou dropdown mobile)
- [ ] Filtres par statut (Active, Upcoming, Completed)
- [ ] Tri : date de fin, prix, popularité
- [ ] Cards compétition (même composant que la homepage)
- [ ] Pagination ou infinite scroll

#### 2.4 — Page Détail d'une Compétition
- [ ] Galerie d'images (swipe sur mobile, thumbnails sur desktop)
- [ ] Titre, sous-titre, description rich text
- [ ] Valeur estimée du lot, prix du ticket
- [ ] Compte à rebours animé
- [ ] Barre de progression des tickets : "X / Y tickets sold"
- [ ] Sélecteur de tickets (preview — fonctionnel en Phase 3)
- [ ] Infos d'authentification du lot (grade, certification)
- [ ] Section "Draw Information"
- [ ] Mention free entry route
- [ ] Bouton "Get Your Tickets" (redirige vers login si non connecté)
- [ ] Pour les compétitions COMPLETED : affichage du résultat

#### 2.5 — Pages Statiques
- [ ] How It Works : 4 étapes illustrées, info QCM, info tirage, info free entry
- [ ] FAQ : accordéon par catégorie (données depuis la DB via CMS)
- [ ] About Us : contenu rich text depuis CMS
- [ ] Contact : formulaire avec validation + captcha
- [ ] Winners : liste de tous les résultats passés

#### 2.6 — Pages Légales
- [ ] Terms & Conditions, Privacy Policy, Cookie Policy, Competition Rules
- [ ] Cookie consent banner
- [ ] Toutes éditables depuis le CMS admin

#### 2.7 — Profil Utilisateur
- [ ] Page profil : infos personnelles modifiables
- [ ] Adresses de livraison (CRUD)
- [ ] Changement de mot de passe
- [ ] Page "My Tickets" : liste des compétitions avec numéros
- [ ] Page "My Wins" : historique des gains avec statut livraison
- [ ] Suppression de compte

#### 2.8 — SEO & Performance
- [ ] Meta tags dynamiques, Open Graph, Twitter Cards
- [ ] Sitemap.xml dynamique, robots.txt
- [ ] Schema.org structured data
- [ ] Image optimization avec Next.js Image
- [ ] Lazy loading

#### Livrable Phase 2
> Le site public est navigable, responsive (mobile-first), avec toutes les pages. Les compétitions s'affichent. Le profil utilisateur est fonctionnel. Le SEO est configuré.

---

## Phase 3 — Système de Tickets & Checkout (Semaines 6-7)

### Objectif
Un utilisateur peut acheter des tickets, répondre au QCM, et payer via Stripe.

### Tasks

#### 3.1 — Sélecteur de Tickets (Fonctionnel)
- [ ] Grid de tickets interactive (vert=dispo, gris=vendu, bleu=sélectionné)
- [ ] Click pour sélectionner/désélectionner
- [ ] Champ de recherche par numéro
- [ ] Bouton "Pick for me" (aléatoire)
- [ ] Compteur de tickets sélectionnés avec total prix
- [ ] Calcul automatique des bonus : "Buy 10 get 1 free!"
- [ ] Limite 50 tickets/user/compétition
- [ ] Refresh temps réel des tickets disponibles (polling 10s)

#### 3.2 — Réservation de Tickets
- [ ] API `POST /api/tickets/reserve` : lock Redis TTL 5 min + statut RESERVED en DB
- [ ] Timer visible côté client : "Your tickets are reserved for 4:32"
- [ ] Libération automatique à expiration
- [ ] API `POST /api/tickets/release` : libération manuelle

#### 3.3 — Étape QCM (Question de Skill)
- [ ] Page/modal intermédiaire avec la question et 4 choix
- [ ] Validation côté serveur
- [ ] Si correct -> paiement. Si incorrect -> réessai (max 3, puis blocage 15 min via Redis)
- [ ] Logger chaque tentative dans l'audit log

#### 3.4 — Intégration Stripe Checkout
- [ ] API `POST /api/checkout/create-session` : Stripe Checkout Session en GBP
- [ ] Création de l'Order en DB avec status PENDING
- [ ] Redirection vers Stripe
- [ ] Page succès : confirmation + récapitulatif numéros
- [ ] Page annulation : libération des tickets

#### 3.5 — Webhook Stripe
- [ ] Vérification signature Stripe
- [ ] `checkout.session.completed` : Order SUCCEEDED, tickets SOLD, attribution bonus, email confirmation
- [ ] `checkout.session.expired` : libération tickets, Order CANCELLED
- [ ] Traitement idempotent

#### 3.6 — Emails Transactionnels
- [ ] Template "Ticket Purchase Confirmation" (numéros, montant, date tirage)
- [ ] Template "Welcome", "Email Verification", "Password Reset"

#### 3.7 — Admin : Gestion des Commandes
- [ ] Page liste des commandes avec filtres
- [ ] Détail commande
- [ ] Ajout manuel de tickets (free entry route)

#### Livrable Phase 3
> Le flux d'achat complet fonctionne : sélection -> QCM -> paiement Stripe -> confirmation email. Les bonus sont attribués. Les réservations expirent. L'admin gère les commandes.

---

## Phase 4 — Tirage & Résultats (Semaine 8)

### Tasks

#### 4.1 — Système de Tirage
- [ ] Page admin "Draw" avec stats et bouton "Execute Draw" (SUPER_ADMIN only)
- [ ] RNG cryptographique (`crypto.getRandomValues()`) ou service externe (Random.org)
- [ ] Confirmation avant enregistrement
- [ ] Audit log complet

#### 4.2 — Notifications
- [ ] Email gagnant : "Congratulations!" + instructions (délai 14 jours)
- [ ] Email participants : résultat + CTA prochaines compétitions

#### 4.3 — Page Résultats Publique
- [ ] Numéro gagnant, pseudonyme anonymisé, date, preuve du tirage
- [ ] Page "Winners" complète

#### 4.4 — Gestion Livraison (Admin)
- [ ] Workflow : Claimed -> Shipped (tracking) -> Delivered
- [ ] Re-tirage si pas de réponse après 14 jours

#### 4.5 — Compétitions Annulées
- [ ] Remboursement automatique via Stripe Refunds
- [ ] Notification participants

#### Livrable Phase 4
> Cycle complet : création -> vente -> tirage -> résultat -> livraison. Annulations avec remboursement.

---

## Phase 5 — Polish & Sécurité (Semaine 9)

### Tasks

#### 5.1 — Security Hardening
- [ ] Tous les security headers (cf. `security_rules.md`)
- [ ] CSP strict
- [ ] Rate limiting complet
- [ ] Captcha (Cloudflare Turnstile) sur formulaires sensibles
- [ ] Tests de sécurité (CSRF, XSS, SQL injection, brute force)
- [ ] Cloudflare WAF

#### 5.2 — Performance
- [ ] Audit Lighthouse mobile (cible > 90)
- [ ] Optimisation images, cache Redis, SSR/SSG
- [ ] Code splitting vérifié

#### 5.3 — UI/UX Polish
- [ ] Animations (Framer Motion), loading states, skeletons
- [ ] Error states, empty states, toast notifications
- [ ] Test responsive : iPhone SE, iPhone 14, iPad, Desktop
- [ ] Accessibilité : clavier, aria, contraste

#### 5.4 — Admin Polish
- [ ] Analytics détaillées (Recharts)
- [ ] Export CSV
- [ ] Recherche globale

#### Livrable Phase 5
> Site sécurisé, performant et poli. UI fluide et responsive.

---

## Phase 6 — Testing & Launch (Semaine 10)

### Tasks

#### 6.1 — Tests
- [ ] Tests unitaires : validators Zod, business logic
- [ ] Tests d'intégration : flux d'achat, auth, Stripe webhook
- [ ] Test E2E optionnel (Playwright)
- [ ] Test de charge basique (100 users simultanés)
- [ ] Test de sécurité (OWASP ZAP)
- [ ] Test mobile sur vrais devices

#### 6.2 — Staging
- [ ] Déployer sur Vercel (preview branch)
- [ ] Neon staging branch + Stripe test mode
- [ ] Beta testing

#### 6.3 — Préparation Production
- [ ] Domaines `winthiscard.com` + `admin.winthiscard.com`
- [ ] DNS Cloudflare + SSL
- [ ] Env vars production (Stripe live keys)
- [ ] Vérification pages légales avec juriste UK
- [ ] Réseaux sociaux prêts

#### 6.4 — Launch
- [ ] Déployer en production
- [ ] Tester un achat réel
- [ ] Vérifier emails et webhooks en production
- [ ] Activer monitoring (Sentry, BetterUptime)
- [ ] Créer la première compétition
- [ ] Annoncer sur les réseaux sociaux
- [ ] Surveiller logs et métriques 48h

#### Livrable Phase 6
> Site en production, fonctionnel, sécurisé, première compétition live.

---

## Post-Launch — Améliorations Futures

### V1.1 — Quick Wins
- Notifications push (web push)
- Programme de parrainage (referral code)
- Wishlist / Rappel pour compétitions UPCOMING
- Partage social (share buttons)

### V1.2 — Engagement
- Live draw streaming intégré
- Chat en direct pendant les draws
- Badges et achievements
- Leaderboard acheteurs

### V1.3 — Business
- Programme de fidélité (points -> tickets gratuits)
- Cartes cadeau / Gift tickets
- Multi-devises (EUR, USD)
- App mobile native (React Native)
- Blog intégré

### V1.4 — Tech
- WebSocket pour le real-time
- Service worker offline
- A/B testing
- Analytics avancées (Mixpanel)
- CDN images avec transformation on-the-fly

---

## Commandes Utiles pour Claude Code

```bash
# Setup initial
npx create-turbo@latest winthiscard
cd winthiscard

# Créer les apps Next.js
npx create-next-app@latest apps/web --typescript --tailwind --app --src-dir=false
npx create-next-app@latest apps/admin --typescript --tailwind --app --src-dir=false

# Installer les dépendances principales (web)
cd apps/web
npm install next-auth@beta @prisma/client stripe @stripe/stripe-js
npm install @upstash/redis @upstash/ratelimit resend
npm install zod react-hook-form @hookform/resolvers
npm install framer-motion
npm install -D prisma @types/node @types/react

# Installer shadcn/ui
npx shadcn@latest init

# Installer les dépendances admin
cd ../admin
npm install recharts @tanstack/react-table @tiptap/react @tiptap/starter-kit
npx shadcn@latest init

# Package database
cd ../../packages/database
npm init -y
npm install prisma @prisma/client
npx prisma init

# Docker pour dev local
docker compose up -d  # PostgreSQL + Redis

# Migrations
npx prisma migrate dev --name init
npx prisma db seed

# Lancer en dev
turbo dev  # Lance les deux apps en parallèle
```

---

## Notes pour Claude Code

1. **Lire les 4 documents** avant de commencer : `business_rules.md`, `tech_architecture.md`, `security_rules.md`, et ce fichier `dev_roadmap.md`
2. **Suivre l'ordre des phases** — chaque phase dépend de la précédente
3. **Mobile-first** : toujours développer pour mobile d'abord, puis adapter pour desktop
4. **TypeScript strict** : pas de `any`, pas de `// @ts-ignore`
5. **Validation Zod** : sur TOUTE entrée, côté client ET serveur
6. **Audit log** : logger toute action sensible dès le début
7. **Tests** : écrire au minimum les tests unitaires pour la business logic
8. **Commits atomiques** : un commit par feature/fix, messages clairs
9. **Security first** : implémenter les protections dès le début, pas à la fin
