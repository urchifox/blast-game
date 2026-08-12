import { ProgressCounter } from "../domain/progressCounter"
import { ProgressUIContract } from "../types"

export type ProgressManagerProps = {
	progressCounter: ProgressCounter
	progressUI: ProgressUIContract
}

export class ProgressManager {
	private readonly progressCounter: ProgressCounter
	private readonly progressUI: ProgressManagerProps["progressUI"]

	constructor(props: ProgressManagerProps) {
		this.progressCounter = props.progressCounter
		this.progressUI = props.progressUI
	}

	clear() {
		this.progressCounter.clear()
	}

	setInitialValues({
		goalScore,
		movesLimit,
	}: {
		goalScore: number
		movesLimit: number
	}) {
		this.progressCounter.setInitialValues({
			goalScore,
			movesLimit,
		})
		this.renderCounters()
	}

	processMove(removedTilesCount: number) {
		this.progressCounter.processMove(removedTilesCount)
		this.renderCounters()
	}

	private renderCounters() {
		const { score, moves } = this.progressCounter.getValues()
		this.progressUI.updateScoreCounter({
			score: score.currentValue,
			goalScore: score.endValue,
		})
		this.progressUI.updateMovesCounter({
			movesLeft: moves.currentValue,
		})
	}
}
