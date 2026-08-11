# Blast Game

Blast Game is a browser puzzle game built with TypeScript, Phaser, and plain DOM/CSS.
Players clear connected tiles, earn points, and use boosters to complete each level within a limited number of moves.

[Play the deployed game](https://urchifox.github.io/blast-game/)

## Architecture

The project separates game rules from presentation:

- The **domain layer** owns board state, rules, scoring, level generation, and completion checks. It does not depend on Phaser or the DOM.
- The **game layer** coordinates user actions and domain operations. Dependencies are assembled through factories.
- The **rendering layer** adapts the game to Phaser behind a small interface.
- The **view layer** manages DOM controls, counters, modals, and view lifecycle.

This keeps the core game logic independent from the rendering engine and browser UI.

## Project Structure

- `src/game-blast/` — the complete game module: orchestration, domain logic, rendering, UI, and game assets.
- `src/game-blast/domain/` — engine-independent game rules and state.
- `src/game-blast/rendering/` — Phaser integration.
- `src/game-blast/view/` — game-specific DOM UI.
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
