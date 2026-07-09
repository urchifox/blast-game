import { BoosterCommonProps } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { Tile } from "../tile"
import { GameRules } from "../gameRules"

type BoosterHandlerTeleportProps = {
	selectTile: (tile: Tile) => void
	swapTiles: (tile1: Tile, tile2: Tile) => void
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterHandlerTeleport extends BoosterHandler {
	private selectTile: BoosterHandlerTeleportProps["selectTile"]
	private swapTiles: BoosterHandlerTeleportProps["swapTiles"]
	private selectedTile: Tile | null = null

	constructor({
		boosterProps,
		selectTile,
		swapTiles,
		gameRules,
	}: BoosterHandlerTeleportProps) {
		super({
			name: "teleport",
			initialValue: gameRules.BOOSTER_TELEPORT_COUNT,
			gameRules,
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
