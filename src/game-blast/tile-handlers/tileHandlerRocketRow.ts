import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { FieldQueries } from "../fieldQueries"
import { Presenter } from "../presenter"

export type TileHandlerRocketRowProps = {
	fieldQueries: FieldQueries
	presenter: Pick<Presenter, "removeTilesFromCenter">
} & TileHandlerProps

export class TileHandlerRocketRow extends TileHandlerSpecial {
	private readonly fieldQueries: TileHandlerRocketRowProps["fieldQueries"]
	private readonly presenter: TileHandlerRocketRowProps["presenter"]

	readonly comboSize = 4
	readonly kind = "rockets-row"

	constructor(props: TileHandlerRocketRowProps) {
		super({ gameRules: props.gameRules })
		this.fieldQueries = props.fieldQueries
		this.presenter = props.presenter
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.fieldQueries.getTilesInRow(
			tile.getPosition().row
		)
		if (tiles.size === 0) {
			return null
		}
		const removingPromise = this.presenter.removeTilesFromCenter(
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
