import "./assets/style/game-blast-container.css"

import { View } from "../view/view"
import { GameBlast } from "../game-blast/game-blast"
import { queryElement } from "../helpers/dom"
import { PhaserRenderer } from "../game-blast/rendering/phaserRenderer"

export class GameView extends View {
	private gameBlast?: GameBlast
	private gameContainer?: HTMLElement
	private movesCounter?: HTMLElement
	private scoreCounter?: HTMLElement

	constructor() {
		super("game-blast")
	}

	override async mount() {
		super.mount()

		this.gameContainer = queryElement("#canvas-container")
		this.movesCounter = queryElement("#movements-counter-text")
		this.scoreCounter = queryElement("#points-counter-result")

		const renderer = new PhaserRenderer({
			container: this.gameContainer,
		})
		this.gameBlast = new GameBlast({
			container: this.gameContainer,
			renderer,
			toggleContainerFullSizeMode:
				this.toggleGameContainerFullSizeMode.bind(this),
			updateMovesCounter: this.updateMovesCounter.bind(this),
			updateScoreCounter: this.updateScoreCounter.bind(this),
		})
		await this.gameBlast.init()
	}

	override unmount() {
		super.unmount()
		this.gameBlast?.destroy()
	}

	private toggleGameContainerFullSizeMode(isFullSize: boolean) {
		this.gameContainer?.classList.toggle(
			"game-blast-container__canvas-container--fullsize",
			isFullSize
		)
	}

	private updateMovesCounter({
		movesNumber,
		movesLimit,
	}: {
		movesNumber: number
		movesLimit: number
	}) {
		if (this.movesCounter === undefined) {
			return
		}
		const movesLeft = movesLimit - movesNumber
		this.movesCounter.textContent = movesLeft.toString()
	}

	private updateScoreCounter({
		score,
		goalScore,
	}: {
		score: number
		goalScore: number
	}) {
		if (this.scoreCounter === undefined) {
			return
		}
		this.scoreCounter.textContent = `${score}/${goalScore}`
	}
}
