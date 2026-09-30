import { Counter } from "../../helpers/counter"
import { CompletionManager } from "./completionManager"
import { GameRules } from "./gameRules"
import { ProgressCounter } from "./progressCounter"
import { createField } from "./testHelpers"
import { TileProps } from "./tile"
import { GameCompletionStatus } from "./types"

function createCompletionManager(tileProps: Array<TileProps>) {
	const { fieldQueries } = createField({
		columns: 3,
		rows: 3,
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

const tilesPropsWithMatch = [
	{
		kind: "red",
		position: { row: 0, column: 0 },
		id: "1",
	},
	{
		kind: "red",
		position: { row: 1, column: 0 },
		id: "2",
	},
	{
		kind: "yellow",
		position: { row: 2, column: 0 },
		id: "3",
	},
	{
		kind: "red",
		position: { row: 0, column: 1 },
		id: "4",
	},
	{
		kind: "yellow",
		position: { row: 1, column: 1 },
		id: "5",
	},
	{
		kind: "blue",
		position: { row: 2, column: 1 },
		id: "6",
	},
	{
		kind: "yellow",
		position: { row: 0, column: 2 },
		id: "7",
	},
	{
		kind: "blue",
		position: { row: 1, column: 2 },
		id: "8",
	},
	{
		kind: "yellow",
		position: { row: 2, column: 2 },
		id: "9",
	},
] satisfies Array<TileProps>

const tilesPropsWithNoMatch = [
	{
		kind: "red",
		position: { row: 0, column: 0 },
		id: "1",
	},
	{
		kind: "blue",
		position: { row: 1, column: 0 },
		id: "2",
	},
	{
		kind: "yellow",
		position: { row: 2, column: 0 },
		id: "3",
	},
	{
		kind: "yellow",
		position: { row: 0, column: 1 },
		id: "4",
	},
	{
		kind: "red",
		position: { row: 1, column: 1 },
		id: "5",
	},
	{
		kind: "blue",
		position: { row: 2, column: 1 },
		id: "6",
	},
	{
		kind: "red",
		position: { row: 0, column: 2 },
		id: "7",
	},
	{
		kind: "blue",
		position: { row: 1, column: 2 },
		id: "8",
	},
	{
		kind: "yellow",
		position: { row: 2, column: 2 },
		id: "9",
	},
] satisfies Array<TileProps>

const tilesPropsWithSpecialTile = [
	{
		kind: "red",
		position: { row: 0, column: 0 },
		id: "1",
	},
	{
		kind: "blue",
		position: { row: 1, column: 0 },
		id: "2",
	},
	{
		kind: "yellow",
		position: { row: 2, column: 0 },
		id: "3",
	},
	{
		kind: "yellow",
		position: { row: 0, column: 1 },
		id: "4",
	},
	{
		kind: "bomb",
		position: { row: 1, column: 1 },
		id: "5",
	},
	{
		kind: "blue",
		position: { row: 2, column: 1 },
		id: "6",
	},
	{
		kind: "red",
		position: { row: 0, column: 2 },
		id: "7",
	},
	{
		kind: "blue",
		position: { row: 1, column: 2 },
		id: "8",
	},
	{
		kind: "yellow",
		position: { row: 2, column: 2 },
		id: "9",
	},
] satisfies Array<TileProps>

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
