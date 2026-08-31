# WinUCard — Lessons Learned

<!-- Format : [date] | ce qui a mal tourné | règle pour l'éviter -->

| Date | Problème | Règle |
|------|----------|-------|
| 2026-03-19 | Gold text (#F0B90B) on white fails WCAG AA contrast (1.95:1) | Always use --accent-text (#946800) for gold text on light backgrounds, reserve --accent for decorative/non-text elements |
| 2026-03-19 | JS hover handlers (onMouseEnter/onMouseLeave) don't work on touch devices and create no pressed state | Use CSS :hover/:active/:focus-visible instead of JS style manipulation for interactive states |
| 2026-03-19 | min-h-screen on mobile Safari includes address bar height, hiding content | Use min-h-[100dvh] instead of min-h-screen for full-viewport sections |
| 2026-03-19 | Pre-existing unused variable (`filters`) blocked entire build via lint error | Always check build passes before pushing; prefix unused destructured params with `_` |
| 2026-03-19 | Making a Prisma field nullable (`Int?`) breaks every file that uses it without null-check | When changing a schema field to nullable, grep ALL usages across both apps (web + admin) and fix every one before building |
| 2026-03-19 | Referral counting in payment webhook must never block payment confirmation | Always wrap post-payment side effects (referrals, analytics, notifications) in try/catch outside the main transaction |
| 2026-03-19 | CAPTCHA token was optional — bots could skip it entirely | Make CAPTCHA required in production via conditional Zod schema |
| 2026-03-19 | In-memory rate limiting (Map) resets on serverless cold starts | Always use Redis-based rate limiting in production, never in-memory Maps |
| 2026-03-19 | findFirst + update is not atomic — race condition on concurrent claims | Use updateMany with a status guard in the WHERE clause for atomic claim operations |
| 2026-08-31 | Après `prisma migrate dev`, le serveur Next en cours d'exécution garde l'ancien client Prisma en mémoire : la nouvelle colonne renvoie `Unknown argument` et un 500 trompeur | Redémarrer le serveur de dev après toute migration, avant de tester la requête qui utilise le nouveau champ |
| 2026-08-31 | Texte soudé aux quartiers d'une roue : illisible (à l'envers) sur la moitié des positions, quel que soit l'angle d'arrêt | Contre-rotation des libellés (`rotate(-rotation)` autour de leur propre point) avec la même transition que la roue |
| 2026-08-31 | Une remise affichée côté client doit utiliser exactement la même fonction que le serveur (`applyPercentDiscount` sur le TOTAL) | Ne jamais recalculer un prix « à la main » dans un composant : importer l'utilitaire partagé, sinon dérive d'un penny et commande refusée à la livraison |
| 2026-08-31 | Rendre au client un avantage (code promo, ticket de parrainage) à l'annulation d'une commande, sans tuer la session Stripe — elle reste payable, donc il dépense deux fois | Toute restitution sur annulation doit être précédée de `stripe.checkout.sessions.expire`, et ne rien rendre si l'appel échoue |
| 2026-08-31 | Une correction posée vite dans un chemin qui touche à l'argent a ouvert un trou plus grave que le bug corrigé | Après toute correction sur un chemin de paiement, se demander explicitement : « qu'est-ce que ceci rend possible qui ne l'était pas ? » — pas seulement « est-ce que le bug est parti ? » |
| 2026-08-31 | Un concours vendu entièrement est tiré AVANT sa date : tout ce qui calcule une échéance sur `drawDate` se trompe | Pour une deadline, se baser sur le statut du tirage, jamais sur la date seule |
