# Luma Tide

A playable, single-player 3D fishing and exploration adventure for the browser, built from the supplied game design document. Explore a low-poly archipelago, catch fish, dive for relics, and build a better little boat.

## Play

**[Play Luma Tide](https://adam-vozzo.github.io/game12/)**

The game opens directly on the ocean. Press **F** or tap **Cast line** to try your first catch; **H** opens the guide.

### GitHub Pages

The repository includes a ready-to-play export in `docs/`. In **Settings → Pages**, use **Deploy from a branch**, select **main**, and select **/docs**. The game is served at `https://adam-vozzo.github.io/game12/`.

To publish game changes, rebuild the Pages export and commit it with the source changes:

```sh
npm ci
npm run build:pages
npm run preview:pages
```

The preview runs at `http://localhost:4173/game12/`. The Pages build sets the `/game12` route and asset prefix, includes `.nojekyll`, and verifies the generated asset paths. It replaces only files recorded in its generated manifest, preserving the design document and other authored documentation. Push the updated source and `docs/` to `main` to update the live game. No custom GitHub Actions workflow is required.

### Run locally

Node.js 22.13 or newer is required. The recommended version is recorded in `.node-version`. The build script lets successful builds exit gracefully on Windows to avoid a native worker shutdown race in the build tool; build failures still return an error.

```sh
npm ci
npm run dev
```

Open the local URL printed by the server. For the production export:

```sh
npm run build
npm start
```

`npm start` serves the game at `http://localhost:4173`. Host the contents of `dist/client` on a static host to publish elsewhere. The game needs WebGL 2 and should be served over HTTP(S), rather than opened as a local HTML file. It requires no API keys, backend, sign-in, or external asset service. Sites access controls belong to the host, not the game.

## What is playable

- Seven islands across six biomes, with harbours, a lighthouse, ruins, volcanic terrain, fishing grounds, fog-of-war charting, and navigation markers.
- A moving 3D ocean, boat buoyancy, directional movement, collisions, fuel, hull damage, and a continuous day–night cycle.
- An underwater fishing game: guide a hook into a fish, then alternate reeling and easing off to keep tension safe.
- Twelve fish species, seeded variation in weight and value, classic/dappled/opalescent variants, gear requirements, and luminous night species.
- Free swimming with depth limits and oxygen; collect pearls, kelp, scrap, and three persistent story relics.
- A spatial cargo grid with rotation and relocation, damaged slots, fish freshness, and four hold sizes.
- Harbour selling, four island orders with freshness bonuses, four equipment tracks with three upgrades each, refuelling, repairs, rest, lure crafting, and cooking buffs.
- A journal, field guide, discovery rewards, and an ending choice at The Quiet Deep. Free exploration continues afterward.
- Keyboard, mouse, touch joystick, touch depth controls, hold-to-reel input, and standard gamepad support.
- Synthesized ocean audio, reduced motion, lower-resolution rendering, and a relaxed mode without resource penalties.
- Device-local autosave, manual save, and validated JSON backup import/export.

## Controls

| Action                  | Keyboard / mouse                    | Touch                  | Standard gamepad       |
| ----------------------- | ----------------------------------- | ---------------------- | ---------------------- |
| Sail / swim / move hook | WASD / arrows; mouse aims hook      | Joystick / touch water | Left stick             |
| Cast / collect          | F                                   | Cast line / Collect    | A                      |
| Reel                    | Hold Space; release to ease tension | Hold the reel button   | Hold RT                |
| Dive / surface          | E                                   | Dive / Surface         | B                      |
| Swim down / up          | Q / Space                           | Down / Up buttons      | RB / LB                |
| Dock                    | R near a dock                       | Dock prompt            | Select the dock prompt |
| Cargo / chart / journal | I / M / J                           | HUD buttons            | X / Y; journal via UI  |
| Guide / pause           | H / Escape                          | Help / Settings        | Start pauses           |

Menus use keyboard focus and pause the simulation. Focused buttons also support Enter/Space. The help dialog explains the complete loop. Touch controls appear automatically on coarse-pointer devices and can be toggled in Settings. Optional lures are configured in Settings and consumed by the visible Cast line button.

## Saving and recovery

Progress is stored under `luma-tide-v1` in this origin's `localStorage`, every 20 seconds and after important transactions. Saves are per browser and per site address; export a backup to move between devices or hosts. Importing a valid backup replaces the active voyage. If storage is disabled, the game remains playable and exposes manual backup export.

Running out of fuel leaves a slow rowing speed. Docking provides emergency fuel. Running out of oxygen returns the player to Littlehaven, removes newly collected dive cargo, and charges up to 15 coins; prior cargo and story relics remain. Relaxed mode removes these resource penalties.

## Code and validation

- `game/engine.ts`: deterministic simulation, economy, fishing, diving, inventory, save validation, and progression.
- `game/data.ts`: islands, species, equipment, and relic content.
- `game/world.ts`: Three.js renderer; static island meshes are merged by material to reduce draw calls.
- `app/page.tsx`: accessible overlays, input routing, autosave, gamepad support, and optional WebMCP integration.
- `game/chart.tsx`, `game/controls.tsx`, `game/audio.ts`: navigation map, touch controls, and synthesized sound.
- `tests/game.test.cjs`: gameplay and persistence regression tests.

```sh
npm run typecheck
npm test
npm run build
```

Automated tests cover the complete catch–sell–upgrade loop, gear gates, day/night species, tension failure, cargo placement and rotation, transactions, freshness, deliveries, dive limits and recovery, relic completion, crafting, relaxed mode, fuel recovery, pause, deterministic generation, and save validation. `docs/github-actions-check.example.yml` contains an optional CI configuration that repeats type checking, tests, and the production build. To enable it, add it as `.github/workflows/check.yml` using a GitHub sign-in with workflow permission. The sign-in used for this implementation could push source but could not create workflows, so CI is not enabled automatically.

## Scope and remaining work

This is a complete playable browser adaptation, not the multi-year PC/console production described in the GDD. It uses seven authored islands instead of twenty sea tiles, geometric models and synthesized audio instead of a production asset pipeline, a compact relic story, and freshness bonuses instead of expiring contracts. Fish variation is constrained rather than an unlimited modular-species generator. Dynamic weather, predatory fauna, toxic vents, sail/wind simulation, a separate skill tree, full NPC conversations, and console platform integration are not implemented.

Validation covers compilation, static production output, and 22 automated simulation tests. The GitHub Pages export was also checked in a browser at `/game12/`: the 3D scene rendered, casting entered fishing mode, and the phone-sized layout displayed its touch controls without browser errors. Physical-device performance, touch ergonomics, and gamepad models still need hands-on checks. Optional WebMCP tools are feature-detected.

The original design brief is preserved in `docs/design-document.md`.
