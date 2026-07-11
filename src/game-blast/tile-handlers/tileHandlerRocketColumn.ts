import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { FieldManipulator } from "../fieldManipulator"

export type TileHandlerRocketColumnProps = {
	fieldManipulator: Pick<
		FieldManipulator,
		"getTilesInColumn" | "removeTilesFromCenter"
	>
} & TileHandlerProps

export class TileHandlerRocketColumn extends TileHandlerSpecial {
	private readonly fieldManipulator: TileHandlerRocketColumnProps["fieldManipulator"]

	readonly comboSize = 4
	readonly kind = "rockets-column"

	constructor(props: TileHandlerRocketColumnProps) {
		super({ gameRules: props.gameRules })
		this.fieldManipulator = props.fieldManipulator
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.fieldManipulator.getTilesInColumn(
			tile.getPosition().column
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
