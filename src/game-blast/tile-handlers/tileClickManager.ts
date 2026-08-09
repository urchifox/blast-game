import { Tile } from "../domain/tile"
import { TileClickHandler } from "../domain/tileClickHandler"
import { TileRemovingInfo } from "../types"
import { Action, ActionManager, ActionName } from "../actionManager"

export type TileClickManagerProps = {
	actionManager: ActionManager
	tileClickHandler: TileClickHandler
}

export class TileClickManager {
	private readonly actionManager: TileClickManagerProps["actionManager"]
	private readonly tileClickHandler: TileClickManagerProps["tileClickHandler"]

	constructor(props: TileClickManagerProps) {
		this.actionManager = props.actionManager
		this.tileClickHandler = props.tileClickHandler
	}

	onClick(tile: Tile): TileRemovingInfo {
		const result = this.tileClickHandler.onClick(tile)
		if (result === null) {
			return null
		}

		const { connectedTiles, connectedPositions, rewardType } = result
		const tilePosition = tile.getPosition()

		const actions: Array<Action> = [
			{
				name: ActionName.REMOVE,
				payload: {
					centerPosition: tilePosition,
					tiles: connectedTiles,
				},
			},
		]

		if (rewardType !== null) {
			actions.push({
				name: ActionName.ADD,
				payload: {
					kind: rewardType,
					position: tilePosition,
				},
			})
		}

		const removingPromise = this.actionManager.act(actions)

		return {
			removedTiles: connectedTiles,
			removedPositions: connectedPositions,
			removingPromise: removingPromise,
		}
	}
}
