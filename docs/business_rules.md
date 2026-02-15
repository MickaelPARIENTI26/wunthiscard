# WinUCard — Business Rules

> Version 1.0 — February 2026
> Plateforme de compétitions en ligne (prize competitions) pour cartes à collectionner et objets de collection.

---

## 1. Modèle Économique

### 1.1 Concept
WinUCard est une plateforme de **prize competitions** (et non une loterie) au sens du UK Gambling Act 2005. Les utilisateurs achètent des tickets pour participer à une compétition dont le prix est une carte à collectionner ou un objet de collection. Pour se conformer à la législation britannique, chaque achat de ticket inclut une **question de skill/knowledge** (QCM) que le participant doit répondre correctement. Une **free entry route** (voie d'entrée gratuite par courrier postal) doit également être proposée.

### 1.2 Catégories de Produits
- **Cartes Pokémon** (PSA graded, raw, booster boxes)
- **Cartes One Piece** (PSA graded, raw)
- **Cartes Sport** (NBA, NFL, Football/Soccer — Panini, Topps, etc.)
- **Objets de Collection** (maillots signés, sneakers signées, memorabilia sportif)
- **Autres Collectibles** (cartes Yu-Gi-Oh, Magic: The Gathering, etc.)

### 1.3 Devise & Localisation
- Devise unique : **GBP (£)** — Livre Sterling
- Société enregistrée en **Angleterre**
- Site 100% en **anglais**
- Paiement via **Stripe** (cartes bancaires, Apple Pay, Google Pay)

---

## 2. Compétitions (Lotteries)

### 2.1 Cycle de Vie d'une Compétition

| Statut | Description |
|--------|-------------|
| `DRAFT` | Créée dans le CMS admin, non visible côté user |
| `UPCOMING` | Visible sur le site, non achetable, compte à rebours jusqu'à l'ouverture |
| `ACTIVE` | En cours de vente, tickets achetables |
| `SOLD_OUT` | Tous les tickets vendus, en attente du tirage |
| `DRAWING` | Tirage en cours |
| `COMPLETED` | Gagnant désigné, résultat publié |
| `CANCELLED` | Annulée (remboursement automatique de tous les participants) |

### 2.2 Données d'une Compétition (champs CMS)

**Informations principales :**
- Titre (ex: "Charizard PSA 10 Base Set")
- Sous-titre / Description courte
- Description longue (rich text editor)
- Catégorie (Pokémon, One Piece, Sport, Memorabilia, Other)
- Sous-catégorie (libre)
- Valeur estimée du lot (£)
- Prix du ticket (£)
- Nombre total de tickets
- Date d'ouverture de la vente
- Date limite du tirage (le tirage a lieu à cette date OU quand tous les tickets sont vendus — le premier des deux)
- Statut

**Médias :**
- Image principale (obligatoire)
- Images secondaires (galerie, max 10)
- Vidéo (optionnel, URL YouTube/lien)

**Informations d'authentification du lot :**
- Numéro de certification (PSA, BGS, CGC si applicable)
- Grade (si applicable)
- Condition / Notes
- Provenance / Certificat d'authenticité

**Question de Skill (QCM) — OBLIGATOIRE (UK Law) :**
- Intitulé de la question
- 4 choix de réponse (A, B, C, D)
- Réponse correcte
- La question doit être suffisamment difficile pour "deterrer une proportion significative" de participants (UK Gambling Act requirement). Exemples : "In what year was the first Pokémon TCG base set released in Japan?" — pas "What color is Pikachu?"

**SEO :**
- Slug URL
- Meta title
- Meta description

### 2.3 Règles des Tickets

- **Prix minimum d'un ticket** : £1
- **Prix maximum d'un ticket** : pas de limite
- **Nombre maximum de tickets par compétition** : défini par l'admin (typiquement entre 100 et 10,000)
- **Nombre maximum de tickets par utilisateur par compétition** : 50
- **Numérotation des tickets** : de 1 à N (nombre total)
- **Sélection des tickets** : l'utilisateur PEUT choisir des numéros spécifiques (si disponibles) OU utiliser la sélection aléatoire

### 2.4 Offres sur les Tickets (Bonus Tickets)

| Tickets Achetés | Tickets Offerts |
|-----------------|-----------------|
| 10 | +1 gratuit |
| 15 | +2 gratuits |
| 20 | +3 gratuits |
| 50 | +5 gratuits |

- Les tickets offerts sont attribués aléatoirement parmi les numéros disponibles
- Le total (achetés + offerts) ne peut pas dépasser la limite de 50 tickets par user par compétition
- Ces paliers sont configurables par l'admin dans les settings globaux

### 2.5 Free Entry Route (UK Legal Requirement)

Conformément au UK Gambling Act 2005, une voie d'entrée gratuite DOIT être proposée :
- Envoi d'une lettre par courrier postal ordinaire (1st ou 2nd class) à l'adresse de la société
- La lettre doit contenir : nom complet, email, compétition souhaitée, numéro(s) de ticket souhaité(s), et la réponse à la question QCM
- Cette voie gratuite doit être mentionnée de manière visible sur chaque page de compétition et dans les CGV
- Les tickets gratuits ne doivent PAS être discriminés par rapport aux tickets payants dans le tirage
- L'admin doit pouvoir ajouter manuellement des tickets via le CMS pour les entrées postales

### 2.6 Processus d'Achat

1. L'utilisateur navigue vers une compétition active
2. Il sélectionne ses numéros de tickets (manuellement ou aléatoirement)
3. Il choisit la quantité (les bonus s'appliquent automatiquement)
4. **Étape intermédiaire obligatoire** : répondre à la question QCM
5. Si la réponse est correcte → passage au paiement
6. Si la réponse est incorrecte → message d'erreur, possibilité de réessayer (max 3 tentatives, puis blocage temporaire de 15 minutes)
7. Paiement via Stripe
8. Confirmation par email avec récapitulatif des numéros de tickets

### 2.7 Tirage au Sort

- Le tirage est effectué via un **Random Number Generator (RNG) certifié** sous supervision d'un **huissier de justice** (ou tiers indépendant à déterminer)
- Le tirage peut être diffusé en live (optionnel, via lien YouTube/Twitch)
- Le résultat est publié sur le site avec : numéro gagnant, pseudonyme du gagnant (anonymisé partiellement), date et heure du tirage
- Le gagnant est notifié par email
- Si le gagnant ne répond pas sous 14 jours, un nouveau tirage est effectué

### 2.8 Livraison du Lot

- Expédition assurée et trackée (Royal Mail Special Delivery ou DHL/FedEx pour les envois internationaux)
- Assurance à la valeur déclarée du lot
- Photos/vidéo d'emballage avant envoi
- Le gagnant doit confirmer la bonne réception

---

## 3. Utilisateurs

### 3.1 Inscription

- Email + Mot de passe OU connexion via Google (OAuth 2.0)
- Champs obligatoires : email, mot de passe (min 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial), prénom, nom
- Champs optionnels (requis avant le premier achat) : date de naissance, adresse de livraison, numéro de téléphone
- Vérification de l'email obligatoire avant tout achat
- **Âge minimum : 18 ans** (vérification par date de naissance — envisager une vérification d'identité pour les gros gains)

### 3.2 Profil Utilisateur

- Informations personnelles (modifiables)
- Adresse(s) de livraison
- Historique des achats de tickets
- Compétitions en cours (avec numéros de tickets)
- Gains (historique des compétitions gagnées)
- Mot de passe modifiable
- Possibilité de supprimer son compte (RGPD / UK GDPR)

### 3.3 Mots de Passe & Sécurité

- Reset de mot de passe par email (lien temporaire valable 1h)
- Verrouillage du compte après 5 tentatives de connexion échouées (déblocage par email)

---

## 4. Pages du Site

### 4.1 Page d'Accueil
- Hero banner avec la compétition phare
- Section "Live Competitions" (compétitions actives avec compte à rebours)
- Section "Upcoming Competitions" (prochaines, avec mention "Coming Soon")
- Section "Recent Winners" (derniers résultats avec image du lot et pseudonyme du gagnant)
- Section "How It Works" (résumé en 4 étapes)
- Appels à l'action (CTA) vers les compétitions

### 4.2 Page Liste des Compétitions
- Filtres par catégorie (Pokémon, Sport, etc.)
- Filtres par statut (Active, Upcoming, Completed)
- Tri par prix, date de fin, popularité
- Pagination ou infinite scroll

### 4.3 Page Détail d'une Compétition
- Galerie d'images
- Titre, description, valeur estimée
- Compte à rebours
- Barre de progression des tickets vendus (X / Total)
- Sélecteur de tickets (choix de numéros ou aléatoire)
- Affichage des bonus tickets
- Bouton "Get Your Tickets"
- Détails d'authentification du lot
- Informations sur le tirage
- Mention de la free entry route

### 4.4 Page How It Works
- Explication en 4 étapes illustrées
- Information sur la question de skill (QCM)
- Information sur le tirage (RNG certifié, supervision par huissier)
- Information sur la free entry route (courrier postal)
- FAQ rapide

### 4.5 Page FAQ
- Questions/réponses organisées par thème (accordéon)
- Thèmes : Compte, Tickets, Paiement, Tirage, Livraison, Légal

### 4.6 Page About Us
- Histoire de la société
- Mission et valeurs
- Équipe (optionnel)
- Engagement qualité et authenticité

### 4.7 Page Contact
- Formulaire de contact (nom, email, sujet, message)
- Email de contact
- Adresse postale de la société
- Liens vers les réseaux sociaux

### 4.8 Pages Légales
- Terms & Conditions (CGV)
- Privacy Policy (Politique de confidentialité — UK GDPR conforme)
- Cookie Policy
- Competition Rules (règlement des compétitions)
- Responsible Play Policy

### 4.9 Footer Global
- Liens vers toutes les pages (How It Works, FAQ, About, Contact, Legal)
- Liens vers les réseaux sociaux avec compteurs de followers (Instagram, Twitter/X, TikTok, Facebook, Discord)
- Logos des moyens de paiement (Stripe, Visa, Mastercard, Apple Pay, Google Pay)
- Badge "18+" (âge minimum)
- Copyright
- Mention de la free entry route

---

## 5. Administration (CMS)

### 5.1 Dashboard
- Nombre de compétitions actives
- Revenus du jour / semaine / mois
- Nombre de tickets vendus (jour / semaine / mois)
- Nombre d'utilisateurs inscrits
- Graphiques d'évolution

### 5.2 Gestion des Compétitions
- CRUD complet (Create, Read, Update, Delete)
- Duplication d'une compétition existante
- Gestion des statuts (workflow DRAFT → UPCOMING → ACTIVE → etc.)
- Ajout manuel de tickets (pour les entrées postales gratuites)
- Déclenchement du tirage
- Saisie du numéro gagnant

### 5.3 Gestion des Utilisateurs
- Liste avec recherche et filtres
- Voir le profil détaillé d'un user
- Désactiver / Bannir un utilisateur
- Voir l'historique d'achat d'un user
- Reset de mot de passe forcé

### 5.4 Gestion des Commandes
- Liste de toutes les commandes (tickets achetés)
- Filtres par compétition, user, date, statut de paiement
- Détail d'une commande : tickets, montant, statut Stripe, date

### 5.5 Gestion des Résultats
- Historique de tous les tirages
- Détail : compétition, numéro gagnant, user gagnant, date, preuve du tirage
- Statut de la livraison du lot

### 5.6 Paramètres (Settings)
- Informations de la société (nom, adresse, email de contact)
- Paliers de bonus tickets (configurables)
- Question QCM par défaut (modifiable par compétition)
- Configuration des emails transactionnels
- Gestion des pages statiques (About, FAQ, etc. — éditeur rich text)
- Configuration des réseaux sociaux (liens + compteurs)
- Configuration Stripe (clés API)
- Configuration du tirage (méthode, prestataire RNG)

### 5.7 Analytics
- Revenus détaillés par période
- Taux de conversion (visiteurs → inscriptions → achats)
- Compétitions les plus populaires
- Top acheteurs
- Géographie des utilisateurs

---

## 6. Emails Transactionnels

| Événement | Email |
|-----------|-------|
| Inscription | Bienvenue + vérification email |
| Achat de tickets | Confirmation avec récapitulatif des numéros |
| Tirage effectué | Notification à tous les participants avec le résultat |
| Gain | Félicitations au gagnant + instructions livraison |
| Nouvelle compétition | Newsletter aux inscrits (opt-in) |
| Reset mot de passe | Lien temporaire |
| Compte verrouillé | Instructions de déblocage |

---

## 7. Conformité Légale (UK)

### 7.1 Gambling Act 2005
- Le site opère en tant que **prize competition** (pas une loterie)
- La question QCM garantit le critère de **skill/knowledge**
- La **free entry route** par courrier est obligatoire et mentionnée clairement
- Aucune licence Gambling Commission n'est requise si ces conditions sont respectées
- **Recommandation forte** : obtenir un avis juridique formel avant le lancement

### 7.2 UK GDPR & Data Protection Act 2018
- Consentement explicite pour la collecte de données
- Droit d'accès, de rectification, de suppression des données
- Privacy Policy détaillée et accessible
- Cookie consent banner (opt-in)
- Data Protection Officer (DPO) à désigner si nécessaire

### 7.3 Consumer Rights Act 2015
- CGV claires et accessibles
- Politique de remboursement (les tickets ne sont PAS remboursables sauf annulation de la compétition)
- Informations de contact clairement affichées

### 7.4 Advertising Standards (ASA/CAP Codes)
- Toute publicité doit être honnête et non trompeuse
- Mention claire de l'âge minimum (18+)
- Mention de la probabilité de gain (nombre de tickets)
- Pas de ciblage de mineurs

### 7.5 Payment Services
- Conformité PCI DSS via Stripe (Stripe gère la conformité)
- Pas de stockage de données de carte bancaire sur nos serveurs
- Strong Customer Authentication (SCA) via Stripe

### 7.6 Voluntary Code of Practice (Nov 2025)
- Un nouveau code volontaire UK pour les opérateurs de prize competitions est en cours de développement (deadline d'implémentation : mai 2026)
- Prévoir de s'y conformer dès le lancement
