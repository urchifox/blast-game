import { Tile } from "../domain/tile"
import { BoosterHandler, BoosterHandlerResult } from "./boosterHandler"
import { BoosterName } from "../domain/types"

export type BoosterManagerProps = {
	boostersHandlersMap: Record<BoosterName, BoosterHandler>
}

export class BoosterManager {
	private boostersHandlersMap: BoosterManagerProps["boostersHandlersMap"]
	private boostersHandlers: Array<BoosterHandler>

	private selectedTiles: Array<Tile> = []
	private activeBoosterName: BoosterName | null = null

	constructor(props: BoosterManagerProps) {
		this.boostersHandlersMap = props.boostersHandlersMap
		this.boostersHandlers = Object.values(this.boostersHandlersMap)
	}

	clear() {
		for (const handler of this.boostersHandlers) {
			handler.clear()
		}
		this.selectedTiles = []
		this.activeBoosterName = null
	}

	reset() {
		for (const handler of this.boostersHandlers) {
			handler.reset()
		}
	}

	maybeUseBooster(tile: Tile): BoosterHandlerResult {
		const boosterName = this.activeBoosterName
		if (boosterName === null) {
			return { isUsed: false, actResult: null }
		}

		const handler = this.boostersHandlersMap[boosterName]
		const result = handler.maybeUse([tile, ...this.selectedTiles])
		if (result === null) {
			this.selectedTiles.push(tile)
		} else {
			this.activeBoosterName = null
			this.selectedTiles = []
		}

		return { isUsed: true, actResult: result }
	}

	onBoosterButtonClick(boosterName: BoosterName) {
		const isActivated = this.boostersHandlersMap[boosterName].tryActivate()
		this.activeBoosterName = isActivated ? boosterName : null
	}
}
