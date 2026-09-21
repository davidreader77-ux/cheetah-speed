# Product brief — Cheetah Speed

## Summary

| | |
|---|---|
| **Name** | Cheetah Speed |
| **Pitch** | A savanna sprint — you are the fastest land animal |
| **Audience** | Athletes and anyone who wants a short, timed sprint |
| **Job to be done** | When I have a minute, I want to run a 100m as a cheetah and beat my PRs |
| **Live** | Playable in Grok App Builder |
| **Success looks like** | Player times a 100, sees 40yd + vs Bolt/cheetah, or hunts and gets a session recap |

## Must have (shipped)

1. **Hunt** — auto-run, jump mounds, duck thorn, catch gazelle, crash + retry
2. **100m dash** — timed 100, 40-yard split, DNF on a hit, official time vs cheetah 5.95 / Bolt 9.58
3. **Combine recap** — peak mph, splits, PR badges, localStorage `cheetah-speed-v1`

## Next (bots pick these, lowest open issue first)

- Cleaner cheetah / gazelle run cycles (ghost limbs) — #5
- Stronger duck silhouette — #7
- Mute toggle that persists — #8
- Sky shifts toward dusk as heat rises — #9
- Near-miss dust on a close jump/duck — #10
- Land squash / takeoff stretch — #11

Do **not** replace Hunt / 100m with a CSS sketch. Do not add accounts or a global leaderboard. Prey streak (#6) is already in the live hunt HUD — skip if already present.

## Out of scope

- Native iOS / Android
- Payments, accounts, multiplayer
- Real-animal hunting gore

## Accounts and data

| Question | Answer |
|---|---|
| Sign in required? | no |
| Save across devices? | no |
| Anonymous local save OK? | yes (`cheetah-speed-v1` in localStorage) |

## Screens

1. **Title** — Field test lockup, Hunt + 100m, PRs vs Bolt/cheetah marks
2. **Hunt** — savanna, speed / distance / heat / prey / live splits
3. **100m** — clock, metres left, 40yd split
4. **Result** — official time or session recap, PR badges, run it back

## Brand

- Vibe: golden-hour, fast, premium indie, combine-sheet stats
- Colors: `#1A140C` / cream `#F3E6C8` / `#D4A017`
- Avoid: purple AI-SaaS gradients, cartoon clipart that fights the share card
