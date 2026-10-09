import { Tile } from "../domain/tile"
import { BoosterHandler, BoosterHandlerResult } from "./boosterHandler"
import { BoosterName } from "../domain/types"
import { ActionManager, ActionName } from "./actionManager"

export type BoosterManagerProps = {
	actionManager: ActionManager
	boostersHandlersMap: Record<BoosterName, BoosterHandler>
}

export class BoosterManager {
	private actionManager: BoosterManagerProps["actionManager"]
	private boostersHandlersMap: BoosterManagerProps["boostersHandlersMap"]
	private boostersHandlers: Array<BoosterHandler>

	private selectedTiles: Array<Tile> = []
	private activeBoosterName: BoosterName | null = null

	constructor(props: BoosterManagerProps) {
		this.actionManager = props.actionManager
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

		if (this.selectedTiles.includes(tile)) {
			this.selectedTiles = this.selectedTiles.filter((t) => t !== tile)
			this.actionManager.doActions([
				{
					name: ActionName.UNSELECT,
					payload: tile,
				},
			])
			return { isUsed: true, actResult: null }
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
		if (this.activeBoosterName !== null) {
			this.boostersHandlersMap[this.activeBoosterName].deactivate()
			this.selectedTiles.forEach((tile) => {
				this.actionManager.doActions([
					{
						name: ActionName.UNSELECT,
						payload: tile,
					},
				])
			})
			this.selectedTiles = []
		}

		if (this.activeBoosterName === boosterName) {
			return
		}

		const isActivated = this.boostersHandlersMap[boosterName].tryActivate()
		this.activeBoosterName = isActivated ? boosterName : null
	}
}
