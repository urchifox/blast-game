# Blast Game

Browser game built with TypeScript. Game logic is engine-agnostic; [Phaser](https://phaser.io/) implements the renderer behind a small interface. UI uses plain DOM and CSS (with BEM methology).
Play the deployed build: https://urchifox.github.io/blast-game/

## Architecture Overview

- `src/game-blast/`
  - Domain and game flow:
    - `gameBlast.ts`: main game orchestration and rules flow.
    - `field.ts`, `grid.ts`, `tile.ts`: model/state and board computations.
    - `booster.ts`: booster rules and state.
    - `config.ts`: gameplay constants.
  - Rendering abstraction:
    - `rendering/renderer.ts`: renderer contract.
    - `rendering/phaserRenderer.ts`: Phaser adapter implementing the contract.
    - `rendering/phaserScene.ts`: Phaser scene-specific implementation.
- `src/game-view/`
  - `gameBlastView.ts`: UI wiring (counters, boosters, modals, resize).
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

- **Domain model is class-based**
  - `Tile`, `Field`, and `Grid` encapsulate state and behavior with explicit responsibilities.

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
