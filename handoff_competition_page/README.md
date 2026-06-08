# Competition Page — Handoff for Claude Code

This folder contains the competition flow from the WinUCard Drop design
prototype. Use it as the **design source of truth** when asking Claude Code
to implement this page in your real codebase.

## What's in here

```
handoff_competition_page/
├── README.md                ← this file
├── PROMPT.md                ← copy-paste prompt for Claude Code
├── assets/                  ← card images used in the mock data
│   ├── charizard.webp
│   ├── jordan.webp
│   ├── luffy.webp
│   └── messi.webp
└── source/
    ├── WinUCard Drop.html   ← entry point (open to see the design live)
    ├── page-comp.jsx        ← ★ the competition page + enter flow (MAIN FILE)
    ├── styles.css           ← all CSS (global + competition-specific)
    ├── data.jsx             ← mock competition data schema
    ├── shell.jsx            ← shared UI primitives (Countdown, PageHeader, etc.)
    └── app.jsx              ← hash router (shows which routes map to which components)
```

## The page you care about

**File: `source/page-comp.jsx`**

Two React components matter:

1. **`CompetitionDetail({ slug })`** — the competition detail page
   - Route: `#/competitions/:slug`
   - Contains: hero (card visual + title + value + progress + countdown + inline Step 01 ticket picker) + "About the Card" section with free-postal-entry info
   - The ticket picker (qty tiles 1/5/10/25/50/100, stepper, auto/manual pick) is embedded **in the hero** so the user doesn't need to scroll to buy.
   - Clicking "Enter now → £X" stores qty/pickMethod in sessionStorage and routes to `#/competitions/:slug/enter`.

2. **`EnterFlow({ slug })`** — the 3-step checkout flow (single page, sequential reveals)
   - Route: `#/competitions/:slug/enter` (and legacy `.../tickets`, `.../skill`, `.../checkout`)
   - Step 01 is pre-filled from sessionStorage — the user lands directly on **Step 02 (Skill Question)**.
   - Step 02: skill trivia, 3 attempts, auto-advances to Step 03 on correct answer.
   - Step 03: billing form + pay panel + "Complete entry" CTA → success screen.

## Styling

All CSS lives in `source/styles.css`. The relevant blocks are commented:

- `/* COMPETITION DETAIL · one-page flow */` — hero, progress bars, countdown
- `/* Inline Step 01 on comp detail */` — embedded ticket picker
- `/* ENTER FLOW — 3-step single page */` — enter flow layout, tracker, steps
- Qty tiles, skill options, billing grid, pay panel — all scoped

Design tokens are defined at the top of the file (`:root`): `--accent` (green),
`--hot` (red CTA), `--pop` (blue), `--warn` (yellow), `--ink` (black), etc.
Typography: `--display` = Space Grotesk, `--mono` = JetBrains Mono.

## Data contract

See `source/data.jsx` — each competition object has:

```js
{
  slug, title, game, value, ticket, total, sold, left,
  endIso, status, img, description,
  details: [{ k, v }, ...],          // card attributes (grade, set, year...)
  question: { q, options: [], answer: <index> }
}
```

## How to hand this off

1. **Zip this folder** (or the whole project from the download button).
2. **Unzip it next to your real codebase** (e.g. `my-app/` and `handoff_competition_page/` side-by-side).
3. **Open Claude Code** at the root of your real codebase.
4. **Paste the prompt** from `PROMPT.md` as the first message.
5. Claude Code will read the design files, ask a few questions about your
   stack (framework, router, state management), then rebuild the page
   matching your existing patterns.

## Design decisions worth preserving

- **Ticket picker must stay in the hero**, not below. This is the whole point
  of the redesign — no scroll to convert.
- **3-step flow reveals sequentially on the same page** (not separate routes).
  Only the URL changes for deep-linking; the content swaps in place.
- **Skill question feedback is instant + color-coded**: green = correct, red =
  wrong, yellow = selected pending. Failed attempts decrement a counter
  (UK legal requirement: 3 max).
- **Free postal entry** block (yellow postcard) is legally required — keep it
  on the detail page, not hidden behind a modal.
- **Countdown + progress bar use the same --accent green** with a moving
  diagonal stripe animation — don't replace with a plain linear-gradient.
