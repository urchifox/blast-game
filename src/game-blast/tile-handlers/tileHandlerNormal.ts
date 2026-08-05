import { TileHandler, TileHandlerProps } from "./tileHandler"
import { TileRemovingInfo } from "../types"
import { Tile } from "../tile"
import { Presenter } from "../presenter"
import { FieldQueries } from "../fieldQueries"

export type TileHandlerNormalProps = {
	presenter: Pick<Presenter, "removeTiles">
	fieldQueries: FieldQueries
} & TileHandlerProps

export class TileHandlerNormal extends TileHandler {
	private readonly presenter: TileHandlerNormalProps["presenter"]
	private readonly fieldQueries: TileHandlerNormalProps["fieldQueries"]

	constructor(props: TileHandlerNormalProps) {
		super({ gameRules: props.gameRules })
		this.presenter = props.presenter
		this.fieldQueries = props.fieldQueries
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tiles, positions } =
			this.fieldQueries.getSameKindNeighbourTiles(tile)
		if (tiles.size < this.gameRules.MIN_COMBO_SIZE) {
			return null
		}

		const removingPromise = this.presenter.removeTiles(tiles)

		return {
			removedTiles: tiles,
			removedPositions: positions,
			removingPromise: removingPromise,
		}
	}
}
