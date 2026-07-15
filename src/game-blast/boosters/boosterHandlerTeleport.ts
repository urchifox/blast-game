import { BoosterCommonProps } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { Tile } from "../tile"
import { GameRules } from "../gameRules"
import { FieldManipulator } from "../fieldManipulator"
import { TileRemovingInfo } from "../types"

type BoosterHandlerTeleportProps = {
	fieldManipulator: Pick<FieldManipulator, "selectTile" | "swapTiles">
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterHandlerTeleport extends BoosterHandler {
	private readonly fieldManipulator: BoosterHandlerTeleportProps["fieldManipulator"]

	private selectedTile: Tile | null = null

	constructor(props: BoosterHandlerTeleportProps) {
		super({
			name: "teleport",
			initialValue: props.gameRules.BOOSTER_TELEPORT_COUNT,
			gameRules: props.gameRules,
			...props.boosterProps,
		})
		this.fieldManipulator = props.fieldManipulator
	}

	use(tile: Tile): TileRemovingInfo {
		if (this.selectedTile === null) {
			this.selectedTile = tile
			this.fieldManipulator.selectTile(tile)
			return null
		}

		const selectedTile = this.selectedTile
		this.selectedTile = null
		this.spend()
		this.fieldManipulator.swapTiles(selectedTile, tile)
		return null
	}

	override clear() {
		super.clear()
		this.selectedTile = null
	}
}
