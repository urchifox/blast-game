import { BoosterCommonProps } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { Tile } from "../tile"
import { GameRules } from "../gameRules"
import { FieldManipulator } from "../fieldManipulator"
import { TileRemovingInfo } from "../types"

type InnerFieldManipulator = Pick<FieldManipulator, "selectTile" | "swapTiles">

type BoosterHandlerTeleportProps = {
	innerFieldManipulator: InnerFieldManipulator
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterHandlerTeleport extends BoosterHandler {
	private readonly innerFieldManipulator: BoosterHandlerTeleportProps["innerFieldManipulator"]
	private selectedTile: Tile | null = null

	constructor(props: BoosterHandlerTeleportProps) {
		super({
			name: "teleport",
			initialValue: props.gameRules.BOOSTER_TELEPORT_COUNT,
			gameRules: props.gameRules,
			...props.boosterProps,
		})
		this.innerFieldManipulator = props.innerFieldManipulator
	}

	use(tile: Tile): TileRemovingInfo {
		if (this.selectedTile === null) {
			this.selectedTile = tile
			this.innerFieldManipulator.selectTile(tile)
			return null
		}

		const selectedTile = this.selectedTile
		this.selectedTile = null
		this.spend()
		this.innerFieldManipulator.swapTiles(selectedTile, tile)
		return null
	}

	override clear() {
		super.clear()
		this.selectedTile = null
	}
}
