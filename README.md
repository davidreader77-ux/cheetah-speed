# Cheetah Speed

Savanna sprint — you are the fastest land animal.

**Status:** playable v1  
**Login:** no · **Database:** no · **Type:** game (`x:game`)

## Play

Tap **Play**. You auto-run.

- Jump mounds: `W` / Space / tap
- Duck thorns: `S` / swipe down / Duck (phone)
- Catch gazelle by running through them
- Crash ends the run — **Try again** is instant
- Top speed and longest run save on this device (`localStorage`, key `cheetah-speed-v1`)

Heat ramps to a cap. There is no login.

## Brand

- Tawny gold `#D4A017`, charcoal `#1A140C`, cream `#F3E6C8`
- Share card: `public/og.jpg` (1200×630)
- X banner: `public/x-banner.jpg` (1200×264)
- Favicon: `public/favicon.svg`
- Identity: `src/lib/og/site.json`

## Loop source

| File | Role |
|---|---|
| `src/game/sprint.ts` | Canvas runner — fixed 1/60, pooled spawn, heat-capped speed |
| `src/components/cheetah-speed.tsx` | Title, HUD, result, mobile Duck |
| `src/routes/index.tsx` | Home |
| `src/styles.css` | Tokens |

Sprites belong in `public/sprites/` (`cheetah.png`, `gazelle.png`, `mound.png`, `branch.png`). The loop draws geometric fallbacks if a sheet is missing.

## Product lock

Side-view auto-sprint. Jump / duck only. No accounts, database, payments, multiplayer, or gore.

## Stack

React 19, TypeScript, TanStack Start, Tailwind CSS v4, Vite. Canvas 2D for the run.

## For bots

Read `AGENTS.md`, `PRODUCT-BRIEF.md`, `BOT-PLAYBOOK.md`. One issue per PR.
