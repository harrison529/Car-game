# Turbo Toy Racing

A Hot Wheels-inspired 2D browser racer with original vector cars and orange stunt tracks. Independent fan-inspired project; not affiliated with Mattel.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. `npm run build` creates a static production site in `dist/`.

## Play

Create a local driver profile, then choose a car and one of five tracks. Quick Play and each tournament round use a ten-second matchmaking screen, followed by a three-second race countdown. Tournaments have four entrants and three rounds; points are 10 / 6 / 4 / 2. Completing a race earns 600 / 400 / 300 / 200 coins by position. Results return to the home screen through a two-second loading screen.

- **Drive:** hold Right; Left brakes; Space jumps; Up boosts; Escape pauses.
- **Touch:** use the Gas, Brake, Jump and Boost buttons.
- **Friend racing:** two players on one keyboard. Player two holds D to drive, A to brake, W to jump.
- **Garage:** 60 original collectible cars; select any owned car.
- **Daily shop:** six deterministic offers, rotating at 00:00 UTC. New drivers receive 2,000 coins.

Profiles, selected car, coins, purchases, and race records persist in this browser's local storage. This is a local playable version: accounts have no remote authentication, matchmaking fills seats with bots, and friend racing is same-device only. Internet multiplayer needs a server, lobby protocol, and shared profile storage. Local clock/storage can be edited; this is not a secure online economy.

## Validation

```sh
npm test
npm run build
npx playwright test
```

Browser tests use system Chromium at `/usr/bin/chromium`. Set `CHROMIUM_PATH` to another installed Chromium binary if needed. Tests cover onboarding, persistence, purchasing, the 60-car garage, mobile overflow, a full race and reward, pause/resume, friend mode, and tournament startup.

No external art, fonts, API keys, or runtime services are required. Each cloud task is already isolated: use the existing checkout rather than creating a worktree.
