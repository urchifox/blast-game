import { BoosterHandlerBomb } from "./boosterHandlerBomb"
import { Tile } from "../tile"
import { BoosterHandlerTeleport } from "./boosterHandlerTeleport"
import { BoosterCommonProps, BoosterName } from "./booster"
import { BoosterHandler, BoosterHandlerResult } from "./boosterHandler"
import { GameRules } from "../gameRules"
import { FieldManipulator } from "../fieldManipulator"

type InnerFieldManipulator = Pick<
	FieldManipulator,
	"selectTile" | "swapTiles" | "getTilesInRadius" | "removeTilesFromCenter"
>

export type BoosterManagerProps = {
	innerFieldManipulator: InnerFieldManipulator
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterManager {
	private boostersHandlersMap: Record<BoosterName, BoosterHandler>
	private boostersHandlers: Array<BoosterHandler>

	constructor({
		innerFieldManipulator,
		boosterProps,
		gameRules,
	}: BoosterManagerProps) {
		this.boostersHandlersMap = {
			bomb: new BoosterHandlerBomb({
				innerFieldManipulator,
				boosterProps,
				gameRules,
			}),
			teleport: new BoosterHandlerTeleport({
				innerFieldManipulator,
				boosterProps,
				gameRules,
			}),
		}
		this.boostersHandlers = Object.values(this.boostersHandlersMap)
	}

	clear() {
		for (const handler of this.boostersHandlers) {
			handler.clear()
		}
	}

	setInitialValue() {
		for (const handler of this.boostersHandlers) {
			handler.setInitialValue()
		}
	}

	maybeUseBooster(tile: Tile): BoosterHandlerResult {
		for (const handler of this.boostersHandlers) {
			const result = handler.maybeUse(tile)
			if (result.isUsed) {
				return result
			}
		}
		return { isUsed: false, result: null }
	}

	onBoosterButtonClick(boosterName: BoosterName) {
		this.boostersHandlersMap[boosterName].tryActivate()
	}
}
