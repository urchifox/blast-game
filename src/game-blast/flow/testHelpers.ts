import { BoosterCounter } from "../domain/boosterCounter"
import { BoosterUseHandler } from "../domain/boosterUseHandler"
import { GameRules } from "../domain/gameRules"
import { Tile } from "../domain/tile"
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

export function createActionManagerStubbed(): ActionManager {
	return new ActionManager({
		presenter: createPresenterStub(),
	})
}

export function createBoosterHandlerStubbed({
	boosterUseHandler,
	gameRules,
	actionManager,
	name,
}: {
	boosterUseHandler: BoosterUseHandler
	gameRules: GameRules
	actionManager: ActionManager
	name: BoosterName
}) {
	const boosterUI = createBoosterUIStub()

	const boosterCounter = new BoosterCounter({
		startValue: gameRules.BOOSTER_INITIAL_VALUE[name],
		endValue: 0,
	})

	const booster = new Booster({
		boosterCounter: boosterCounter,
		boosterUI: boosterUI,
	})

	const boosterHandler = new BoosterHandler({
		name,
		boosterUseHandler,
		booster,
		actionManager,
	})

	return boosterHandler
}
