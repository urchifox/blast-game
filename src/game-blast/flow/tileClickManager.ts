import { Tile } from "../domain/tile"
import { TileHandler } from "../domain/tileHandler"
import { ActionManager } from "./actionManager"

export type TileClickManagerProps = {
	actionManager: ActionManager
	tileHandler: TileHandler
}

export class TileClickManager {
	private readonly actionManager: TileClickManagerProps["actionManager"]
	private readonly tileHandler: TileClickManagerProps["tileHandler"]

	constructor(props: TileClickManagerProps) {
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
}
