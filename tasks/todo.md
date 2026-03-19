# WinUCard — Todo

## En cours


## À faire


## Terminé
- [x] Feat: Compétitions gratuites (FREE competitions) — 2026-03-19
  - Prisma schema: `isFree` field + `totalTickets` nullable
  - Shared validators: `createCompetitionSchema` updated + `claimFreeEntrySchema`
  - Admin form: toggle Paid/Free, conditional fields, unlimited participants checkbox
  - API: `POST /api/tickets/free-entry` endpoint
  - Frontend: detail page adaptation (FreeEntryButton, badge, participant count)
  - Frontend: competition cards (FREE badge, green button, participant labels)
  - All null-safety fixes across admin + web
