# Send this to GitHub Copilot or a developer

Copy everything below the line into Copilot Chat, the Copilot coding agent, or a message to your developer.

---

I have a web app started in **Grok App Builder** (xAI). Take **Cheetah Speed** from prototype to a usable v1.

## Product

- **App name:** Cheetah Speed
- **Pitch:** A savanna sprint game — you are the fastest land animal. Hit top speed, dodge, hunt.
- **Who it's for:** anyone who wants a short, punchy browser game
- **Live link:** not published yet
- **Must-haves:**
  1. Playable sprint: tap/hold or keys to run a cheetah across the savanna
  2. Speed read-out (current + top speed) and a short run that can be restarted
  3. Obstacles / prey to dodge or chase so it isn't an empty run
- **Do not build:** payments, accounts, native iOS/Android, multiplayer
- **Login required?** no
- **Save across devices?** no (local high score is fine)
- **Brand:** golden-hour savanna, tawny gold #D4A017, charcoal #1A140C, cream lettering. Use `public/og.jpg` and `public/x-banner.jpg` as the look.

## Stack (already chosen — do not replace)

React 19, TypeScript, TanStack Start + Router + Query, Tailwind CSS v4, Vite, Zod, Zustand.

- Pages: `src/routes/`
- UI: `src/components/`
- Keep `export function getRouter()` in `src/router.tsx`
- Keep the existing Vite / TanStack Start wiring
- Identity: `src/lib/og/site.json` title **Cheetah Speed**, `"type": "x:game"`, `"card": "custom"`
- Keep `public/og.jpg` (1200×630) and `public/x-banner.jpg` (1200×264). Do not add `og:*` or `x:game:image` to `__root.tsx` — the platform injector emits those.

## How to work

1. Read `README.md`, `AGENTS.md`, and `PRODUCT-BRIEF.md`.
2. Ship one must-have as a full vertical slice (UI + state + empty/error).
3. Works on desktop and phone-width (~390px).
4. `npm run typecheck` and `npm run build` both pass.
5. Open a pull request describing what a player can now do.

## Rules

- Working game, not a wireframe. No lorem ipsum.
- No login or database.
- No secrets in git.
- Do not ask me to run commands or paste logs — you run them.
- One issue / one PR at a time.

## Definition of done for v1

A stranger can open the app, start a sprint, see their speed, fail or finish, and try again without a walkthrough.
