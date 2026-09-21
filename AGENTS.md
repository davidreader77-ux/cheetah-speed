# Project rules for coding agents

This repo is **Cheetah Speed**, a Grok App Builder web game. Follow these on every task.

## Stack (do not replace)

- React 19, TypeScript, TanStack Start / Router, Tailwind v4, Vite
- Pages: `src/routes/` using `createFileRoute`
- Keep `src/router.tsx` exporting **`getRouter()`** if that file is in the PR
- Game loop: `src/game/sprint.ts` (fixed timestep 1/60, pooled entities)
- Overlay UI: `src/components/cheetah-speed.tsx`

## Identity

- App name: **Cheetah Speed**
- `src/lib/og/site.json`: `"title": "Cheetah Speed"`, `"type": "x:game"`, `"card": "custom"`
- Keep `public/og.jpg` (1200×630) and `public/x-banner.jpg` (1200×264)
- Do not add `og:*` or `twitter:card` to `__root.tsx`

## Auth and database — off

No accounts. High score in localStorage only (`cheetah-speed-v1`).

## Controls

Auto-run side scroller. **W / Space / tap = jump. S / swipe down = duck.** A/D are unused on purpose — do not add left/right movement.

## Quality bar

1. `npm run typecheck` passes when a full app tree exists
2. Not a blank page — real title, Play, a sprint
3. Works at ~390px width
4. No lorem ipsum, no emoji in chrome
5. Brand gold `#D4A017` is allowed (user brand); do not introduce purple
