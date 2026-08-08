# Blast Game

Browser game built with TypeScript. Game logic is engine-agnostic; [Phaser](https://phaser.io/) implements the renderer behind a small interface. UI uses plain DOM and CSS (with BEM methodology).
Play the deployed build: https://urchifox.github.io/blast-game/

## Architecture Overview

- `src/app.ts`: entry point — boots `LoadingScreen`, `ViewManager`, and mounts `GameView`.
- `src/game-blast/`
  - Domain (`domain/`):
    - `tile.ts`, `field.ts`, `grid.ts`: game entities, board state, and grid computations.
    - `fieldQueries.ts`: read-only board lookups, including connected tiles and radius/row/column queries.
    - `tilesCollector.ts`: collects unique tiles and positions during removal cascades.
    - `tileClickHandler.ts`: evaluates tile clicks, connections, and combo rewards without presentation side effects.
    - `completionManager.ts`: win/loss checks, no-move detection, and shuffle-attempt rules.
    - `levelGenerator.ts`: generates level dimensions, target score, and move limits.
    - `gameRules.ts`: gameplay and scoring rules.
    - `config.ts`: tile kinds and booster names.
    - `types.ts`: domain-owned shared types.
  - Application and presentation:
    - `game.ts`: main game orchestration — level lifecycle, tile clicks, win/loss.
    - `gameFactory.ts`: composes domain collaborators and returns a `Game` instance.
    - `presenter.ts`: presenter contract (board mutations and animations).
    - `gamePresenter.ts`: concrete presenter — field/grid mutations and matching animations (select, swap, remove, fill, shuffle, resize).
    - `layout.ts`, `layoutCalculator.ts`: board and tile sizing from the game container.
    - `progressManager.ts`: score and moves progress wiring.
    - `animationRules.ts`: animation timing and speed constants.
    - `renderingRules.ts`: tile layout and sizing constants.
    - `types.ts`: application and presentation coordination types.
  - Tile click handling:
    - `tile-handlers/tileClickManager.ts`: coordinates pure click evaluation with presenter effects.
    - `tile-handlers/tileClickManagerFactory.ts`: wires the domain click handler into the manager.
  - Boosters:
    - `boosters/booster.ts`: booster inventory state and counter updates.
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
  - Project-wide shared utilities.

## Key Design Decisions

- **Rendering is abstracted behind an interface**
  - The `Renderer` contract isolates game flow from a concrete engine API.
  - Phaser-specific code is constrained to `rendering/phaser*`.
  - Only `GamePresenter` talks to the renderer and animations manager; `Game` depends on the `Presenter` contract.

- **Domain model is class-based**
  - Domain code is isolated in `src/game-blast/domain/` and remains independent from rendering, DOM, and browser APIs.
  - `Tile`, `Field`, and `Grid` encapsulate state and behavior with explicit responsibilities.
  - `GamePresenter` performs board mutations and drives matching animations.
  - `Layout` owns board sizing; `FieldQueries` exposes read-only access to the field so click/booster/completion code can query tiles without depending on mutation/render APIs.

- **Game flow is split by responsibility**
  - `Game` coordinates; `CompletionManager`, `ProgressManager`, `LevelGenerator`, and `GameRules` own their slices of logic.

- **Tile and booster behavior use handler abstractions**
  - The domain `TileClickHandler` evaluates tile behavior and returns data without presentation side effects.
  - `TileClickManager` coordinates that result with the presenter.
  - `BoosterHandler` implementations define per-booster behavior, while `BoosterManager` routes activation.
  - Factories (`tileClickManagerFactory`, `boosterManagerFactory`) assemble the collaborators.

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
