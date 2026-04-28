# Blast Game

Browser game built with TypeScript and Phaser for rendering.

## Architecture Overview

- `src/game-blast/`
  - Domain and game flow:
    - `gameBlast.ts`: main game orchestration and rules flow.
    - `field.ts`, `grid.ts`, `tile.ts`: model/state and board computations.
    - `config.ts`: gameplay constants.
  - Rendering abstraction:
    - `rendering/renderer.ts`: renderer contract (interface boundary).
    - `rendering/phaserRenderer.ts`: Phaser adapter implementing the contract.
    - `rendering/phaserScene.ts`: Phaser scene-specific implementation.
- `src/game-view/`
  - `gameBlastView.ts`: UI-level wiring (DOM counters, modals, resize handlers).
  - `assets/style/*.css`: view-specific styles.
- `src/view/`
  - Generic view lifecycle and switching (`view.ts`, `viewManager.ts`).
- `src/assets/style/`
  - Shared BEM-based styles for reusable UI blocks.
- `src/helpers/`
  - Shared utility functions (`dom`, `random`, `time`).

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
Or just visit https://urchifox.github.io/blast-game/
