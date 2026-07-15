import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { FieldManipulator } from "../fieldManipulator"

export type TileHandlerRocketRowProps = {
	fieldManipulator: Pick<
		FieldManipulator,
		"getTilesInRow" | "removeTilesFromCenter"
	>
} & TileHandlerProps

export class TileHandlerRocketRow extends TileHandlerSpecial {
	private readonly fieldManipulator: TileHandlerRocketRowProps["fieldManipulator"]

	readonly comboSize = 4
	readonly kind = "rockets-row"

	constructor(props: TileHandlerRocketRowProps) {
		super({ gameRules: props.gameRules })
		this.fieldManipulator = props.fieldManipulator
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.fieldManipulator.getTilesInRow(
			tile.getPosition().row
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
