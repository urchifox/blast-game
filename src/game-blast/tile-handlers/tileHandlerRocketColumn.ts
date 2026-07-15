import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { Presenter } from "../presenter"

export type TileHandlerRocketColumnProps = {
	presenter: Pick<Presenter, "getTilesInColumn" | "removeTilesFromCenter">
} & TileHandlerProps

export class TileHandlerRocketColumn extends TileHandlerSpecial {
	private readonly presenter: TileHandlerRocketColumnProps["presenter"]

	readonly comboSize = 4
	readonly kind = "rockets-column"

	constructor(props: TileHandlerRocketColumnProps) {
		super({ gameRules: props.gameRules })
		this.presenter = props.presenter
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.presenter.getTilesInColumn(
			tile.getPosition().column
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
