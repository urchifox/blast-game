import { BoosterHandler, BoosterHandlerProps } from "./boosterHandler"
import { Tile } from "../tile"
import { TileRemovingInfo } from "../types"
import { FieldQueries } from "../fieldQueries"
import { Presenter } from "../presenter"

export type BoosterHandlerBombProps = BoosterHandlerProps & {
	fieldQueries: FieldQueries
	presenter: Pick<Presenter, "removeTilesFromCenter">
}

export class BoosterHandlerBomb extends BoosterHandler {
	private readonly fieldQueries: BoosterHandlerBombProps["fieldQueries"]
	private readonly presenter: BoosterHandlerBombProps["presenter"]

	constructor(props: BoosterHandlerBombProps) {
		super(props)
		this.fieldQueries = props.fieldQueries
		this.presenter = props.presenter
	}

	use(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.fieldQueries.getTilesInRadius(
			tile.getPosition(),
			this.gameRules.BOOSTER_BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return null
		}

		this.spend()
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
