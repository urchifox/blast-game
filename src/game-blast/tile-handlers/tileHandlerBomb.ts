import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { FieldManipulator } from "../fieldManipulator"

export type TileHandlerBombProps = {
	fieldManipulator: Pick<
		FieldManipulator,
		"getTilesInRadius" | "removeTilesFromCenter"
	>
} & TileHandlerProps

export class TileHandlerBomb extends TileHandlerSpecial {
	private readonly fieldManipulator: TileHandlerBombProps["fieldManipulator"]

	readonly comboSize = 6
	readonly kind = "bomb"

	constructor(props: TileHandlerBombProps) {
		super({ gameRules: props.gameRules })
		this.fieldManipulator = props.fieldManipulator
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.fieldManipulator.getTilesInRadius(
			tile.getPosition(),
			this.gameRules.TILE_BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return null
		}
		const removingPromise = this.fieldManipulator.removeTilesFromCenter(
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
