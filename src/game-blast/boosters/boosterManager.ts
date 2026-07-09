import { BoosterHandlerBomb } from "./boosterHandlerBomb"
import { Tile } from "../tile"
import { BoosterHandlerTeleport } from "./boosterHandlerTeleport"
import { TileClickHandlerResult } from "../types"
import { BoosterCommonProps, BoosterName } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { GameRules } from "../gameRules"
import { FieldManipulator } from "../fieldManipulator"

type InnerFieldManipulator = Pick<
	FieldManipulator,
	"selectTile" | "swapTiles" | "getTilesInRadius" | "removeTilesFromCenter"
>

export type BoosterManagerProps = {
	innerFieldManipulator: InnerFieldManipulator
	processRemovingTiles: (result: TileClickHandlerResult) => void
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterManager {
	private boostersHandlersMap: Record<BoosterName, BoosterHandler>
	private boostersHandlers: Array<BoosterHandler>

	constructor({
		innerFieldManipulator,
		processRemovingTiles,
		boosterProps,
		gameRules,
	}: BoosterManagerProps) {
		this.boostersHandlersMap = {
			bomb: new BoosterHandlerBomb({
				innerFieldManipulator,
				processRemovingTiles,
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

	maybeUseBooster(tile: Tile) {
		for (const handler of this.boostersHandlers) {
			const isBoosterUsed = handler.maybeUse(tile)
			if (isBoosterUsed) {
				return true
			}
		}
		return false
	}

	onBoosterButtonClick(boosterName: BoosterName) {
		this.boostersHandlersMap[boosterName].tryActivate()
	}
}
