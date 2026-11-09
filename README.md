# Turbo Toy Racing

A Hot Wheels-inspired 2D browser racer with original vector cars and orange stunt tracks. Independent fan-inspired project; not affiliated with Mattel.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. For multiplayer during development, run `npm start` in a second terminal; Vite forwards WebSocket connections to it. `npm run build` creates the production client in `dist/`.

## Play

Create a local driver profile, then choose a car and one of five tracks. Quick Play and each tournament round use a ten-second matchmaking screen, followed by a three-second race countdown. Tournaments have four entrants and three rounds; points are 10 / 6 / 4 / 2. Completing a race earns 600 / 400 / 300 / 200 coins by position. Results return to the home screen through a two-second loading screen.

- **Drive:** hold Right; Left brakes; Space jumps; Up boosts; Escape pauses.
- **Touch:** use the Gas, Brake, Jump and Boost buttons.
- **Friend racing:** connect to the same server, create a private room, and share its six-character code. The ten-second countdown begins when a second driver joins. The one-keyboard option remains available (player two: D to drive, A to brake, W to jump).
- **Garage:** 60 original collectible cars; select any owned car.
- **Daily shop:** six deterministic offers, rotating at 00:00 UTC. New drivers receive 2,000 coins.

## Online racing

The multiplayer server runs authoritative physics over WebSockets, matches up to four drivers on the same track and mode, and fills empty seats with bots after ten seconds. Disconnected drivers become bots. Online tournaments preserve entrants and cumulative points across three rounds; every remaining human must press Ready between rounds. Online races keep running when a player changes tabs; use Leave Race to exit.

For a production server:

```sh
npm ci
npm run build
npm start
```

The server serves the game and `/online` WebSocket endpoint on port 3001 (override with `PORT`). It also exposes `/health`. For friends on the same network, open the host computer's LAN address and port. For players across the internet, deploy this Node process to a public host with HTTPS and WebSocket support; configure the host's reverse proxy to forward `/online` upgrades. Set a single instance: rooms are held in memory and a restart ends active races. No public server is bundled or automatically deployed.

Quick Play and Tournament offer Connect & Race or Play Offline with Bots. Everyone must use the same server address. Friend Racing offers Create / Join Room. A downloaded file cannot provide an online server by itself: enter the public server's HTTPS address in its connection panel. Browser-hosted copies default to their own origin. Failed connections and invalid room codes show errors instead of claiming players were matched.

Profiles, selected cars, coins, purchases, and race records remain local to the browser; storage-blocked previews can play without persistence. Driver names are display names, not authenticated accounts. Local clock/storage can be edited; this is not a secure online economy. The server validates control inputs and simulates positions itself, but does not persist accounts or purchases.

## Standalone download

Open `download/index.html` directly to play without installing anything. Regenerate it after source edits with `npm run build:download`. All game code and art are included; online play still needs a running server as described above.

## Validation

```sh
npm test
npm run build
npx playwright test
```

Browser tests use system Chromium at `/usr/bin/chromium`. Set `CHROMIUM_PATH` to another installed Chromium binary if needed. Tests cover onboarding, persistence, purchasing, the 60-car garage, mobile overflow, a full race and reward, pause/resume, friend mode, tournament startup, blocked browser storage, sandboxed previews, and two real browser clients racing in a private room. Server tests exercise bot fill, private room errors, disconnect replacement, authoritative inputs, and all tournament rounds.

No external art, fonts, or API keys are required. Online play requires the included Node/WebSocket server; offline bot play does not. Each cloud task is already isolated: use the existing checkout rather than creating a worktree.
