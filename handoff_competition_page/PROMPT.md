# Claude Code prompt — Competition Page

Copy everything below this line into a new Claude Code chat, at the root of your real codebase.

---

I have a design for a **competition detail page + 3-step checkout flow** sitting in `./handoff_competition_page/` (next to this repo). I want you to implement it in this codebase, matching my existing stack and patterns. The design prototype uses React 18 + plain JSX + vanilla CSS — **don't copy the files verbatim, adapt them.**

## What to do — step by step

**1. Read the design, don't guess.**
   Start by reading:
   - `./handoff_competition_page/README.md` — overview and design decisions
   - `./handoff_competition_page/source/page-comp.jsx` — the two React components (`CompetitionDetail` and `EnterFlow`)
   - `./handoff_competition_page/source/styles.css` — all styling (look for the commented sections `COMPETITION DETAIL`, `Inline Step 01`, `ENTER FLOW`)
   - `./handoff_competition_page/source/data.jsx` — the data shape each competition object expects
   - `./handoff_competition_page/source/shell.jsx` — shared primitives (`Countdown`, `PageHeader`, `TrustStrip`) that I'll need equivalents of

**2. Explore my codebase before writing anything.**
   - What framework am I using? (Next.js / Remix / Vite / CRA / etc.)
   - What's my routing library? (Next App Router / React Router / TanStack Router / etc.)
   - How do I style things? (Tailwind / CSS Modules / styled-components / vanilla CSS / etc.)
   - Do I already have a competition detail page? Show me its current state.
   - What's my data layer? (API routes, tRPC, GraphQL, static data, etc.)

**3. Ask me before you code.**
   After exploring, ask me:
   - Whether to port the design 1:1 or adapt to existing components I already have
   - Whether I want the 3-step `EnterFlow` on one route with internal state, or across 3 separate routes
   - How to wire real payment (Stripe Checkout? Embedded Elements? Apple/Google Pay?)
   - Whether the skill-question "3 attempts" counter should be server-validated (anti-cheat) or client-side is fine for now

**4. Implement in small commits.**
   Suggested order:
   1. Port the CSS tokens (colors, fonts, radii, shadows) into my existing token system
   2. Build `CompetitionDetail` page — hero + inline ticket picker + about section
   3. Build `EnterFlow` — Step 02 (skill Q) + Step 03 (billing) on the same route
   4. Wire the data + routing + payment
   5. Polish: loading states, empty states, error handling, a11y (keyboard nav on qty tiles + skill options)

**5. Preserve these design decisions — they're not incidental:**
   - Ticket picker (qty 1/5/10/25/50/100 + custom stepper + auto/manual pick) **stays in the hero** on the detail page. User must never scroll to buy.
   - 3 checkout steps reveal sequentially **on one page** — no route-per-step redirects.
   - Skill-question feedback is instant and color-coded (correct = green, wrong = red).
   - Free-postal-entry postcard block is **legally required** for UK prize draws. Keep it visible on the detail page.
   - Countdown and progress bar share the same green with an animated diagonal-stripe fill.

**6. At each step, show me what you built** and wait for approval before moving to the next.

Start by reading the files I listed and summarising what you found. Don't write any code yet.
