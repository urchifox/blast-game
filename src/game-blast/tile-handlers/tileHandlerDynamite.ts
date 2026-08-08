import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { Presenter } from "../presenter"
import { FieldQueries } from "../fieldQueries"

export type TileHandlerDynamiteProps = {
	fieldQueries: FieldQueries
	presenter: Pick<Presenter, "removeTilesFromCenter">
} & TileHandlerProps

export class TileHandlerDynamite extends TileHandlerSpecial {
	private readonly fieldQueries: TileHandlerDynamiteProps["fieldQueries"]
	private readonly presenter: TileHandlerDynamiteProps["presenter"]

	readonly comboSize = this.gameRules.DYNAMITE_COMBO_SIZE
	readonly kind = "dynamite"

	constructor(props: TileHandlerDynamiteProps) {
		super({ gameRules: props.gameRules })
		this.fieldQueries = props.fieldQueries
		this.presenter = props.presenter
	}

	onClick(tile: Tile): TileRemovingInfo {
		const tiles = new Set(this.fieldQueries.getTiles())
		const positions = new Set(this.fieldQueries.getPositions())
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
