import { Booster, BoosterProps } from "./booster"
import { Tile } from "../tile"
import { GameRules } from "../gameRules"

export type BoosterHandlerProps = {
	gameRules: GameRules
} & BoosterProps

export abstract class BoosterHandler {
	readonly gameRules: BoosterHandlerProps["gameRules"]
	private readonly booster: Booster

	constructor(props: BoosterHandlerProps) {
		this.gameRules = props.gameRules
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
