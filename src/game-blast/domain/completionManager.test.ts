import { Counter } from "../../helpers/counter"
import { CompletionManager } from "./completionManager"
import { GameRules } from "./gameRules"
import { ProgressCounter } from "./progressCounter"
import { createFieldComponentsStubbed, createTilesProps } from "./testHelpers"
import { TileKind, TileProps } from "./tile"
import { GameCompletionStatus } from "./types"

const GRID_SIZE = { columns: 3, rows: 3 }
const TILES_KINDS_WITH_MATCH = [
	"red",
	"red",
	"yellow",

	"red",
	"yellow",
	"blue",

	"yellow",
	"blue",
	"yellow",
] satisfies Array<TileKind>
const TILES_KINDS_WITH_NO_MATCH = [
	"red",
	"yellow",
	"red",

	"blue",
	"red",
	"blue",

	"yellow",
	"blue",
	"yellow",
] satisfies Array<TileKind>
const TILES_KINDS_WITH_SPECIAL_TILE = [
	"red",
	"yellow",
	"red",

	"blue",
	"bomb",
	"blue",

	"yellow",
	"blue",
	"yellow",
] satisfies Array<TileKind>
const tilesPropsWithMatch = createTilesProps({
	...GRID_SIZE,
	kinds: TILES_KINDS_WITH_MATCH,
})
const tilesPropsWithNoMatch = createTilesProps({
	...GRID_SIZE,
	kinds: TILES_KINDS_WITH_NO_MATCH,
})
const tilesPropsWithSpecialTile = createTilesProps({
	...GRID_SIZE,
	kinds: TILES_KINDS_WITH_SPECIAL_TILE,
})

function createCompletionManager(tileProps: Array<TileProps>) {
	const { fieldQueries } = createFieldComponentsStubbed({
		gridSize: GRID_SIZE,
		tilesProps: new Set(tileProps),
	})

	const progressCounter = new ProgressCounter({
		scoreCounter: new Counter({ startValue: 0, endValue: 50 }),
		movesCounter: new Counter({ startValue: 3, endValue: 0 }),
		gameRules: new GameRules(),
	})

	const completionManager = new CompletionManager({
		gameRules: new GameRules(),
		fieldQueries: fieldQueries,
		progressCounter: progressCounter,
	})

	return { completionManager, progressCounter }
}

describe("completion manager", () => {
	it.each([
		{
			removedTilesCount: 2,
			repeatCount: 2,
			completionStatus: GameCompletionStatus.IN_PROGRESS,
			isGameCompleted: false,
		},
		{
			removedTilesCount: 3,
			repeatCount: 1,
			completionStatus: GameCompletionStatus.IN_PROGRESS,
			isGameCompleted: false,
		},
		{
			removedTilesCount: 5,
			repeatCount: 1,
			completionStatus: GameCompletionStatus.WIN,
			isGameCompleted: true,
		},
		{
			removedTilesCount: 3,
			repeatCount: 3,
			completionStatus: GameCompletionStatus.WIN,
			isGameCompleted: true,
		},
		{
			removedTilesCount: 2,
			repeatCount: 3,
			completionStatus: GameCompletionStatus.LOSS,
			isGameCompleted: true,
		},
	])(
		"check status after moves",
		({ removedTilesCount, repeatCount, completionStatus, isGameCompleted }) => {
			const { completionManager, progressCounter } =
				createCompletionManager(tilesPropsWithMatch)
			for (let i = 0; i < repeatCount; i++) {
				progressCounter.processMove(removedTilesCount)
			}
			expect(completionManager.checkGameCompletion()).toBe(completionStatus)
			expect(completionManager.isGameCompleted()).toBe(isGameCompleted)
		}
	)

	it("check shuffle isn't needed if there are matches", () => {
		const { completionManager } = createCompletionManager(tilesPropsWithMatch)
		expect(completionManager.isShuffleNeeded()).toBe(false)
	})

	it("check shuffle needed if there are no matches", () => {
		const { completionManager } = createCompletionManager(tilesPropsWithNoMatch)
		expect(completionManager.isShuffleNeeded()).toBe(true)
	})

	it("check shuffle isn't needed if special tile", () => {
		const { completionManager } = createCompletionManager(
			tilesPropsWithSpecialTile
		)
		expect(completionManager.isShuffleNeeded()).toBe(false)
	})

	it("loss after unsuccessful shuffle", () => {
		const { completionManager } = createCompletionManager(tilesPropsWithNoMatch)

		const statusBeforeShuffle = completionManager.checkGameCompletion()
		const isCompletedBeforeShuffle = completionManager.isGameCompleted()
		completionManager.updateShuffleAttempts()

		expect(statusBeforeShuffle).toBe(GameCompletionStatus.IN_PROGRESS)
		expect(isCompletedBeforeShuffle).toBe(false)
		expect(completionManager.checkGameCompletion()).toBe(
			GameCompletionStatus.LOSS
		)
		expect(completionManager.isGameCompleted()).toBe(true)
	})

	it("continues after a shuffle when a move exists", () => {
		const { completionManager } = createCompletionManager(tilesPropsWithMatch)

		completionManager.updateShuffleAttempts()

		expect(completionManager.checkGameCompletion()).toBe(
			GameCompletionStatus.IN_PROGRESS
		)
		expect(completionManager.isGameCompleted()).toBe(false)
	})
})
