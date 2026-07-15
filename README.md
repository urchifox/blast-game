# Blast Game

Browser game built with TypeScript. Game logic is engine-agnostic; [Phaser](https://phaser.io/) implements the renderer behind a small interface. UI uses plain DOM and CSS (with BEM methodology).
Play the deployed build: https://urchifox.github.io/blast-game/

## Architecture Overview

- `src/app.ts`: entry point.
- `src/game-blast/`
  - Domain and game flow:
    - `gameBlast.ts`: main game orchestration — level lifecycle, tile clicks, win/loss UI.
    - `presenter.ts`: field/grid mutations and related animations (select, swap, remove, fill, shuffle, resize).
    - `fieldQueries.ts`: read-only board lookups (tiles, positions, radius/row/column queries) used by orchestration and handlers.
    - `completionManager.ts`: win/loss checks, no-move detection, and shuffle-for-new-move.
    - `progressManager.ts`: score and moves progress wiring.
    - `levelGenerator.ts`: random level parameters (size, goal score, moves).
    - `gameRules.ts`: gameplay rules and scoring (combo thresholds, boosters, points formula).
    - `field.ts`, `grid.ts`, `tile.ts`: model/state and board computations.
    - `config.ts`: layout and animation timing constants.
    - `types.ts`: shared types.
  - Tile click handling:
    - `tile-handlers/tileHandler.ts`: abstract handler contract.
    - `tile-handlers/tileClickManager.ts`: routes clicks to the correct handler.
    - `tile-handlers/tileHandler*.ts`: per-tile-kind click behavior (normal, bomb, dynamite, rockets, etc.).
  - Boosters:
    - `boosters/booster.ts`: booster state and DOM counter wiring.
    - `boosters/boosterHandler.ts`: abstract booster activation contract.
    - `boosters/boosterHandler*.ts`: per-booster behavior (bomb, teleport).
    - `boosters/boosterManager.ts`: routes booster use to the correct handler.
  - Rendering abstraction:
    - `rendering/renderer.ts`: renderer contract.
    - `rendering/phaserRenderer.ts`: Phaser adapter implementing the contract.
    - `rendering/phaserScene.ts`: Phaser scene-specific implementation.
- `src/game-view/`
  - `gameBlastView.ts`: UI wiring (counters, boosters, modals, resize); composes and injects dependencies into `GameBlast`.
  - `assets/style/*.css`: view-specific styles.
- `src/view/`
  - Generic view lifecycle and switching.
- `src/assets/style/`
  - Shared BEM-based styles for reusable UI blocks.
- `src/helpers/`
  - Shared utilities.

## Key Design Decisions

- **Rendering is abstracted behind an interface**
  - The `Renderer` contract isolates game flow from a concrete engine API.
  - Phaser-specific code is constrained to `rendering/phaser*`.
  - Only `Presenter` talks to the renderer and animations manager; `GameBlast` never receives them directly.

- **Domain model is class-based**
  - `Tile`, `Field`, and `Grid` encapsulate state and behavior with explicit responsibilities.
  - `Presenter` performs board mutations and drives matching animations.
  - `FieldQueries` exposes read-only access to the field so click/booster/completion code can query tiles without depending on mutation/render APIs.

- **Game flow is split by responsibility**
  - `GameBlast` coordinates; `CompletionManager`, `ProgressManager`, `LevelGenerator`, and `GameRules` own their slices of logic.

- **Tile and booster behavior use handler abstractions**
  - `TileHandler` and `BoosterHandler` define per-kind/per-booster behavior.
  - `TileClickManager` and `BoosterManager` select and invoke the right handler.
  - Handlers return `TileRemovingInfo` instead of driving side effects through callbacks.

- **Dependencies are injected at construction**
  - `GameView` builds collaborators (`Field`, `Grid`, `FieldQueries`, `Presenter` with renderer and animations manager, `GameRules`, `LevelGenerator`, `ProgressManager`, etc.) and passes the orchestration-facing ones into `GameBlast`.

- **Event-driven game flow**
  - User interaction triggers rule evaluation, model updates, and render updates in sequence.
  - No continuous physics simulation loop is required.

- **BEM for styles and markup**
  - UI blocks (`progress-block`, `points-counter`, `boosters-container`, etc.) use BEM naming for predictability and maintainability.

## How to Run

```bash
npm install
npm run dev
```

Then open **http://localhost:5173/blast-game/**.
