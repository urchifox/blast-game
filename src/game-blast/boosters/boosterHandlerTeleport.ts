import { BoosterCommonProps } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { Tile } from "../tile"
import { GameRules } from "../gameRules"
import { TileRemovingInfo } from "../types"
import { Presenter } from "../presenter"

type BoosterHandlerTeleportProps = {
	presenter: Pick<Presenter, "selectTile" | "swapTiles">
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterHandlerTeleport extends BoosterHandler {
	private readonly presenter: BoosterHandlerTeleportProps["presenter"]

	private selectedTile: Tile | null = null

	constructor(props: BoosterHandlerTeleportProps) {
		super({
			name: "teleport",
			initialValue: props.gameRules.BOOSTER_TELEPORT_COUNT,
			gameRules: props.gameRules,
			...props.boosterProps,
		})
		this.presenter = props.presenter
	}

	use(tile: Tile): TileRemovingInfo {
		if (this.selectedTile === null) {
			this.selectedTile = tile
			this.presenter.selectTile(tile)
			return null
		}

		const selectedTile = this.selectedTile
		this.selectedTile = null
		this.spend()
		const promise = this.presenter.swapTiles(selectedTile, tile)
		return {
			removedTiles: new Set(),
			removedPositions: new Set(),
			removingPromise: promise,
		}
	}

	override clear() {
		super.clear()
		this.selectedTile = null
	}
}
