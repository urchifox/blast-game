import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { FieldManipulator } from "../fieldManipulator"

type InnerFieldManipulator = Pick<
	FieldManipulator,
	"getTilesInRadius" | "removeTilesFromCenter"
>

export type TileHandlerBombProps = {
	innerFieldManipulator: InnerFieldManipulator
} & TileHandlerProps

export class TileHandlerBomb extends TileHandlerSpecial {
	private readonly innerFieldManipulator: TileHandlerBombProps["innerFieldManipulator"]

	readonly comboSize = 6
	readonly kind = "bomb"

	constructor(props: TileHandlerBombProps) {
		super({ gameRules: props.gameRules })
		this.innerFieldManipulator = props.innerFieldManipulator
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.innerFieldManipulator.getTilesInRadius(
			tile.getPosition(),
			this.gameRules.TILE_BOMB_RADIUS
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
