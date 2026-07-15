import { TileHandler, TileHandlerProps } from "./tileHandler"
import { TileRemovingInfo } from "../types"
import { Tile, TilePosition } from "../tile"
import { Presenter } from "../presenter"

export type TileHandlerNormalProps = {
	presenter: Pick<
		Presenter,
		"getSameKindNeighbourTiles" | "removeTiles" | "renderTile"
	>
	getComboPrize: (comboSize: number, position: TilePosition) => Tile | undefined
} & TileHandlerProps

export class TileHandlerNormal extends TileHandler {
	private readonly presenter: TileHandlerNormalProps["presenter"]
	private readonly getComboPrize: TileHandlerNormalProps["getComboPrize"]

	constructor(props: TileHandlerNormalProps) {
		super({ gameRules: props.gameRules })
		this.presenter = props.presenter
		this.getComboPrize = props.getComboPrize
	}

	onClick(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.presenter.getSameKindNeighbourTiles(tile)
		if (tiles.size < this.gameRules.MIN_COMBO_SIZE) {
			return null
		}

		const removeTilesPromise = this.presenter.removeTiles(tiles)
		const newTile = this.getComboPrize(tiles.size, tile.getPosition())

		return {
			removedTiles: tiles,
			removedPositions: positions,
			removingPromise: removeTilesPromise.then(() => {
				if (newTile !== undefined) {
					return this.presenter.renderTile(newTile)
				}
			}),
		}
	}
}
