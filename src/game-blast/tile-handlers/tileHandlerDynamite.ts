import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { FieldManipulator } from "../fieldManipulator"

export type TileHandlerDynamiteProps = {
	fieldManipulator: Pick<
		FieldManipulator,
		"removeTilesFromCenter" | "getTiles" | "getPositions"
	>
} & TileHandlerProps

export class TileHandlerDynamite extends TileHandlerSpecial {
	private readonly fieldManipulator: TileHandlerDynamiteProps["fieldManipulator"]

	readonly comboSize = 8
	readonly kind = "dynamite"

	constructor(props: TileHandlerDynamiteProps) {
		super({ gameRules: props.gameRules })
		this.fieldManipulator = props.fieldManipulator
	}

	onClick(tile: Tile): TileRemovingInfo {
		const tiles = new Set(this.fieldManipulator.getTiles())
		const positions = new Set(this.fieldManipulator.getPositions())
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
