import { Progress } from "../helpers/progress"

export type ProgressManagerProps = {
	scoreProgress: Progress
	movesProgress: Progress
}

export class ProgressManager {
	private readonly scoreProgress: ProgressManagerProps["scoreProgress"]
	private readonly movesProgress: ProgressManagerProps["movesProgress"]

	constructor(props: ProgressManagerProps) {
		this.scoreProgress = props.scoreProgress
		this.movesProgress = props.movesProgress
	}

	clear() {
		this.scoreProgress.clear()
		this.movesProgress.clear()
	}

	setInitialValues({
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

	addProgress({ points, moves }: { points: number; moves: number }) {
		this.scoreProgress.addCurrentValue(points)
		this.movesProgress.addCurrentValue(moves)
	}

	isScoreTargetReached() {
		return this.scoreProgress.isTargetReached()
	}

	isMovesTargetReached() {
		return this.movesProgress.isTargetReached()
	}
}
