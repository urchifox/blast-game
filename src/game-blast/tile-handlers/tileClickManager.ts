import { Tile, TileKind, TilePosition } from "../tile"
import { TileClickHandler } from "./tileClickHandler"
import { Presenter } from "../presenter"
import { TileRemovingInfo } from "../types"

export type TileClickManagerProps = {
	presenter: Pick<Presenter, "renderTile" | "addTile" | "removeTilesFromCenter">
	tileClickHandler: TileClickHandler
}

export class TileClickManager {
	private readonly presenter: TileClickManagerProps["presenter"]
	private readonly tileClickHandler: TileClickManagerProps["tileClickHandler"]

	constructor(props: TileClickManagerProps) {
		this.presenter = props.presenter
		this.tileClickHandler = props.tileClickHandler
	}

	onClick(tile: Tile): TileRemovingInfo {
		const result = this.tileClickHandler.onClick(tile)
		if (result === null) {
			return null
		}

		const { connectedTiles, connectedPositions, rewardType } = result
		const tilePosition = tile.getPosition()

		const removingPromise = this.presenter
			.removeTilesFromCenter(connectedTiles, tilePosition)
			.then(() => {
				if (rewardType !== null) {
					return this.createComboPrize(rewardType, tilePosition)
				}
			})

		return {
			removedTiles: connectedTiles,
			removedPositions: connectedPositions,
			removingPromise: removingPromise,
		}
	}

	private createComboPrize(rewardType: TileKind, position: TilePosition) {
		const newTile = this.presenter.addTile({
			kind: rewardType,
			position: position,
		})

		return this.presenter.renderTile(newTile)
	}
}
