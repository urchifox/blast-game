import "./assets/style/game-blast-container.css"

import { View } from "../view/view"
import { GameBlast } from "../game-blast/game-blast"
import { queryElement } from "../helpers/dom"
import { PhaserRenderer } from "../game-blast/rendering/phaserRenderer"

export class GameView extends View {
	private gameBlast?: GameBlast

	constructor() {
		super("game-blast")
	}

	override async mount() {
		super.mount()
		const gameContainer = queryElement("#canvas-container")
		const renderer = new PhaserRenderer({
			container: gameContainer,
		})
		this.gameBlast = new GameBlast({ container: gameContainer, renderer })
		await this.gameBlast.init()
	}

	override unmount() {
		super.unmount()
		this.gameBlast?.destroy()
	}
}
