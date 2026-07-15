import { Tile } from "../tile"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileRemovingInfo } from "../types"
import { TileHandlerProps } from "./tileHandler"
import { Presenter } from "../presenter"

export type TileHandlerDynamiteProps = {
	presenter: Pick<
		Presenter,
		"removeTilesFromCenter" | "getTiles" | "getPositions"
	>
} & TileHandlerProps

export class TileHandlerDynamite extends TileHandlerSpecial {
	private readonly presenter: TileHandlerDynamiteProps["presenter"]

	readonly comboSize = 8
	readonly kind = "dynamite"

	constructor(props: TileHandlerDynamiteProps) {
		super({ gameRules: props.gameRules })
		this.presenter = props.presenter
	}

	onClick(tile: Tile): TileRemovingInfo {
		const tiles = new Set(this.presenter.getTiles())
		const positions = new Set(this.presenter.getPositions())
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
