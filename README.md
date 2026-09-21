# Cheetah Speed

> A savanna sprint game — you are the fastest land animal.  
> Started in Grok App Builder. Continued on GitHub.

**Status:** prototype (share cards + identity ready; playable loop is the next build)  
**Login:** no · **Database:** no · **Type:** game (`x:game`)

## What it does

You run a cheetah across golden savanna. Build speed, dodge, chase. Short runs. Local high score.

### Brand

- Tawny gold `#D4A017`, charcoal `#1A140C`, cream lettering
- Share card: `public/og.jpg` (1200×630)
- X feed card: `public/x-banner.jpg` (1200×264)
- Favicon: `public/favicon.svg`
- Identity: `src/lib/og/site.json`

## Stack

React 19, TypeScript, TanStack Start, Tailwind CSS v4, Vite.

```
src/routes/          pages
src/components/      UI
src/lib/             helpers + og/site.json
public/              og.jpg, x-banner.jpg, favicon.svg
```

## Run locally

Need Node 22+.

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Never commit `.env` files.

## For Copilot

Read `AGENTS.md` and `PRODUCT-BRIEF.md`. Paste `SEND-THIS-TO-COPILOT.md`. One issue per PR.
