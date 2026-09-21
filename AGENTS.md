# Project rules for coding agents

This repo is **Cheetah Speed**, a Grok App Builder web game. Follow these on every task.

## Stack (do not replace)

- React 19, TypeScript, TanStack Start / Router / Query, Tailwind v4, Vite
- Pages: `src/routes/` using `createFileRoute`
- Keep `src/router.tsx` exporting **`getRouter()`**
- Keep `src/routes/__root.tsx` document shell, `AuthProvider`, and `PreviewHostBridge`

## Identity

- App name: **Cheetah Speed**
- `src/lib/og/site.json`: `"title": "Cheetah Speed"`, `"type": "x:game"`, `"card": "custom"`
- Keep `public/og.jpg` (1200×630) and `public/x-banner.jpg` (1200×264)
- Do not add `og:*`, `twitter:card`, or `x:game:image` to `__root.tsx` — the platform injector emits them

## Auth and database — off

No accounts. High score in localStorage / Zustand only.

## Quality bar

1. `npm run typecheck` passes
2. `npm run build` passes
3. Not a blank page — real title, Play, a sprint
4. Works at ~390px width
5. No lorem ipsum

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```
