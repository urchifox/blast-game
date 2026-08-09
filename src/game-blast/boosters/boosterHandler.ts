import { Booster } from "./booster"
import { Tile } from "../domain/tile"
import { GameRules } from "../domain/gameRules"
import { ActResult } from "../actionManager"

export type BoosterHandlerResult = {
	isUsed: boolean
	actResult: Promise<ActResult> | null
}

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

	abstract use(tile: Tile): BoosterHandlerResult["actResult"]

	clear() {
		this.booster.clear()
	}

	setInitialValue() {
		this.booster.setInitialValue()
		this.booster.renderCounter()
	}

	maybeUse(tile: Tile): BoosterHandlerResult {
		if (this.booster.isActivated()) {
			return { isUsed: true, actResult: this.use(tile) }
		}
		return { isUsed: false, actResult: null }
	}

	tryActivate() {
		this.booster.tryActivate()
	}

	spend() {
		this.booster.spend()
	}
}
