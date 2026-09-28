import { Counter } from "../../helpers/counter"
import { CompletionManager } from "./completionManager"
import { Field } from "./field"
import { FieldQueries } from "./fieldQueries"
import { GameRules } from "./gameRules"
import { Grid } from "./grid"
import { ProgressCounter } from "./progressCounter"
import { Tile } from "./tile"
import { GameCompletionStatus } from "./types"

let completionManager: CompletionManager
let progressCounter: ProgressCounter
beforeEach(() => {
	const grid = new Grid()
	grid.createGrid({ columns: 3, rows: 3 })

	const randomizationFunction = () => 0
	let nextId = 1
	const createId = () => String(nextId++)

	const field = new Field({
		getGridSnapshot: grid.getSnapshot.bind(grid),
		randomizationFunction,
		createId,
	})
	vi.spyOn(field, "getTiles").mockReturnValue(expectedGeneratedTiles)
	const fieldQueries = new FieldQueries({ field, grid })

	progressCounter = new ProgressCounter({
		scoreCounter: new Counter({ startValue: 0, endValue: 50 }),
		movesCounter: new Counter({ startValue: 3, endValue: 0 }),
		gameRules: new GameRules(),
	})

	completionManager = new CompletionManager({
		gameRules: new GameRules(),
		fieldQueries: fieldQueries,
		progressCounter: progressCounter,
	})
})

afterEach(() => {
	completionManager.clear()
})

const expectedGeneratedTiles: Array<Tile> = [
	new Tile({
		kind: "red",
		position: { row: 0, column: 0 },
		id: "1",
	}),
	new Tile({
		kind: "red",
		position: { row: 1, column: 0 },
		id: "2",
	}),
	new Tile({
		kind: "yellow",
		position: { row: 2, column: 0 },
		id: "3",
	}),
	new Tile({
		kind: "red",
		position: { row: 0, column: 1 },
		id: "4",
	}),
	new Tile({
		kind: "yellow",
		position: { row: 1, column: 1 },
		id: "5",
	}),
	new Tile({
		kind: "blue",
		position: { row: 2, column: 1 },
		id: "6",
	}),
	new Tile({
		kind: "yellow",
		position: { row: 0, column: 2 },
		id: "7",
	}),
	new Tile({
		kind: "blue",
		position: { row: 1, column: 2 },
		id: "8",
	}),
	new Tile({
		kind: "yellow",
		position: { row: 2, column: 2 },
		id: "9",
	}),
]

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
			for (let i = 0; i < repeatCount; i++) {
				progressCounter.processMove(removedTilesCount)
			}
			expect(completionManager.checkGameCompletion()).toBe(completionStatus)
			expect(completionManager.isGameCompleted()).toBe(isGameCompleted)
		}
	)

	it("check shuffle needed", () => {
		expect(completionManager.isShuffleNeeded()).toBe(false)
	})
})
