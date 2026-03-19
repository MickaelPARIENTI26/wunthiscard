# WinUCard — Todo

## En cours
- [ ] Feat: Système de parrainage (Referral system)

### Plan d'implémentation

#### Étape 1: Schema Prisma + Migration
- [ ] Ajouter champs referral au User: referralCode, referredById, referralTicketCount, referralTotalTickets, referralFreeTicketsEarned, referralFreeTicketsAvailable
- [ ] Relation User → User (referredBy)
- [ ] Migration SQL

#### Étape 2: Shared (validators, types, constants)
- [ ] Constantes: REFERRAL_TICKETS_REQUIRED = 10, MAX_REFERRALS_PER_USER = 100
- [ ] Types: REFERRAL_BONUS_EARNED audit action
- [ ] Validators: referralCode format

#### Étape 3: Backend — Referral code generation + ref cookie
- [ ] Générer referralCode auto à l'inscription (8 chars alphanumériques)
- [ ] Middleware/layout: lire ?ref=CODE, stocker en cookie 30j
- [ ] Modifier registerUser(): lier le filleul au parrain

#### Étape 4: Backend — Comptabilisation achats filleuls
- [ ] Dans le webhook Stripe (checkout.session.completed): incrémenter le compteur parrain
- [ ] Logique palier: tous les 10 tickets → +1 free ticket
- [ ] Email au parrain quand il gagne un ticket gratuit

#### Étape 5: Frontend — Utilisation tickets gratuits
- [ ] Bannière "🎁 You have X free ticket(s)" sur page compétition
- [ ] Checkbox "Use 1 free ticket" dans le sélecteur
- [ ] Adapter checkout pour déduire 1 ticket du total payant
- [ ] Décrémenter referralFreeTicketsAvailable

#### Étape 6: Frontend — Page "Mon Parrainage"
- [ ] Nouvelle page /referrals dans (account)
- [ ] Lien + bouton copier + partage (WhatsApp, X, email)
- [ ] Stats: filleuls, tickets achetés, progress bar, tickets gratuits
- [ ] Ajouter nav item dans account layout

#### Étape 7: Admin — Stats parrainage
- [ ] Section stats: top parrains, tickets distribués
- [ ] Setting: referralTicketsRequired (ratio configurable)

#### Étape 8: Vérification
- [ ] Build + lint pass
- [ ] Tests unitaires

## À faire


## Terminé
- [x] Feat: Compétitions gratuites (FREE competitions) — 2026-03-19
