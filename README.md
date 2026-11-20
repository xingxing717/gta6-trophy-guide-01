[![GTA 6 trophy guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/xingxing717/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/xingxing717/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Legend — GTA VI Trophy Guide & Tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: official names, descriptions and grades, a guide in our own words with its sources beside every trophy, a roadmap to the platinum, missable flags, and a checklist that saves your progress in the browser.

Built for the [make.fun GTA 6 trophy guide bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it covers

- **All 55 trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze; 27 visible, 28 hidden until earned; 0 online. Names, descriptions and grades as PlayStation publishes them.
- **A guide for each trophy**, written in our own words, with its sources named and linked (Exophase, PSNProfiles, PowerPyx, CryptoGames, GTABase). Where no source has confirmed the steps yet, the guide says so instead of guessing.
- **Roadmap to the platinum** in four stages, built from the official descriptions, with PowerPyx's time estimates (about 200 hours, difficulty 4/10).
- **Missables**: only one trophy is reported as possibly missable — Positive Mental Attitude, whose first meditation sits in Chapter 1. The guide flags it and explains the safe play.
- **Tracker**: checklist saved in localStorage, export to a file and import back, counters for the count-based trophies, filters by kind (story, missable, collectibles, activities, side jobs, online) and grade, search, and a spoiler setting that hides story trophies until they are earned.

## Run it

Serve `app/` with any static file server and open `index.html` — no build step, no network:

```sh
cd app && python3 -m http.server 8080
# open http://localhost:8080
```

## Hand it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

- [Exophase — GTA VI trophy list](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/)
- [PSNProfiles — GTA VI trophies](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi)
- [PowerPyx — GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/)
- [CryptoGames — GTA 6 Trophies and Achievements](https://cryptogames.gg/gta-6-trophies-achievements-full-list/)
- [GTABase](https://www.gtabase.com/)

Unofficial and open source (MIT). Not affiliated with Rockstar Games; no Rockstar logo, artwork or game screenshots are used.
