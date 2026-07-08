import { BoosterCommonProps } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { BOOSTER_TELEPORT_COUNT } from "./config"
import { Tile } from "./tile"

type BoosterHandlerTeleportProps = {
	selectTile: (tile: Tile) => void
	swapTiles: (tile1: Tile, tile2: Tile) => void
	boosterProps: BoosterCommonProps
}

export class BoosterHandlerTeleport extends BoosterHandler {
	private selectTile: BoosterHandlerTeleportProps["selectTile"]
	private swapTiles: BoosterHandlerTeleportProps["swapTiles"]
	private selectedTile: Tile | null = null

	constructor({
		boosterProps,
		selectTile,
		swapTiles,
	}: BoosterHandlerTeleportProps) {
		super({
			name: "teleport",
			initialValue: BOOSTER_TELEPORT_COUNT,
			...boosterProps,
		})
		this.selectTile = selectTile
		this.swapTiles = swapTiles
	}

	use(tile: Tile) {
		if (this.selectedTile === null) {
			this.selectedTile = tile
			this.selectTile(tile)
			return
		}

		const selectedTile = this.selectedTile
		this.selectedTile = null
		this.spend()
		this.swapTiles(selectedTile, tile)
	}

	override clear() {
		super.clear()
		this.selectedTile = null
	}
}
