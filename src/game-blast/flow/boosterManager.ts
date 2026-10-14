import { Tile } from "../domain/tile"
import { BoosterHandler, BoosterHandlerResult } from "./boosterHandler"
import { BoosterName } from "../domain/types"
import { ActionManager, ActionName } from "./actionManager"
import { FieldQueries } from "../domain/fieldQueries"

export type BoosterManagerProps = {
	actionManager: ActionManager
	fieldQueries: FieldQueries
	boostersHandlersMap: Record<BoosterName, BoosterHandler>
}

export class BoosterManager {
	private actionManager: BoosterManagerProps["actionManager"]
	private fieldQueries: BoosterManagerProps["fieldQueries"]
	private boostersHandlersMap: BoosterManagerProps["boostersHandlersMap"]
	private boostersHandlers: Array<BoosterHandler>

	private selectedTiles: Array<Tile> = []
	private activeBoosterName: BoosterName | null = null

	constructor(props: BoosterManagerProps) {
		this.actionManager = props.actionManager
		this.fieldQueries = props.fieldQueries
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

	maybeUseBooster(tile: Tile): BoosterHandlerResult {
		const boosterName = this.activeBoosterName
		if (boosterName === null) {
			return { isUsed: false, actResult: null }
		}

		this.dropUnavailableSelectedTiles()

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

	private dropUnavailableSelectedTiles() {
		const unavailableTiles = this.selectedTiles.filter(
			(tile) =>
				tile.isLocked() || this.fieldQueries.getTileById(tile.getId()) !== tile
		)
		if (unavailableTiles.length === 0) {
			return
		}

		this.selectedTiles = this.selectedTiles.filter(
			(tile) => !unavailableTiles.includes(tile)
		)
		this.actionManager.doActions(
			unavailableTiles.map((tile) => ({
				name: ActionName.UNSELECT,
				payload: tile,
			}))
		)
	}

	onBoosterButtonClick(boosterName: BoosterName) {
		const activeBoosterName = this.activeBoosterName
		if (activeBoosterName !== null) {
			this.boostersHandlersMap[activeBoosterName].deactivate()
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

		if (activeBoosterName === boosterName) {
			this.activeBoosterName = null
			return
		}

		const isActivated = this.boostersHandlersMap[boosterName].tryActivate()
		this.activeBoosterName = isActivated ? boosterName : null
	}
}
