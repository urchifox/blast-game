import { Tile, TilePosition } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileClickHandlerResult } from "../types"
import { TileHandlerProps } from "./tileHandler"

export type TileHandlerRocketColumnProps = {
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
	getTilesInColumn: (column: number) => {
		tiles: Set<Tile>
		positions: Set<TilePosition>
	}
} & TileHandlerProps

export class TileHandlerRocketColumn extends TileHandlerSpecial {
	readonly comboSize = 4
	readonly kind = "rockets-column"
	private removeTilesFromCenter: TileHandlerRocketColumnProps["removeTilesFromCenter"]
	private getTilesInColumn: TileHandlerRocketColumnProps["getTilesInColumn"]

	constructor({
		getTilesInColumn,
		removeTilesFromCenter,
		gameRules,
	}: TileHandlerRocketColumnProps) {
		super({ gameRules })
		this.removeTilesFromCenter = removeTilesFromCenter
		this.getTilesInColumn = getTilesInColumn
	}

	onClick(tile: Tile): TileClickHandlerResult {
		const { tiles, positions } = this.getTilesInColumn(
			tile.getPosition().column
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
