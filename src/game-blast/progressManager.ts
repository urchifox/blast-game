import { ProgressCounter } from "./domain/progressCounter"

export type ProgressManagerProps = {
	progressCounter: ProgressCounter
	updateScoreCounter: (props: {
		currentValue: number
		targetValue: number
	}) => void
	updateMovesCounter: (props: { currentValue: number }) => void
}

export class ProgressManager {
	private readonly progressCounter: ProgressCounter
	private readonly updateScoreCounter: ProgressManagerProps["updateScoreCounter"]
	private readonly updateMovesCounter: ProgressManagerProps["updateMovesCounter"]

	constructor(props: ProgressManagerProps) {
		this.progressCounter = props.progressCounter
		this.updateScoreCounter = props.updateScoreCounter
		this.updateMovesCounter = props.updateMovesCounter
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
		this.updateScoreCounter({
			currentValue: score.currentValue,
			targetValue: score.endValue,
		})
		this.updateMovesCounter({
			currentValue: moves.currentValue,
		})
	}
}
