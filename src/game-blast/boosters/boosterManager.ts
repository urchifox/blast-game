import { Tile } from "../domain/tile"
import { BoosterHandler, BoosterHandlerResult } from "./boosterHandler"
import { BoosterName } from "../domain/types"

export type BoosterManagerProps = {
	boostersHandlersMap: Record<BoosterName, BoosterHandler>
}

export class BoosterManager {
	private boostersHandlersMap: BoosterManagerProps["boostersHandlersMap"]
	private boostersHandlers: Array<BoosterHandler>

	constructor(props: BoosterManagerProps) {
		this.boostersHandlersMap = props.boostersHandlersMap
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
		return { isUsed: false, actResult: null }
	}

	onBoosterButtonClick(boosterName: BoosterName) {
		this.boostersHandlersMap[boosterName].tryActivate()
	}
}
