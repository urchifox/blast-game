import { BoosterHandler } from "./boosterHandler"
import { Tile } from "../tile"
import { TileRemovingInfo } from "../types"
import { BoosterCommonProps } from "./booster"
import { GameRules } from "../gameRules"
import { Presenter } from "../presenter"
import { FieldQueries } from "../fieldQueries"

export type BoosterHandlerBombProps = {
	fieldQueries: FieldQueries
	presenter: Pick<Presenter, "removeTilesFromCenter">
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterHandlerBomb extends BoosterHandler {
	private readonly fieldQueries: BoosterHandlerBombProps["fieldQueries"]
	private readonly presenter: BoosterHandlerBombProps["presenter"]

	constructor(props: BoosterHandlerBombProps) {
		super({
			name: "bomb",
			initialValue: props.gameRules.BOOSTER_BOMBS_COUNT,
			gameRules: props.gameRules,
			...props.boosterProps,
		})
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
