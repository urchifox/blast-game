# Blast Game

Blast Game is a browser puzzle game built with TypeScript, Phaser, and plain DOM/CSS.
Players clear connected tiles, earn points, and use boosters to complete each level within a limited number of moves.

[Play the deployed game](https://urchifox.github.io/blast-game/)

## Architecture

The project separates game rules from presentation:

- The **domain layer** owns board state, rules, scoring, level generation, and completion checks. It does not depend on Phaser or the DOM.
- The **application layer** is centered on `Game`, which coordinates level lifecycle, player input, action results, shuffling, completion, and modal flow.
- The **flow layer** provides the action, booster, progress, and presenter collaborators used by the application layer.
- The **rendering layer** adapts the game to Phaser behind a small interface.
- The **view layer** manages DOM controls, counters, modals, layout calculations, and view lifecycle.

Dependencies are assembled through factories, keeping the core game logic independent from the rendering engine and browser UI.

## Project Structure

- `src/game-blast/` — the complete game module.
- `src/game-blast/game.ts` — application orchestrator for level lifecycle and player actions.
- `src/game-blast/gameFactory.ts` — composition root that constructs and connects game collaborators.
- `src/game-blast/types.ts` — UI, presenter, layout, and renderer port contracts.
- `src/game-blast/domain/` — engine-independent game rules and state.
- `src/game-blast/flow/` — action execution, boosters, progress, presentation coordination, and animation policy.
- `src/game-blast/rendering/` — Phaser integration.
- `src/game-blast/view/` — game-specific DOM UI and layout calculation.
- `src/game-blast/assets/` — game-specific images and styles.
- `src/view/` — reusable view lifecycle and loading screen.
- `src/helpers/` — shared utilities.
- `src/assets/` — global assets and base styles.
- `src/app.ts` — application entry point.

## How to Run

```bash
npm install
npm run dev
```

The development server prints the local URL after startup.
