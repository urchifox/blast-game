import { Booster, BoosterProps } from "./booster"
import { Tile } from "../tile"

export abstract class BoosterHandler {
	private readonly booster: Booster

	constructor(props: BoosterProps) {
		this.booster = new Booster(props)
	}

	abstract use(tile: Tile): void

	clear() {
		this.booster.clear()
	}

	setInitialValue() {
		this.booster.setInitialValue()
		this.booster.renderCounter()
	}

	maybeUse(tile: Tile) {
		if (this.booster.isActivated()) {
			this.use(tile)
			return true
		}
		return false
	}

	tryActivate() {
		this.booster.tryActivate()
	}

	spend() {
		this.booster.spend()
	}
}
