import { Tile } from "../domain/tile"
import { TileHandler } from "../domain/tileHandler"
import { ActionManager } from "./actionManager"

export type TilesManagerProps = {
	actionManager: ActionManager
	tileHandler: TileHandler
}

export class TilesManager {
	private readonly actionManager: TilesManagerProps["actionManager"]
	private readonly tileHandler: TilesManagerProps["tileHandler"]

	constructor(props: TilesManagerProps) {
		this.actionManager = props.actionManager
		this.tileHandler = props.tileHandler
	}

	onClick(tile: Tile) {
		const commands = this.tileHandler.onClick(tile)
		if (commands === null) {
			return null
		}

		return this.actionManager.doCommands(commands)
	}

	onRemove(tile: Tile) {
		const commands = this.tileHandler.onRemove(tile)
		if (commands === null) {
			return null
		}

		return this.actionManager.doCommands(commands)
	}
}
