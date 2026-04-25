import "./assets/style/game-blast-container.css"

import { View } from "../view/view"
import { GameBlast } from "../game-blast/game-blast"

export class GameView extends View {
	private gameBlast?: GameBlast

	constructor() {
		super("game-blast")
	}

	override mount() {
		super.mount()
		this.gameBlast = new GameBlast()
		this.gameBlast.init()
	}

	override unmount() {
		super.unmount()
		this.gameBlast?.destroy()
	}
}
