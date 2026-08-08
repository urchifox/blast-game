# Blast Game

Browser game built with TypeScript. Game logic is engine-agnostic; [Phaser](https://phaser.io/) implements the renderer behind a small interface. UI uses plain DOM and CSS (with BEM methodology).
Play the deployed build: https://urchifox.github.io/blast-game/

## Architecture Overview

- `src/app.ts`: entry point — boots `LoadingScreen`, `ViewManager`, and mounts `GameView`.
- `src/game-blast/`
  - Domain and game flow:
    - `game.ts`: main game orchestration — level lifecycle, tile clicks, win/loss.
    - `gameFactory.ts`: composes domain collaborators and returns a `Game` instance.
    - `presenter.ts`: presenter contract (board mutations and animations).
    - `gamePresenter.ts`: concrete presenter — field/grid mutations and matching animations (select, swap, remove, fill, shuffle, resize).
    - `layout.ts`: board/tile sizing from the game container and config.
    - `fieldQueries.ts`: read-only board lookups (tiles, positions, radius/row/column queries) used by orchestration and handlers.
    - `completionManager.ts`: win/loss checks, no-move detection, and shuffle-for-new-move.
    - `progressManager.ts`: score and moves progress wiring.
    - `levelGenerator.ts`: random level parameters (size, goal score, moves).
    - `gameRules.ts`: gameplay rules and scoring (combo thresholds, boosters, points formula).
    - `field.ts`, `grid.ts`, `tile.ts`: model/state and board computations.
    - `tilesCollector.ts`: collects unique tiles/positions during removal cascades.
    - `config.ts`: layout and animation timing constants.
    - `types.ts`: shared types.
  - Tile click handling:
    - `tile-handlers/tileHandler.ts`: abstract handler contract.
    - `tile-handlers/tileClickManager.ts`: routes clicks to the correct handler.
    - `tile-handlers/tileClickManagerFactory.ts`: wires tile handlers into the manager.
    - `tile-handlers/tileHandler*.ts`: per-tile-kind click behavior (normal, bomb, dynamite, rockets, etc.).
  - Boosters:
    - `boosters/booster.ts`: booster state and DOM counter wiring.
    - `boosters/boosterHandler.ts`: abstract booster activation contract.
    - `boosters/boosterHandler*.ts`: per-booster behavior (bomb, teleport).
    - `boosters/boosterManager.ts`: routes booster use to the correct handler.
    - `boosters/boosterManagerFactory.ts`: wires booster handlers into the manager.
  - Rendering abstraction:
    - `rendering/renderer.ts`: renderer contract.
    - `rendering/phaserRenderer.ts`: Phaser adapter implementing the contract.
    - `rendering/phaserScene.ts`: Phaser scene-specific implementation.
- `src/game-view/`
  - `gameView.ts`: UI wiring (counters, boosters, modals, resize); creates `Game` via `gameFactory`.
  - `assets/style/*.css`: view-specific styles.
- `src/view/`
  - Generic view lifecycle and switching (`View`, `ViewManager`, `LoadingScreen`).
- `src/assets/style/`
  - Shared BEM-based styles for reusable UI blocks.
- `src/helpers/`
  - Shared utilities (DOM, progress, animations, random, arrays, time).

## Key Design Decisions

- **Rendering is abstracted behind an interface**
  - The `Renderer` contract isolates game flow from a concrete engine API.
  - Phaser-specific code is constrained to `rendering/phaser*`.
  - Only `GamePresenter` talks to the renderer and animations manager; `Game` depends on the `Presenter` contract.

- **Domain model is class-based**
  - `Tile`, `Field`, and `Grid` encapsulate state and behavior with explicit responsibilities.
  - `GamePresenter` performs board mutations and drives matching animations.
  - `Layout` owns board sizing; `FieldQueries` exposes read-only access to the field so click/booster/completion code can query tiles without depending on mutation/render APIs.

- **Game flow is split by responsibility**
  - `Game` coordinates; `CompletionManager`, `ProgressManager`, `LevelGenerator`, and `GameRules` own their slices of logic.

- **Tile and booster behavior use handler abstractions**
  - `TileHandler` and `BoosterHandler` define per-kind/per-booster behavior.
  - `TileClickManager` and `BoosterManager` select and invoke the right handler.
  - Factories (`tileClickManagerFactory`, `boosterManagerFactory`) assemble handlers.
  - Handlers return `TileRemovingInfo` instead of driving side effects through callbacks.

- **Dependencies are injected at construction**
  - `gameFactory` builds collaborators (`Field`, `Grid`, `Layout`, `FieldQueries`, `GamePresenter` with renderer and animations manager, `GameRules`, `LevelGenerator`, `ProgressManager`, managers, etc.) and passes the orchestration-facing ones into `Game`.
  - `GameView` supplies DOM callbacks and the game container; it does not compose domain internals itself.

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
