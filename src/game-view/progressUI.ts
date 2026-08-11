import { ProgressUIContract } from "../game-blast/types"

export type ProgressUIProps = {
	scoreCounter: HTMLElement
	movesCounter: HTMLElement
}
export class ProgressUI implements ProgressUIContract {
	private scoreCounter: ProgressUIProps["scoreCounter"]
	private movesCounter: ProgressUIProps["movesCounter"]

	constructor(props: ProgressUIProps) {
		this.scoreCounter = props.scoreCounter
		this.movesCounter = props.movesCounter
	}

	updateMovesCounter({ movesLeft }: { movesLeft: number }) {
		this.movesCounter.textContent = movesLeft.toString()
	}

	updateScoreCounter({
		score,
		goalScore,
	}: {
		score: number
		goalScore: number
	}) {
		this.scoreCounter.textContent = `${score}/${goalScore}`
	}
}
