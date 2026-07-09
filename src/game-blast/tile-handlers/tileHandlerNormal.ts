import { TileHandler, TileHandlerProps } from "./tileHandler"
import { TileClickHandlerResult } from "../types"
import { Tile, TilePosition } from "../tile"
import { FieldManipulator } from "../fieldManipulator"

type InnerFieldManipulator = Pick<
	FieldManipulator,
	"getSameKindNeighbourTiles" | "removeTiles" | "renderTile"
>

export type TileHandlerNormalProps = {
	innerFieldManipulator: InnerFieldManipulator
	getComboPrize: (comboSize: number, position: TilePosition) => Tile | undefined
} & TileHandlerProps

export class TileHandlerNormal extends TileHandler {
	private readonly innerFieldManipulator: TileHandlerNormalProps["innerFieldManipulator"]
	private readonly getComboPrize: TileHandlerNormalProps["getComboPrize"]

	constructor({
		innerFieldManipulator,
		getComboPrize,
		gameRules,
	}: TileHandlerNormalProps) {
		super({ gameRules })
		this.innerFieldManipulator = innerFieldManipulator
		this.getComboPrize = getComboPrize
	}

	onClick(tile: Tile): TileClickHandlerResult {
		const { tilesToRemove, positionsToRemove } =
			this.innerFieldManipulator.getSameKindNeighbourTiles(tile)
		if (tilesToRemove.size < this.gameRules.MIN_COMBO_SIZE) {
			return null
		}

		const removeTilesPromise =
			this.innerFieldManipulator.removeTiles(tilesToRemove)
		const newTile = this.getComboPrize(tilesToRemove.size, tile.getPosition())

		return {
			removedTiles: tilesToRemove,
			removedPositions: positionsToRemove,
			removingPromise: removeTilesPromise.then(() => {
				if (newTile !== undefined) {
					return this.innerFieldManipulator.renderTile(newTile)
				}
			}),
		}
	}
}
