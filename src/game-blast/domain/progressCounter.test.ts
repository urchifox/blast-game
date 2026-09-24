import { Counter } from "../../helpers/counter"
import { GameRules } from "./gameRules"
import { ProgressCounter } from "./progressCounter"
import { GameCompletionStatus } from "./types"

describe("progressCounter", () => {
	let progressCounter: ProgressCounter
	beforeEach(() => {
		progressCounter = new ProgressCounter({
			scoreCounter: new Counter({ startValue: 0, endValue: 50 }),
			movesCounter: new Counter({ startValue: 3, endValue: 0 }),
			gameRules: new GameRules(),
		})
	})
	afterEach(() => {
		progressCounter.clear()
	})

	it.each([
		{
			removedTilesCount: 2,
			repeatCount: 2,
			completionStatus: GameCompletionStatus.IN_PROGRESS,
		},
		{
			removedTilesCount: 3,
			repeatCount: 1,
			completionStatus: GameCompletionStatus.IN_PROGRESS,
		},
		{
			removedTilesCount: 5,
			repeatCount: 1,
			completionStatus: GameCompletionStatus.WIN,
		},
		{
			removedTilesCount: 3,
			repeatCount: 3,
			completionStatus: GameCompletionStatus.WIN,
		},
		{
			removedTilesCount: 2,
			repeatCount: 3,
			completionStatus: GameCompletionStatus.LOSS,
		},
	])(
		"has status $completionStatus after processing $removedTilesCount removed tiles $repeatCount times",
		({ removedTilesCount, repeatCount, completionStatus }) => {
			for (let i = 0; i < repeatCount; i++) {
				progressCounter.processMove(removedTilesCount)
			}
			expect(progressCounter.getCompletionStatus()).toBe(completionStatus)
		}
	)
})
