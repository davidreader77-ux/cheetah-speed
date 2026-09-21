# Bot playbook — Cheetah Speed

Bots work this repo while David is away. Humans review PRs. Do not ask David questions.

Repo: `davidreader77-ux/cheetah-speed`

## Goal

Ship a playable v1: a stranger opens the app, starts a sprint, sees speed, fails or finishes, taps to retry.

## Product (locked)

- **Name:** Cheetah Speed
- **Pitch:** Savanna sprint — you are the fastest land animal
- **Brand:** golden-hour, tawny gold `#D4A017`, charcoal `#1A140C`, cream lettering
- **Auth/DB:** off. High score in localStorage only
- **Out of scope:** payments, accounts, native apps, multiplayer, gore

## How a builder run works

1. Read `README.md`, `PRODUCT-BRIEF.md`, `AGENTS.md`, this file.
2. List open issues and open PRs.
3. If every v1 issue is closed: stop. Comment that v1 is done.
4. Pick the **lowest-number open issue** that does not already have an open PR.
5. Implement **that one issue only** as a working vertical slice.
6. Branch `bot/issue-N-short-slug` from `main`.
7. Open a PR into `main`. First line of the body: `Closes #N`.
8. Comment on the issue with the PR URL.

## How a reviewer run works

1. Read the PR diff.
2. Check against PRODUCT-BRIEF and the linked issue.
3. If it is clearly broken, request changes with specific fix notes.
4. If it matches the issue and is playable, approve. Do **not** merge unless the PR is a tiny docs/typo fix.
5. David merges when he is back.

## Stack (do not replace)

React 19, TypeScript, TanStack Start, Tailwind v4, Vite, Zustand. Pages in `src/routes/`. Keep `getRouter()` and the document shell.

## Quality bar

- Real title, Play, a sprint — not a blank page
- Works at ~390px width
- No lorem ipsum
- One issue / one PR
