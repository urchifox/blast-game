import { BoosterCounter } from "../domain/boosterCounter"
import { BoosterUseHandler } from "../domain/boosterUseHandler"
import { BOOSTER_NAMES } from "../domain/config"
import { FieldQueries } from "../domain/fieldQueries"
import { GameRules } from "../domain/gameRules"
import { Tile } from "../domain/tile"
import { BoosterName } from "../domain/types"
import { BoosterUIContract, PresenterContract } from "../types"
import { ActionManager } from "./actionManager"
import { Booster } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { BoosterManager } from "./boosterManager"

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

export function createBoosterManagerStubbed(props: {
	gameRules: GameRules
	fieldQueries: FieldQueries
	actionManager: ActionManager
}) {
	const boosterUseHandler = new BoosterUseHandler({
		gameRules: props.gameRules,
		fieldQueries: props.fieldQueries,
	})

	const boostersHandlersMap = BOOSTER_NAMES.reduce(
		(acc, name) => {
			acc[name] = createBoosterHandlerStubbed({
				...props,
				boosterUseHandler,
				name,
			})
			return acc
		},
		{} as Record<BoosterName, BoosterHandler>
	)

	const boosterManager = new BoosterManager({
		boostersHandlersMap: boostersHandlersMap,
	})

	return boosterManager
}
