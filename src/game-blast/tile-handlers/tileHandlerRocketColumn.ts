import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileClickHandlerResult } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { FieldManipulator } from "../fieldManipulator"

type InnerFieldManipulator = Pick<
	FieldManipulator,
	"getTilesInColumn" | "removeTilesFromCenter"
>

export type TileHandlerRocketColumnProps = {
	innerFieldManipulator: InnerFieldManipulator
} & TileHandlerProps

export class TileHandlerRocketColumn extends TileHandlerSpecial {
	readonly comboSize = 4
	readonly kind = "rockets-column"
	private readonly innerFieldManipulator: TileHandlerRocketColumnProps["innerFieldManipulator"]

	constructor({
		innerFieldManipulator,
		gameRules,
	}: TileHandlerRocketColumnProps) {
		super({ gameRules })
		this.innerFieldManipulator = innerFieldManipulator
	}

	onClick(tile: Tile): TileClickHandlerResult {
		const { tiles, positions } = this.innerFieldManipulator.getTilesInColumn(
			tile.getPosition().column
		)
		if (tiles.size === 0) {
			return null
		}
		const removingPromise = this.innerFieldManipulator.removeTilesFromCenter(
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
