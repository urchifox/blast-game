import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { FieldManipulator } from "../fieldManipulator"

type InnerFieldManipulator = Pick<
	FieldManipulator,
	"getTilesInRow" | "removeTilesFromCenter"
>

export type TileHandlerRocketRowProps = {
	innerFieldManipulator: InnerFieldManipulator
} & TileHandlerProps

export class TileHandlerRocketRow extends TileHandlerSpecial {
	readonly comboSize = 4
	readonly kind = "rockets-row"
	private readonly innerFieldManipulator: TileHandlerRocketRowProps["innerFieldManipulator"]

	constructor({ innerFieldManipulator, gameRules }: TileHandlerRocketRowProps) {
		super({ gameRules })
		this.innerFieldManipulator = innerFieldManipulator
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.innerFieldManipulator.getTilesInRow(
			tile.getPosition().row
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
