import { BoosterCounter } from "../domain/boosterCounter"
import { BoosterUseHandler } from "../domain/boosterUseHandler"
import { GameRules } from "../domain/gameRules"
import { createField } from "../domain/testHelpers"
import { Tile, TileProps } from "../domain/tile"
import { BoosterName } from "../domain/types"
import { BoosterUIContract, PresenterContract } from "../types"
import { ActionManager } from "./actionManager"
import { Booster } from "./booster"
import { BoosterHandler } from "./boosterHandler"

export function createBoosterUIStub(): BoosterUIContract {
	return {
		updateBoosterCounter() {},
		toggleBoosterButtonActive() {},
	}
}

export function createPresenterStub(): PresenterContract {
	let nextId = 1000

	return {
		init: async () => {},
		destroy() {},
		clear: async () => {},
		create: async () => {},
		updateGameSize() {},
		shuffleField: async () => {},
		processRemovedTiles: async () => {},
		waitForTileAnimations: async () => {},
		selectTile() {},
		swapTiles: async () => {},
		addTile({ kind, position }) {
			return new Tile({ kind, position, id: String(nextId++) })
		},
		renderTile: async () => {},
		removeTilesFromCenter: async () => {},
	}
}

export function createBoosterHandler({
	columns,
	rows,
	tilesProps,
	name,
}: {
	columns: number
	rows: number
	tilesProps: Set<TileProps>
	name: BoosterName
}) {
	const gameRules = new GameRules()
	const { grid, field, fieldQueries } = createField({
		columns,
		rows,
		tilesProps,
	})

	const boosterUseHandler = new BoosterUseHandler({
		gameRules,
		fieldQueries,
	})
	const actionManager = new ActionManager({
		presenter: createPresenterStub(),
	})

	const booster = new Booster({
		boosterCounter: new BoosterCounter({
			startValue: gameRules.BOOSTER_INITIAL_VALUE[name],
			endValue: 0,
		}),
		boosterUI: createBoosterUIStub(),
	})

	const boosterHandler = new BoosterHandler({
		name,
		boosterUseHandler,
		booster,
		actionManager,
	})

	return {
		grid,
		field,
		fieldQueries,
		boosterHandler,
	}
}
