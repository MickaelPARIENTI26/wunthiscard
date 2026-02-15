# WinUCard — Security Rules

> Version 1.0 — February 2026
> Document de référence pour toutes les mesures de sécurité à implémenter.

---

## 1. Principes Fondamentaux

Ce projet implique des **paiements en ligne** et des **gains de valeur significative**. La sécurité n'est pas une option, c'est la priorité #1. Toute faille peut entraîner des pertes financières, une atteinte à la réputation, et des poursuites légales.

**Approche : Defense in Depth** — plusieurs couches de sécurité indépendantes, de sorte que la compromission d'une couche ne suffit pas à compromettre le système.

---

## 2. Authentification & Gestion des Sessions

### 2.1 Mots de Passe

- **Hashing** : bcrypt avec un cost factor de 12 (via NextAuth)
- **Politique de complexité** :
  - Minimum 8 caractères
  - Au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
  - Vérification contre les mots de passe compromis (Have I Been Pwned API — optionnel mais recommandé)
- **Stockage** : JAMAIS en clair, JAMAIS en MD5/SHA1. Uniquement bcrypt/argon2
- **Reset** : Token unique, signé, expirant après 1 heure, usage unique

### 2.2 Sessions & JWT

- Sessions gérées par **NextAuth v5** avec stratégie **JWT**
- Token JWT signé avec `NEXTAUTH_SECRET` (min 32 caractères, généré aléatoirement)
- Expiration des sessions : 24h (configurable)
- Refresh token : rotation automatique
- Cookies :
  - `HttpOnly` : ✅ (pas accessible par JavaScript)
  - `Secure` : ✅ (HTTPS uniquement)
  - `SameSite` : `Lax` (protection CSRF de base)
  - `Domain` : restreint au domaine principal

### 2.3 OAuth (Google)

- Utiliser le flow **Authorization Code** (pas Implicit)
- Valider le `id_token` côté serveur
- Vérifier l'email (`email_verified: true`)
- Ne jamais stocker les tokens OAuth en base (NextAuth gère ça)

### 2.4 Brute Force Protection

- **Rate limiting sur le login** : max 5 tentatives par email par 15 minutes
- **Verrouillage de compte** : après 5 tentatives échouées, compte verrouillé pour 30 minutes
- **Déblocage** : automatique après le délai OU via lien email
- **Rate limiting global** : implémenté via **Upstash Redis** avec `@upstash/ratelimit`
- **Captcha** : intégrer hCaptcha ou Turnstile (Cloudflare) sur les formulaires sensibles (login, register, contact, checkout)

---

## 3. Sécurité des Paiements

### 3.1 Stripe — Architecture Sécurisée

- **Stripe Checkout Sessions** : le paiement se fait ENTIÈREMENT sur la page Stripe, pas sur notre site
- **Aucune donnée de carte** ne transite par nos serveurs
- **PCI DSS** : conformité gérée par Stripe (nous sommes SAQ-A)
- **Stripe Webhooks** :
  - Vérifier CHAQUE webhook avec `stripe.webhooks.constructEvent()` et le `STRIPE_WEBHOOK_SECRET`
  - Traiter les événements de manière **idempotente** (même événement reçu 2 fois = même résultat)
  - Ne confirmer les tickets qu'après réception du webhook `checkout.session.completed`
  - Logger TOUS les événements webhook dans l'audit log

### 3.2 Strong Customer Authentication (SCA)

- Stripe gère la SCA (3D Secure) automatiquement pour les transactions UK/EU
- S'assurer que le Payment Intent utilise `payment_method_types: ['card']` avec SCA activé

### 3.3 Protection Anti-Fraude

- Activer **Stripe Radar** (détection de fraude intégrée)
- Vérifier la cohérence : email Stripe ↔ email du compte
- Limiter le montant maximum par transaction
- Limiter le nombre de transactions par utilisateur par jour (ex: max 5 achats/jour)
- Surveiller les patterns suspects : achats multiples rapides, IP changeantes, etc.
- Bloquer les achats depuis des pays sanctionnés

### 3.4 Remboursements

- Seuls les admins peuvent initier un remboursement
- Remboursement automatique uniquement en cas d'annulation de compétition
- Tout remboursement est loggé dans l'audit log
- Les tickets remboursés redeviennent disponibles

---

## 4. Sécurité des Données

### 4.1 Données en Transit

- **HTTPS obligatoire** partout (TLS 1.3 minimum)
- **HSTS** activé avec `max-age=31536000; includeSubDomains; preload`
- Redirection automatique HTTP → HTTPS
- Certificats SSL gérés par Cloudflare/Vercel

### 4.2 Données au Repos

- **Chiffrement de la base de données** : Neon/Supabase offrent le chiffrement at-rest par défaut
- **Données sensibles** : les mots de passe sont hashés, les tokens sont signés
- **Variables d'environnement** : JAMAIS dans le code, JAMAIS dans Git. Utiliser `.env.local` + Vercel Environment Variables
- **Backups** : automatiques quotidiens (Neon), rétention 7 jours minimum

### 4.3 Données Personnelles (UK GDPR)

- **Minimisation** : ne collecter que les données strictement nécessaires
- **Consentement** : opt-in explicite pour les newsletters, cookie consent
- **Droit d'accès** : l'utilisateur peut exporter ses données depuis son profil
- **Droit à l'effacement** : suppression du compte = anonymisation des données (on conserve les données de transaction pour des raisons comptables, mais on supprime les données personnelles)
- **Data breach notification** : en cas de fuite, notification à l'ICO sous 72h et aux utilisateurs affectés
- **Cookie Policy** : détailler tous les cookies utilisés, catégorisés (essential, analytics, marketing)

---

## 5. Protection de l'Application

### 5.1 Input Validation

- **TOUTE entrée utilisateur est hostile** jusqu'à preuve du contraire
- Validation côté client (UX) ET côté serveur (sécurité) avec **Zod**
- Schémas Zod partagés entre client et serveur via le package `shared`
- Validation stricte : types, longueurs, formats, ranges
- Sanitization des inputs HTML (DOMPurify) pour les champs rich text admin

```typescript
// Exemple : validation d'achat de ticket
const purchaseSchema = z.object({
  competitionId: z.string().cuid(),
  ticketNumbers: z.array(z.number().int().positive()).min(1).max(50),
  questionAnswer: z.number().int().min(0).max(3),
});
```

### 5.2 SQL Injection

- **Prisma ORM** utilise des requêtes paramétrées par défaut → protection native
- JAMAIS de SQL brut avec des inputs utilisateur non échappés
- Si raw query nécessaire, utiliser `Prisma.$queryRaw` avec des template literals (paramétré automatiquement)

### 5.3 XSS (Cross-Site Scripting)

- **React** échappe les outputs par défaut (pas de XSS via JSX)
- JAMAIS utiliser `dangerouslySetInnerHTML` avec du contenu utilisateur non sanitisé
- Pour le contenu rich text admin : sanitiser avec DOMPurify avant stockage ET avant affichage
- CSP (Content Security Policy) header strict :

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.cloudflare.com https://*.stripe.com;
  frame-src https://js.stripe.com https://hooks.stripe.com;
  connect-src 'self' https://api.stripe.com https://*.upstash.io;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
```

### 5.4 CSRF (Cross-Site Request Forgery)

- NextAuth gère les tokens CSRF automatiquement
- Cookies `SameSite: Lax` par défaut
- Pour les API mutations : vérifier le header `Origin` ou `Referer`
- Webhook Stripe : vérifié par signature, pas par cookie

### 5.5 Rate Limiting

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `POST /api/auth/signin` | 5 requests | 15 min |
| `POST /api/auth/signup` | 3 requests | 1 hour |
| `POST /api/auth/forgot-password` | 3 requests | 1 hour |
| `POST /api/tickets/reserve` | 10 requests | 1 min |
| `POST /api/checkout/*` | 5 requests | 5 min |
| `POST /api/contact` | 3 requests | 1 hour |
| API globale (authentifié) | 100 requests | 1 min |
| API globale (non authentifié) | 30 requests | 1 min |

Implémentation via **Upstash Ratelimit** avec sliding window algorithm.

### 5.6 Security Headers

Configurer dans `next.config.js` ou via middleware :

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  (deprecated, CSP is better)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: (voir section 5.3)
```

---

## 6. Sécurité de l'Infrastructure

### 6.1 Environnement Variables

- Utiliser des secrets différents pour chaque environnement (dev, staging, prod)
- Rotation régulière des secrets (tous les 90 jours)
- `NEXTAUTH_SECRET` : minimum 32 caractères, généré avec `openssl rand -base64 32`
- Ne JAMAIS commiter `.env` dans Git (`.gitignore` strict)
- Utiliser les **Vercel Environment Variables** avec encryption at-rest

### 6.2 Cloudflare Protection

- **WAF (Web Application Firewall)** : règles OWASP activées
- **DDoS Protection** : couche 3/4/7 automatique
- **Bot Management** : challenge les bots suspects
- **Rate Limiting** : couche supplémentaire au niveau CDN
- **IP Blocking** : possibilité de bloquer des ranges IP suspects

### 6.3 Database Security

- Accès à PostgreSQL uniquement via les API (pas d'accès direct public)
- Credentials database dans les env vars, jamais hardcodés
- Connexions via SSL obligatoire
- IP allowlisting si possible (Neon le supporte)
- Utilisateur DB avec les permissions minimales nécessaires (pas de SUPERUSER)

### 6.4 Redis Security

- Connexion via TLS
- Token d'authentification requis
- TTL sur toutes les clés (pas de data qui reste indéfiniment)

---

## 7. Sécurité du Tirage au Sort

Le tirage est l'élément le plus critique en termes de confiance. Toute suspicion de manipulation = mort du business.

### 7.1 Random Number Generation (RNG)

- Utiliser un **RNG cryptographiquement sécurisé** :
  - Option 1 : Service tiers certifié (ex: Random.org, RandomDraws.com — comme WinUWatch)
  - Option 2 : `crypto.getRandomValues()` côté serveur avec audit indépendant
- **JAMAIS** utiliser `Math.random()` pour le tirage
- Le seed et le résultat doivent être enregistrés et vérifiables

### 7.2 Intégrité du Tirage

- Le tirage ne peut être déclenché que par un SUPER_ADMIN
- Chaque tirage est loggé dans l'audit log avec : timestamp, compétition ID, nombre de tickets vendus, numéro gagnant, méthode RNG utilisée, IP de l'admin
- Preuve du tirage : vidéo en direct ou capture d'écran du résultat certifié
- **Aucun employé/admin ne peut participer aux compétitions**
- Le numéro gagnant est immutable une fois enregistré

### 7.3 Supervision Externe

- Tirage sous supervision d'un **huissier de justice** (ou notary public UK) pour les compétitions de haute valeur (> £1,000)
- Pour les petites compétitions : tirage via service RNG certifié avec preuve vérifiable
- Possibilité de live stream du tirage (YouTube/Twitch)

---

## 8. Sécurité du Code

### 8.1 Bonnes Pratiques

- **TypeScript strict** : `strict: true` dans tsconfig
- **ESLint** avec règles de sécurité : `eslint-plugin-security`
- **Dependency audit** : `npm audit` en CI, Dependabot/Renovate pour les mises à jour
- **Code review** obligatoire avant merge
- **Pas de secrets dans le code** : utiliser les env vars
- **Least privilege** : chaque composant/service n'a accès qu'à ce dont il a besoin

### 8.2 CI/CD Security

- **GitHub Actions** avec environment secrets
- Tests automatiques incluant des tests de sécurité
- Build en mode strict (pas de `// @ts-ignore`)
- Scan des dépendances avec `npm audit` et Snyk (optionnel)
- Preview deployments sur Vercel pour review avant production

### 8.3 Error Handling

- JAMAIS exposer les stack traces en production
- Erreurs génériques côté client ("An error occurred"), erreurs détaillées uniquement dans les logs serveur
- **Sentry** pour le suivi des erreurs avec alertes
- Ne pas logger les données sensibles (mots de passe, tokens, numéros de carte)

---

## 9. Monitoring & Audit

### 9.1 Audit Log

Chaque action sensible est enregistrée dans la table `AuditLog` :

| Action | Détails Loggés |
|--------|---------------|
| `USER_REGISTERED` | email, méthode (credentials/google), IP |
| `USER_LOGIN` | email, succès/échec, IP |
| `USER_LOGIN_FAILED` | email, tentative #, IP |
| `USER_LOCKED` | email, raison |
| `TICKET_RESERVED` | competitionId, ticketNumbers, userId |
| `TICKET_PURCHASED` | orderId, amount, ticketNumbers |
| `PAYMENT_SUCCEEDED` | orderId, stripePaymentIntentId, amount |
| `PAYMENT_FAILED` | orderId, reason |
| `DRAW_EXECUTED` | competitionId, winningNumber, method, adminId |
| `COMPETITION_CREATED` | competitionId, adminId |
| `COMPETITION_STATUS_CHANGED` | competitionId, oldStatus, newStatus, adminId |
| `USER_BANNED` | userId, reason, adminId |
| `REFUND_ISSUED` | orderId, amount, reason, adminId |
| `SETTINGS_CHANGED` | field, oldValue, newValue, adminId |

### 9.2 Monitoring

- **Sentry** : error tracking avec alertes Slack/email
- **Vercel Analytics** : performance, Core Web Vitals
- **Uptime monitoring** : BetterUptime ou UptimeRobot (alerte si le site est down)
- **Stripe Dashboard** : suivi des paiements, fraudes, disputes
- **Alertes** : notification immédiate pour :
  - Erreurs 5xx en série
  - Tentatives de brute force détectées
  - Webhook Stripe échoué
  - Paiement frauduleux détecté par Radar

---

## 10. Plan de Réponse aux Incidents

### 10.1 En Cas de Fuite de Données

1. Identifier la source et l'étendue de la fuite
2. Couper l'accès compromis immédiatement
3. Notifier l'ICO (Information Commissioner's Office) sous 72h
4. Notifier les utilisateurs affectés
5. Documenter l'incident
6. Corriger la faille
7. Post-mortem et mise à jour des procédures

### 10.2 En Cas de Compromission de Clés

1. Révoquer immédiatement les clés compromises
2. Générer de nouvelles clés
3. Déployer en urgence
4. Auditer les logs pour déterminer si les clés ont été utilisées
5. Si clés Stripe compromises : contacter Stripe immédiatement

### 10.3 En Cas de Dispute sur un Tirage

1. Fournir la preuve du tirage (vidéo, certificat RNG)
2. Fournir les logs d'audit
3. Si nécessaire, faire appel à l'huissier/notary pour certification
4. Communiquer de manière transparente avec les participants

---

## 11. Checklist Pré-Lancement

- [ ] HTTPS actif avec HSTS
- [ ] Tous les security headers configurés
- [ ] Rate limiting actif sur tous les endpoints sensibles
- [ ] Stripe en mode production avec webhook secret configuré
- [ ] Audit log fonctionnel et testé
- [ ] Backup database automatique vérifié
- [ ] Captcha actif sur les formulaires sensibles
- [ ] CSP header configuré et testé
- [ ] Variables d'environnement en production (pas de valeurs de dev)
- [ ] `npm audit` sans vulnérabilités critiques
- [ ] Tests de sécurité basiques effectués (OWASP ZAP ou similaire)
- [ ] Sentry configuré avec alertes
- [ ] Monitoring uptime actif
- [ ] CGV, Privacy Policy, Cookie Policy en ligne
- [ ] Free entry route clairement mentionnée
- [ ] Question QCM suffisamment difficile (validation juridique)
- [ ] Process de tirage testé end-to-end
- [ ] Conformité UK GDPR vérifiée
