import { Counter } from "../../helpers/counter"
import { GameRules } from "./gameRules"
import { GameCompletionStatus } from "./types"

export type ProgressCounterProps = {
	scoreCounter: Counter
	movesCounter: Counter
	gameRules: GameRules
}
export class ProgressCounter {
	private readonly scoreCounter: ProgressCounterProps["scoreCounter"]
	private readonly movesCounter: ProgressCounterProps["movesCounter"]
	private readonly gameRules: ProgressCounterProps["gameRules"]

	constructor(props: ProgressCounterProps) {
		this.scoreCounter = props.scoreCounter
		this.movesCounter = props.movesCounter
		this.gameRules = props.gameRules
	}

	clear() {
		this.scoreCounter.clear()
		this.movesCounter.clear()
	}

	setInitialValues({
		goalScore,
		movesLimit,
	}: {
		goalScore: number
		movesLimit: number
	}) {
		this.scoreCounter.setInitialValues({
			startValue: 0,
			targetValue: goalScore,
		})
		this.movesCounter.setInitialValues({
			startValue: movesLimit,
			targetValue: 0,
		})
	}

	processMove(removedTilesCount: number) {
		this.movesCounter.updateCurrentValue(-1)
		const points = this.gameRules.getPoints(removedTilesCount)
		this.scoreCounter.updateCurrentValue(points)
	}

	getCompletionStatus() {
		const isScoreTargetReached = this.scoreCounter.isTargetReached()
		const isMovesTargetReached = this.movesCounter.isTargetReached()

		if (isScoreTargetReached) {
			return GameCompletionStatus.WIN
		}
		if (isMovesTargetReached) {
			return GameCompletionStatus.LOSS
		}
		return GameCompletionStatus.IN_PROGRESS
	}

	getValues() {
		return {
			score: this.scoreCounter.getValues(),
			moves: this.movesCounter.getValues(),
		}
	}
}
