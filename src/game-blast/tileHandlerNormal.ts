import { TileHandler } from "./tileHandler"
import { TileClickHandlerResult } from "./types"
import { Tile, TilePosition } from "./tile"
import { MIN_COMBO_SIZE } from "./config"

export type TileHandlerNormalProps = {
	getSameKindNeighbourTiles: (tile: Tile) => {
		tilesToRemove: Set<Tile>
		positionsToRemove: Set<TilePosition>
	}
	removeTiles: (tiles: Set<Tile>) => Promise<void>
	getComboPrize: (comboSize: number, position: TilePosition) => Tile | undefined
	renderTile: (tile: Tile) => Promise<void>
}

export class TileHandlerNormal extends TileHandler {
	private getSameKindNeighbourTiles: TileHandlerNormalProps["getSameKindNeighbourTiles"]
	private removeTiles: TileHandlerNormalProps["removeTiles"]
	private getComboPrize: TileHandlerNormalProps["getComboPrize"]
	private renderTile: TileHandlerNormalProps["renderTile"]

	constructor({
		getSameKindNeighbourTiles,
		removeTiles,
		getComboPrize,
		renderTile,
	}: TileHandlerNormalProps) {
		super()
		this.getSameKindNeighbourTiles = getSameKindNeighbourTiles
		this.removeTiles = removeTiles
		this.getComboPrize = getComboPrize
		this.renderTile = renderTile
	}

	onClick(tile: Tile): TileClickHandlerResult {
		const { tilesToRemove, positionsToRemove } =
			this.getSameKindNeighbourTiles(tile)
		if (tilesToRemove.size < MIN_COMBO_SIZE) {
			return null
		}

		const removeTilesPromise = this.removeTiles(tilesToRemove)
		const newTile = this.getComboPrize(tilesToRemove.size, tile.getPosition())

		return {
			removedTiles: tilesToRemove,
			removedPositions: positionsToRemove,
			removingPromise: removeTilesPromise.then(() => {
				if (newTile !== undefined) {
					return this.renderTile(newTile)
				}
			}),
		}
	}
}
