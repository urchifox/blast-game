import { BOOSTER_NAMES } from "../domain/config"
import { Field } from "../domain/field"
import { FieldQueries } from "../domain/fieldQueries"
import { GameRules } from "../domain/gameRules"
import { Grid } from "../domain/grid"
import { Tile } from "../domain/tile"
import {
	AnimationsManagerContract,
	BoosterUIContract,
	BoosterUIMap,
	LayoutUIContract,
	ModalUIContract,
	PresenterContract,
	ProgressUIContract,
	RendererContract,
} from "../types"
import { ActionManager } from "./actionManager"
import { Presenter } from "./presenter"
import { AnimationsManager } from "./animationManager"
import { boosterManagerFactory } from "./boosterManagerFactory"

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
		unselectTile() {},
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
	renderer = createRendererStub(),
	animationsManager = new AnimationsManager(),
	layoutUI = createLayoutUIStub(),
}: {
	field: Field
	fieldQueries: FieldQueries
	grid: Grid
	renderer?: RendererContract
	animationsManager?: AnimationsManagerContract
	layoutUI?: LayoutUIContract
}): PresenterContract {
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

export function createBoosterManagerStubbed(props: {
	gameRules: GameRules
	fieldQueries: FieldQueries
	actionManager: ActionManager
}) {
	const boosterUIMap = BOOSTER_NAMES.reduce((acc, name) => {
		acc[name] = createBoosterUIStub()
		return acc
	}, {} as BoosterUIMap)

	const boosterManager = boosterManagerFactory({
		...props,
		boosterUIMap,
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

export type Deferred = {
	promise: Promise<void>
	resolve: () => void
	reject: () => void
}

export function createDeferred(): Deferred {
	let resolve: Deferred["resolve"] = () => undefined
	let reject: Deferred["reject"] = () => undefined
	const promise = new Promise<void>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

export function createDeferredCalls() {
	const calls: Array<Deferred> = []
	return {
		calls,
		next: () => {
			const deferred = createDeferred()
			calls.push(deferred)
			return deferred.promise
		},
	}
}

/** `isSettled` is only reliable after `flushPromises()`. */
export function trackSettled(promise: Promise<unknown>) {
	const state = {
		/** is only reliable after `flushPromises()`. */
		isSettled: false,
	}
	promise
		.finally(() => {
			state.isSettled = true
		})
		.catch(() => {})
	return state
}

/** Requires `vi.useFakeTimers()`. */
export function flushPromises() {
	return vi.advanceTimersByTimeAsync(0)
}
