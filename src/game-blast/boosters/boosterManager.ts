import { BoosterHandlerBomb } from "./boosterHandlerBomb"
import { Tile } from "../tile"
import { BoosterHandlerTeleport } from "./boosterHandlerTeleport"
import { BoosterCommonProps, BoosterName } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { BoosterHandlerResult } from "../types"
import { GameRules } from "../gameRules"
import { FieldManipulator } from "../fieldManipulator"

export type BoosterManagerProps = {
	fieldManipulator: Pick<
		FieldManipulator,
		"selectTile" | "swapTiles" | "getTilesInRadius" | "removeTilesFromCenter"
	>
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterManager {
	private boostersHandlersMap: Record<BoosterName, BoosterHandler>
	private boostersHandlers: Array<BoosterHandler>

	constructor(props: BoosterManagerProps) {
		this.boostersHandlersMap = {
			bomb: new BoosterHandlerBomb({
				fieldManipulator: props.fieldManipulator,
				boosterProps: props.boosterProps,
				gameRules: props.gameRules,
			}),
			teleport: new BoosterHandlerTeleport({
				fieldManipulator: props.fieldManipulator,
				boosterProps: props.boosterProps,
				gameRules: props.gameRules,
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
		return { isUsed: false, tileRemovingInfo: null }
	}

	onBoosterButtonClick(boosterName: BoosterName) {
		this.boostersHandlersMap[boosterName].tryActivate()
	}
}
