import { Progress } from "../helpers/progress"
import { BASE_SCORE, GROWTH_EXPONENT } from "./config"

export type ProgressManagerProps = {
	scoreProgress: Progress
	movesProgress: Progress
}

export class ProgressManager {
	private readonly scoreProgress: Progress
	private readonly movesProgress: Progress

	constructor({ scoreProgress, movesProgress }: ProgressManagerProps) {
		this.scoreProgress = scoreProgress
		this.movesProgress = movesProgress
	}

	clear() {
		this.scoreProgress.clear()
		this.movesProgress.clear()
	}

	setinitialValues({
		goalScore,
		movesLimit,
	}: {
		goalScore: number
		movesLimit: number
	}) {
		this.scoreProgress.setTargetValue(goalScore)
		this.movesProgress.setTargetValue(movesLimit)
		this.scoreProgress.renderCounters()
		this.movesProgress.renderCounters()
	}

	addProgress(points: number) {
		this.scoreProgress.addCurrentValue(points)
		this.movesProgress.addCurrentValue()
	}

	/** Uses power scale formula */
	getPoints(removedTilesNumber: number) {
		return Math.round(
			BASE_SCORE * Math.pow(removedTilesNumber, GROWTH_EXPONENT)
		)
	}

	isScoreTargetReached() {
		return this.scoreProgress.isTargetReached()
	}

	isMovesTargetReached() {
		return this.movesProgress.isTargetReached()
	}
}
