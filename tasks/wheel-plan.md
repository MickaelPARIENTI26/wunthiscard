# Plan — Roue de récompense après achat

État : **plan uniquement, rien n'est codé.** Rédigé le 2026-08-17 après analyse de
l'existant.

---

## 0. Décisions prises (2026-08-17)

| # | Décision |
|---|---|
| 1 | **Un spin par ticket payant.** Les tickets bonus (paliers) et le ticket gratuit de parrainage ne donnent pas de spin. |
| 2 | **Spins conservés, valables jusqu'à la date de tirage du concours.** Passé le tirage, ils ne fonctionnent plus. |
| 3 | **Aucun spin pour les entrées gratuites.** Concours payants uniquement. |
| 4 | **Système de codes promo complet**, visibles dans le profil utilisateur. |
| 5 | **Cumul autorisé** entre code promo, paliers bonus et ticket de parrainage. Seule limite : **un seul code promo par commande**. |
| 6 | **Jackpot non distribué → remis en jeu sur le concours suivant.** |

Ces choix ont des conséquences qui contredisent certains points du document
d’origine — elles sont documentées en §2bis.

## 1. 🔴 Exposition légale — décision prise, à faire valider

Rappel du cadre : tout le modèle WinUPrize repose sur **ne pas être une loterie**
(`docs/business_rules.md:11`, Terms §4, Competition Rules §2, FAQ). Deux piliers
le garantissent : la **question de skill** et la **voie d'entrée gratuite**.

La décision n°3 (spin réservé aux achats payants) fait que la roue réunit les
trois éléments de la définition d'une loterie au sens du Gambling Act 2005 :

- **paiement** — le spin s'obtient uniquement en achetant,
- **hasard** — le résultat est purement aléatoire, sans skill,
- **lot** — une carte gradée d'environ £200.

Il existe un argument de défense : le spin découle d'une entrée qui a déjà passé
le QCM, et il est présenté comme un bonus promotionnel sur un achat, non comme un
jeu vendu séparément. Cet argument n'est pas absurde, mais il n'est pas
équivalent à la protection dont bénéficient les concours principaux.

**Position du propriétaire (2026-08-17) :** il s'agit d'un *giveaway acheteur*,
pratique courante et licite, y compris en France.

**Décision enregistrée, le sujet est clos côté technique.** Seule précision
factuelle à garder au dossier : le droit applicable ici est le **UK Gambling Act
2005**, le régime français des jeux-concours n'est pas transposable. C'est à
l'avocat qui relit les Terms de valider avant mise en ligne. Repli si besoin :
accorder aussi un spin aux entrées postales — la route existe, coût technique
faible.

## 2. Système de codes promo — conception

Décision n°4 : on construit le système complet. Il n'existe **rien** aujourd'hui
(aucun modèle Prisma, et `create-session/route.ts:336` fabrique un `line_items`
avec un `unit_amount` en dur, sans paramètre `discounts`).

### 2.1 🔴 Le piège Stripe — à connaître avant d'écrire une ligne

`fulfill-checkout.ts:106` refuse de livrer les tickets si le montant encaissé par
Stripe ne correspond pas **exactement** au total enregistré sur la commande :

```ts
const expectedPence = Math.round(order.totalAmount * 100);
if (!isChargedAmountValid(session, expectedPence)) { /* refus */ }
```

Conséquence : si la remise est appliquée via un **coupon Stripe**, `amount_total`
sera inférieur à `order.totalAmount` écrit avant remise → **le garde-fou rejette
la commande. Le client paie et ne reçoit rien.**

C'est la façon la plus naturelle d'implémenter une remise, et c'est un piège
silencieux qui ne se voit qu'en production, sur de vrais paiements.

**Règle à tenir : ne jamais utiliser les coupons Stripe ici.**
La remise se calcule côté serveur, s'écrit dans `order.totalAmount`, et se
répercute sur le `unit_amount` envoyé à Stripe. Les deux montants restent alors
égaux, et tout ce qui dépend du total reste juste : remboursements, exports
admin, revenu GA4.

### 2.2 Modèle

```
PromoCode
  id, code            (court, lisible, unique)
  userId              propriétaire — non transférable
  spinId              unique : un spin = au plus un code
  competitionId       traçabilité (issu de quel concours)
  type                PERCENT_OFF
  value               5 | 10
  issuedAt, expiresAt
  redeemedAt, redeemedOrderId
```

Statut dérivé, jamais stocké : `ACTIVE` / `USED` / `EXPIRED`.

### 2.3 Non-cumul

Un seul code par commande, refusé côté serveur. Le champ de saisie n'accepte
qu'une valeur, et la validation vérifie propriétaire + non expiré + non consommé.

**Tranché : le cumul est autorisé avec tout l'existant.**

| Mécanique | Cumul |
|---|---|
| Tickets bonus par palier (`calculateBonusTickets`) | ✅ |
| Ticket gratuit de parrainage (`create-session:250`) | ✅ |
| Un second code promo | ❌ — un seul par commande |

La seule règle à faire respecter côté serveur est donc « un code maximum », pas
un arbitrage entre mécaniques.

### 2.4 Réservation et libération

Le code doit être **consommé atomiquement à la création de la session Stripe**,
pas à la confirmation — sinon deux onglets ouverts consomment le même code.

Ce patron existe déjà pour le ticket de parrainage : décrément atomique dans
`create-session`, puis re-crédit si Stripe échoue (audit
`REFERRAL_FREE_TICKET_RESTORED`). À répliquer tel quel, avec un
`PROMO_CODE_RESTORED`.

À gérer aussi : session expirée (webhook `checkout.session.expired`) et
remboursement (`voidOrderAndReleaseTickets`) → le code redevient-il utilisable ?
**Recommandation : oui sur expiration, non sur remboursement** (sinon on rembourse
la commande *et* on rend l'avantage).

### 2.5 Côté utilisateur

Nouvelle section dans le profil (`apps/web/src/app/(account)/`), à côté de
« My Tickets » et « My Wins » :

**My Rewards**
- spins disponibles, par concours, avec date d'expiration
- codes promo : valeur, code copiable, expiration, statut
- historique des spins passés

Le compteur de codes actifs est affiché dans le menu compte, comme les autres
sections.

---

## 2bis. Conséquences des décisions — 3 points à trancher

### a) Les spins capitalisés — durée de validité à fixer

Les spins sont conservés : le dashboard demandé redevient valable tel quel
(« spins restant chez les utilisateurs » a de nouveau un sens).

**Tranché : valables jusqu'à la date de tirage du concours.** Passé le tirage, un
spin non lancé est mort. À prévoir :

- un compteur dans le profil avec l'échéance (« 3 spins · expirent le 1 sept »),
- une **relance email 48 h avant** s'il reste des spins — le cron `closing-soon`
  existe déjà, c'est du réemploi.

La relance n'est pas un confort : sans elle, le taux de spins perdus sera élevé
et le §b ci-dessous se produira souvent.

### b) Le jackpot peut rester non distribué

Même avec des spins conservés, si personne ne lance ses derniers spins, la carte
gradée peut ne jamais sortir du pool.

**Tranché : le lot non gagné est remis en jeu sur le concours suivant.**

Conséquences concrètes :
- à écrire dans les règles publiques de la roue,
- à la clôture, l'admin doit voir clairement **« Graded Card — NOT WON »** pour
  savoir qu'il doit le reconfigurer sur le concours suivant,
- aucun code supplémentaire : c'est une action admin, pas un automatisme.

### c) Le dimensionnement du pool n'est pas le nombre de tickets

Décision n°1 : les tickets bonus et de parrainage ne donnent pas de spin. Or ces
tickets **consomment quand même** des numéros dans les 700 du concours.

Donc sur un concours de 700 tickets, le nombre de spins réellement générés sera
**inférieur à 700** — de l'ordre de 620-660 selon l'usage des paliers de bonus.

Conséquence : si l'admin configure 700 jetons, une centaine ne sera jamais tirée.
Ce n'est pas grave en soi, mais **l'écran d'admin doit le dire**, sinon les
pourcentages affichés seront faux par rapport à la réalité vécue. Prévoir :

```
Jetons configurés : 700
Spins attendus    : ~640  (tickets payants estimés)
⚠ 60 jetons ne seront probablement jamais tirés
```

## 3. 🟡 Choix de conception : pool fini, pas probabilité

Le prompt mélange deux modèles : des **quantités** (420/210/69/1) et des
**pourcentages** (60/30/9,86/0,14).

Ce ne sont pas la même chose :

- **Probabilité indépendante** : chaque spin tire à 0,14 %. Sur 700 spins on peut
  distribuer 0 jackpot… ou 3. Ingérable pour un lot unique.
- **Pool fini** (tirage sans remise) : 700 jetons mélangés, on en retire un à
  chaque spin. Garantit **exactement** 1 jackpot, jamais de survente, et rend la
  concurrence triviale à gérer (un simple décrément atomique).

**Recommandation : pool fini.** Les pourcentages deviennent un simple affichage
calculé, exactement comme demandé. C'est aussi le seul modèle qui tient la
promesse « Configured / Won / Remaining » du prompt.

Conséquence directe : le pool doit être dimensionné sur le nombre de **tickets
payants** attendus, pas sur `totalTickets` — voir §2bis-c.

---

## 4. ✅ Ce qui se réutilise (réponse au §7 du prompt)

L'infrastructure demandée existe déjà en grande partie :

| Besoin | Existant à réutiliser |
|---|---|
| Attribution atomique d'un lot unique | Le patron `Serializable` + retry de `api/tickets/free-entry/route.ts:126` — c'est **exactement** le même problème (« deux utilisateurs, un seul stock ») déjà résolu |
| Réglages admin sans migration | `SiteSettings.data` (JSON) — pour `jackpotNotificationEmail` |
| Formulaires de réglages | Le patron de `apps/admin/src/components/settings/*-form.tsx` |
| Page concours admin | `dashboard/competitions/[id]/` — y ajouter les onglets Wheel |
| Envoi d'email | `apps/admin/src/lib/email.ts` + `sendEmail`, gabarits déjà à la charte |
| Cycle de vie d'un lot physique | Le modèle `Win` a déjà `claimedAt / shippedAt / deliveredAt / trackingNumber / notes` — le statut jackpot demandé (PENDING → DELIVERED) s'y calque |
| Journalisation | `AuditLog` |
| Export / filtres | `participants-export.tsx` |

**Rien à recréer.** Le seul vrai manque est le système de codes promo (§2).

---

## 5. Modèle de données proposé

```
WheelConfig       (1 par concours)
  competitionId, enabled, jackpotEnabled,
  jackpotDescription, jackpotValue, couponValidityDays

WheelSlot         (les jetons du pool)
  wheelConfigId, type (NO_WIN | PERCENT_OFF | JACKPOT),
  value (5, 10, null), quantityConfigured, quantityWon

WheelSpin         (un spin = une ligne, capitalisé jusqu'au tirage)
  userId, orderId, ticketId, competitionId,
  grantedAt, expiresAt     → = drawDate du concours
  spunAt, slotType, promoCodeId?
                           → spunAt NULL = spin encore disponible

PromoCode         (voir §2.2)

JackpotWin        (créé au moment du gain)
  spinId, userId, competitionId, orderId, status,
  adminNotes, trackingNumber, shippedAt
```

`quantityWon` porté par le slot permet l'affichage
« Configured / Won / Remaining » et la garde « jamais de stock négatif » :
la modification admin est refusée si `nouvelleQuantité < quantityWon`.

---

## 6. Découpage proposé

**Phase 0 — fait.** Toutes les décisions produit sont prises (§0). Reste la
validation avocat, en parallèle du développement.

**Phase 1 — socle**
Migration Prisma (`WheelConfig`, `WheelSlot`, `WheelSpin`, `PromoCode`,
`JackpotWin`), config admin par concours avec pourcentages calculés, garde
anti-stock-négatif, estimation des spins réels (§2bis-c). Rien de visible côté
public.

**Phase 2 — attribution atomique**
Tirage dans le pool branché sur `fulfill-checkout.ts`, un spin par ticket payant
(`isBonus = false`, statut `SOLD`). Tests de concurrence : N utilisateurs
simultanés ne doivent jamais gagner deux fois le lot unique.

**Phase 3 — codes promo**
Le sous-système du §2 : modèle, réservation atomique, application **par
recalcul du `unit_amount`** (jamais par coupon Stripe — §2.1), libération sur
expiration de session, tests sur le garde-fou de montant.

**Phase 4 — jackpot**
`JackpotWin`, section admin très visible, alerte tant que PENDING/CONTACTED,
email équipe. **L'email n'est jamais bloquant** : le gain est enregistré et le
stock décrémenté même si Resend est indisponible — l'erreur est seulement loggée.
C'est déjà le patron du projet.

**Phase 5 — dashboard admin — FAIT**
Carte *Wheel Results* sur la page compétition : spins distribués / joués / restants,
répartition par lot avec le stock restant, taux de retour des codes, état du lot
principal, historique filtrable (le filtre est dans l'URL, donc c'est la requête
qui change, pas un tri côté navigateur) et export CSV/XLSX complet, audité.

**Phase 6 — public — FAIT**
La roue et son animation (sur la page de confirmation *et* dans **My Rewards**),
la section My Rewards (spins, codes promo copiables, historique), le champ code
promo au checkout — sans lui les codes gagnés étaient inutilisables — et la
relance email 48 h avant expiration, greffée sur le cron `closing-soon`
(les spins meurent à la date de tirage : même fenêtre, même run).

Il reste la **Phase 5** (dashboard admin) et les points de vigilance ci-dessous.

## 7. Points de vigilance

- ~~**Remboursement d'une commande dont le spin a gagné**~~ — **FAIT**.
  `reverseWheelRewardsForOrder` dans `packages/database/src/wheel-reversal.ts`,
  appelé par les trois seuls écrivains de `paymentStatus = 'REFUNDED'`
  (webhook remboursement, webhook litige perdu, annulation de concours), dans la
  même transaction que le flip de statut. Spins annulés, codes non utilisés
  invalidés, carte gradée **gelée** (jamais révoquée automatiquement). Le jeton
  du pool n'est **jamais** rendu : `quantityWon` est monotone parce que le
  jackpot, c'est une seule carte physique.
- ~~**Suppression de compte (RGPD)**~~ — **FAIT**. `WheelSpin`, `PromoCode` et
  `JackpotWin` avaient déjà `onDelete: SetNull` ; ce qui manquait, c'était
  (a) le blocage de la suppression tant qu'un `JackpotWin` n'est pas livré et
  (b) l'effacement de `adminNotes` / `trackingNumber`, du texte libre qui
  contient nom et adresse.
- ~~**Annulation d'un concours**~~ — **FAIT**. Les spins meurent avec le
  concours, mais les codes déjà gagnés **survivent** : l'annulation est notre
  décision, pas celle du client.

### Audit complet du 2026-08-31 (6 angles, passage adverse : 13 réfutées, 29 retenues)

**Verdict initial : PAS prêt.** Quatre bloquantes, toutes corrigées depuis :
1. Un code promo gagné à la roue était **réutilisable indéfiniment** — la page
   d'annulation le rendait, la session Stripe restait payable, et payer ensuite
   refaisait la commande au tarif remisé sans reprendre le code.
2. Annuler un concours **gardait l'argent d'un acheteur de dernière minute** :
   la liste des commandes était figée avant une boucle de remboursement longue,
   pendant laquelle le concours restait en vente.
3. Le gain de la carte gradée n'était annoncé **que dans un div côté client** —
   un rafraîchissement le détruisait. Aucun email au gagnant, aucune trace sur
   son compte, alors que le texte promettait un email.
4. Une carte refusée laissait le code promo bloqué en « utilisé » et le ticket
   de parrainage perdu : le webhook d'expiration ne réclamait que `PENDING`.

Cinq correctifs secondaires livrés en même temps (file de spins bloquée par un
spin mort, `VOIDED` absent du checkout, libellé « annulé » sur un code encore
valide, « ton dernier spin » faux pour un acheteur récurrent, et une erreur
réseau qui affirmait à tort que le spin n'avait pas été consommé).

### Tout le reste est livré (2026-08-31)

Les points différés puis les trouvailles secondaires de l'audit sont traités :
garde-fou d'épuisement du pool (détection quotidienne + alerte, pas de blocage —
refuser un spin punirait des acheteurs honnêtes) ; délai avant expédition d'une
carte gradée, calé sur la date du **gain** et non du paiement ; gel dès
l'**ouverture** d'un litige ; le ticket gratuit de parrainage ne donne plus de
spin ; page de commande remboursée ; règles publiques de la roue dans
`/competition-rules` §8 ; probabilités réelles affichées sur la roue elle-même ;
accessibilité ; relance d'expiration par spin ; état « en pause » visible ;
statut terminal pour un jackpot non attribué.

Il ne reste que des points hors code : validation juridique, `CRON_SECRET` sur
Vercel, webhook Stripe Live.

- **Codes promo et RGPD** : rattachés à un `userId`. À la suppression de compte,
  les anonymiser comme `Win` et `DrawLog`, ou les supprimer s'ils sont inutilisés.
