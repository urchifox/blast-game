import { BoosterHandler, BoosterHandlerProps, BoosterHandlerResult } from "./boosterHandler"
import { Tile } from "../domain/tile"
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

	use(tile: Tile): BoosterHandlerResult["actResult"] {
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
		return this.actionManager.act([
			{
				name: ActionName.SWAP,
				payload: [selectedTile, tile],
			},
		])
	}

	override clear() {
		super.clear()
		this.selectedTile = null
	}
}
