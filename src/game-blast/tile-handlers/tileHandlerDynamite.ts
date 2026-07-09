import { Tile, TilePosition } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileClickHandlerResult } from "../types"
import { TileHandlerProps } from "./tileHandler"

export type TileHandlerDynamiteProps = {
	removeTilesFromCenter: (
		tiles: Set<Tile>,
		centerPosition: TilePosition
	) => Promise<void>
	getTiles: () => Array<Tile>
	getPositions: () => Array<TilePosition>
} & TileHandlerProps

export class TileHandlerDynamite extends TileHandlerSpecial {
	readonly comboSize = 8
	readonly kind = "dynamite"
	private removeTilesFromCenter: TileHandlerDynamiteProps["removeTilesFromCenter"]
	private getTiles: TileHandlerDynamiteProps["getTiles"]
	private getPositions: TileHandlerDynamiteProps["getPositions"]

	constructor({
		removeTilesFromCenter,
		getTiles,
		getPositions,
		gameRules,
	}: TileHandlerDynamiteProps) {
		super({ gameRules })
		this.removeTilesFromCenter = removeTilesFromCenter
		this.getTiles = getTiles
		this.getPositions = getPositions
	}

	onClick(tile: Tile): TileClickHandlerResult {
		const tiles = new Set(this.getTiles())
		const positions = new Set(this.getPositions())
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
