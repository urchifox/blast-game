import { TileHandler, TileHandlerProps } from "./tileHandler"
import { TileRemovingInfo } from "../types"
import { Tile, TilePosition } from "../tile"
import { FieldManipulator } from "../fieldManipulator"

export type TileHandlerNormalProps = {
	fieldManipulator: Pick<
		FieldManipulator,
		"getSameKindNeighbourTiles" | "removeTiles" | "renderTile"
	>
	getComboPrize: (comboSize: number, position: TilePosition) => Tile | undefined
} & TileHandlerProps

export class TileHandlerNormal extends TileHandler {
	private readonly fieldManipulator: TileHandlerNormalProps["fieldManipulator"]
	private readonly getComboPrize: TileHandlerNormalProps["getComboPrize"]

	constructor(props: TileHandlerNormalProps) {
		super({ gameRules: props.gameRules })
		this.fieldManipulator = props.fieldManipulator
		this.getComboPrize = props.getComboPrize
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tilesToRemove, positionsToRemove } =
			this.fieldManipulator.getSameKindNeighbourTiles(tile)
		if (tilesToRemove.size < this.gameRules.MIN_COMBO_SIZE) {
			return null
		}

		const removeTilesPromise = this.fieldManipulator.removeTiles(tilesToRemove)
		const newTile = this.getComboPrize(tilesToRemove.size, tile.getPosition())

		return {
			removedTiles: tilesToRemove,
			removedPositions: positionsToRemove,
			removingPromise: removeTilesPromise.then(() => {
				if (newTile !== undefined) {
					return this.fieldManipulator.renderTile(newTile)
				}
			}),
		}
	}
}
