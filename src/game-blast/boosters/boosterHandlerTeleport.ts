import { BoosterHandler, BoosterHandlerProps } from "./boosterHandler"
import { Tile } from "../domain/tile"
import { TileRemovingInfo } from "../types"
import { ActionManager, ActionName } from "../actionManager"

type BoosterHandlerTeleportProps = BoosterHandlerProps & {
	actionManager: ActionManager
}

export class BoosterHandlerTeleport extends BoosterHandler {
	private readonly actionManager: BoosterHandlerTeleportProps["actionManager"]

	private selectedTile: Tile | null = null

	constructor(props: BoosterHandlerTeleportProps) {
		super(props)
		this.actionManager = props.actionManager
	}

	use(tile: Tile): TileRemovingInfo {
		if (this.selectedTile === null) {
			this.selectedTile = tile
			this.actionManager.act([
				{
					name: ActionName.SELECT,
					payload: tile,
				},
			])
			return null
		}

		const selectedTile = this.selectedTile
		this.selectedTile = null
		this.spend()
		const promise = this.actionManager.act([
			{
				name: ActionName.SWAP,
				payload: [selectedTile, tile],
			},
		])
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
