import { TILE_BOMB_RADIUS } from "./config"
import { Tile, TilePosition } from "./tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileClickHandlerResult } from "./types"

export type TileHandlerBombProps = {
	getTilesInRadius: (
		position: TilePosition,
		radius: number
	) => {
		tiles: Set<Tile>
		positions: Set<TilePosition>
	}
	removeTilesFromCenter: (
		tiles: Set<Tile>,
		centerPosition: TilePosition
	) => Promise<void>
}

export class TileHandlerBomb extends TileHandlerSpecial {
	readonly comboSize = 6
	readonly kind = "bomb"
	private getTilesInRadius: TileHandlerBombProps["getTilesInRadius"]
	private removeTilesFromCenter: TileHandlerBombProps["removeTilesFromCenter"]

	constructor({
		getTilesInRadius,
		removeTilesFromCenter,
	}: TileHandlerBombProps) {
		super()
		this.getTilesInRadius = getTilesInRadius
		this.removeTilesFromCenter = removeTilesFromCenter
	}

	onClick(tile: Tile): TileClickHandlerResult {
		const { tiles, positions } = this.getTilesInRadius(
			tile.getPosition(),
			TILE_BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return null
		}
		const removingPromise = this.removeTilesFromCenter(
			tiles,
			tile.getPosition()
		)
		return {
			removedTiles: tiles,
			removedPositions: positions,
			removingPromise: removingPromise,
		}
	}
}
