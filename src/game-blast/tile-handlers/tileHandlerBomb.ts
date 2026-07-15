import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { Presenter } from "../presenter"

export type TileHandlerBombProps = {
	presenter: Pick<Presenter, "getTilesInRadius" | "removeTilesFromCenter">
} & TileHandlerProps

export class TileHandlerBomb extends TileHandlerSpecial {
	private readonly presenter: TileHandlerBombProps["presenter"]

	readonly comboSize = 6
	readonly kind = "bomb"

	constructor(props: TileHandlerBombProps) {
		super({ gameRules: props.gameRules })
		this.presenter = props.presenter
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.presenter.getTilesInRadius(
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
