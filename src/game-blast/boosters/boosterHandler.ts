import { Booster } from "./booster"
import { Tile } from "../tile"
import { GameRules } from "../gameRules"
import { BoosterHandlerResult, TileRemovingInfo } from "../types"

export type BoosterHandlerProps = {
	booster: Booster
	gameRules: GameRules
}

export abstract class BoosterHandler {
	protected readonly gameRules: BoosterHandlerProps["gameRules"]
	private readonly booster: BoosterHandlerProps["booster"]

	constructor(props: BoosterHandlerProps) {
		this.gameRules = props.gameRules
		this.booster = props.booster
	}

	abstract use(tile: Tile): TileRemovingInfo

	clear() {
		this.booster.clear()
	}

	setInitialValue() {
		this.booster.setInitialValue()
		this.booster.renderCounter()
	}

	maybeUse(tile: Tile): BoosterHandlerResult {
		if (this.booster.isActivated()) {
			return { isUsed: true, tileRemovingInfo: this.use(tile) }
		}
		return { isUsed: false, tileRemovingInfo: null }
	}

	tryActivate() {
		this.booster.tryActivate()
	}

	spend() {
		this.booster.spend()
	}
}
