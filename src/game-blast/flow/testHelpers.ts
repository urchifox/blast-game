import { BoosterCounter } from "../domain/boosterCounter"
import { BoosterUseHandler } from "../domain/boosterUseHandler"
import { BOOSTER_NAMES } from "../domain/config"
import { Field } from "../domain/field"
import { FieldQueries } from "../domain/fieldQueries"
import { GameRules } from "../domain/gameRules"
import { Grid } from "../domain/grid"
import { Tile } from "../domain/tile"
import { BoosterName } from "../domain/types"
import {
	BoosterUIContract,
	LayoutUIContract,
	ModalUIContract,
	PresenterContract,
	ProgressUIContract,
	RendererContract,
} from "../types"
import { ActionManager } from "./actionManager"
import { Booster } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { BoosterManager } from "./boosterManager"
import { Presenter } from "./presenter"
import { AnimationsManager } from "./animationManager"

export function createBoosterUIStub(): BoosterUIContract {
	return {
		updateBoosterCounter() {},
		toggleBoosterButtonActive() {},
	}
}

export function createRendererStub(): RendererContract {
	return {
		init: async () => {},
		destroy: () => {},
		resize: () => {},
		clearTiles: async () => {},
		setOnTileClick: () => {},
		updateFieldOffsets: () => {},
		renderTiles: async () => {},
		removeTile: async () => {},
		fallTilesToCurrentPositions: async () => {},
		shuffleTiles: async () => {},
		swapTiles: async () => {},
		selectTile: async () => {},
		unselectTile: async () => {},
	}
}

export function createLayoutUIStub(): LayoutUIContract {
	return {
		getSnapshot: () => ({
			gridWidth: 0,
			gridHeight: 0,
			tileWidth: 0,
			tileHeight: 0,
			tileGapX: 0,
			tileGapY: 0,
		}),
		updateSizes: () => ({
			gridWidth: 0,
			gridHeight: 0,
			tileWidth: 0,
			tileHeight: 0,
			tileGapX: 0,
			tileGapY: 0,
		}),
		getGameContainerOffset: () => ({ offsetX: 0, offsetY: 0 }),
		setGameContainerSize: () => {},
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

export function createPresenterStubbed({
	field,
	fieldQueries,
	grid,
}: {
	field: Field
	fieldQueries: FieldQueries
	grid: Grid
}): PresenterContract {
	const animationsManager = new AnimationsManager()
	const renderer = createRendererStub()
	const layoutUI = createLayoutUIStub()

	return new Presenter({
		layoutUI,
		field,
		fieldQueries,
		grid,
		renderer,
		animationsManager,
	})
}

export function createActionManagerStubbed({
	presenter = createPresenterStub(),
}: {
	presenter?: PresenterContract
}): ActionManager {
	return new ActionManager({
		presenter: presenter,
	})
}

export function createBoosterHandlerStubbed({
	boosterUseHandler,
	gameRules,
	actionManager,
	name,
	boosterUI,
}: {
	boosterUseHandler: BoosterUseHandler
	gameRules: GameRules
	actionManager: ActionManager
	name: BoosterName
	boosterUI: BoosterUIContract
}) {
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
			const boosterUI = createBoosterUIStub()
			acc[name] = createBoosterHandlerStubbed({
				...props,
				boosterUseHandler,
				name,
				boosterUI,
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

export function createProgressUIStub(): ProgressUIContract {
	return {
		updateMovesCounter() {},
		updateScoreCounter() {},
	}
}

export function createModalUIStub(): ModalUIContract {
	return {
		open() {},
	}
}
