import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { FieldQueries } from "../fieldQueries"
import { Presenter } from "../presenter"

export type TileHandlerBombProps = {
	fieldQueries: FieldQueries
	presenter: Pick<Presenter, "removeTilesFromCenter">
} & TileHandlerProps

export class TileHandlerBomb extends TileHandlerSpecial {
	private readonly fieldQueries: TileHandlerBombProps["fieldQueries"]
	private readonly presenter: TileHandlerBombProps["presenter"]

	readonly comboSize = 6
	readonly kind = "bomb"

	constructor(props: TileHandlerBombProps) {
		super({ gameRules: props.gameRules })
		this.fieldQueries = props.fieldQueries
		this.presenter = props.presenter
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.fieldQueries.getTilesInRadius(
			tile.getPosition(),
			this.gameRules.TILE_BOMB_RADIUS
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
