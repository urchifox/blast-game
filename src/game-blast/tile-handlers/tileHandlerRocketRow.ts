import { Tile, TilePosition } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileClickHandlerResult } from "../types"
import { TileHandlerProps } from "./tileHandler"

export type TileHandlerRocketRowProps = {
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
	getTilesInRow: (row: number) => {
		tiles: Set<Tile>
		positions: Set<TilePosition>
	}
} & TileHandlerProps

export class TileHandlerRocketRow extends TileHandlerSpecial {
	readonly comboSize = 4
	readonly kind = "rockets-row"
	private removeTilesFromCenter: TileHandlerRocketRowProps["removeTilesFromCenter"]
	private getTilesInRow: TileHandlerRocketRowProps["getTilesInRow"]

	constructor({
		getTilesInRow,
		removeTilesFromCenter,
		gameRules,
	}: TileHandlerRocketRowProps) {
		super({ gameRules })
		this.removeTilesFromCenter = removeTilesFromCenter
		this.getTilesInRow = getTilesInRow
	}

	onClick(tile: Tile): TileClickHandlerResult {
		const { tiles, positions } = this.getTilesInRow(tile.getPosition().row)
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
