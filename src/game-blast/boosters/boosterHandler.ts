import { Booster, BoosterProps } from "./booster"
import { Tile } from "../tile"
import { GameRules } from "../gameRules"
import { TileClickHandlerResult } from "../types"

export type BoosterHandlerProps = {
	gameRules: GameRules
} & BoosterProps

export type BoosterHandlerResult = {
	isUsed: boolean
	result: TileClickHandlerResult
}

export abstract class BoosterHandler {
	readonly gameRules: BoosterHandlerProps["gameRules"]
	private readonly booster: Booster

	constructor(props: BoosterHandlerProps) {
		this.gameRules = props.gameRules
		this.booster = new Booster(props)
	}

	abstract use(tile: Tile): TileClickHandlerResult

	clear() {
		this.booster.clear()
	}

	setInitialValue() {
		this.booster.setInitialValue()
		this.booster.renderCounter()
	}

	maybeUse(tile: Tile): BoosterHandlerResult {
		if (this.booster.isActivated()) {
			return { isUsed: true, result: this.use(tile) }
		}
		return { isUsed: false, result: null }
	}

	tryActivate() {
		this.booster.tryActivate()
	}

	spend() {
		this.booster.spend()
	}
}
