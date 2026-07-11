import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { FieldManipulator } from "../fieldManipulator"

type InnerFieldManipulator = Pick<
	FieldManipulator,
	"removeTilesFromCenter" | "getTiles" | "getPositions"
>

export type TileHandlerDynamiteProps = {
	innerFieldManipulator: InnerFieldManipulator
} & TileHandlerProps

export class TileHandlerDynamite extends TileHandlerSpecial {
	readonly comboSize = 8
	readonly kind = "dynamite"
	private readonly innerFieldManipulator: TileHandlerDynamiteProps["innerFieldManipulator"]

	constructor({ innerFieldManipulator, gameRules }: TileHandlerDynamiteProps) {
		super({ gameRules })
		this.innerFieldManipulator = innerFieldManipulator
	}

	onClick(tile: Tile): TileRemovingInfo {
		const tiles = new Set(this.innerFieldManipulator.getTiles())
		const positions = new Set(this.innerFieldManipulator.getPositions())
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
