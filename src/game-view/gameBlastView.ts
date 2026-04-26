import "./assets/style/game-blast-container.css"

import { View } from "../view/view"
import { GameBlast } from "../game-blast/game-blast"
import { queryElement } from "../helpers/dom"
import { PhaserRenderer } from "../game-blast/rendering/phaserRenderer"

export class GameView extends View {
	private gameBlast?: GameBlast
	private gameContainer?: HTMLElement

	constructor() {
		super("game-blast")
	}

	override async mount() {
		super.mount()

		this.gameContainer = queryElement("#canvas-container")
		const renderer = new PhaserRenderer({
			container: this.gameContainer,
		})
		this.gameBlast = new GameBlast({
			container: this.gameContainer,
			renderer,
			toggleContainerFullSizeMode:
				this.toggleGameContainerFullSizeMode.bind(this),
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
}
