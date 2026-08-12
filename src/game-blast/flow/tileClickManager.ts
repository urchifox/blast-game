import { Tile } from "../domain/tile"
import { TileClickHandler } from "../domain/tileClickHandler"
import { ActionManager } from "./actionManager"

export type TileClickManagerProps = {
	actionManager: ActionManager
	tileClickHandler: TileClickHandler
}

export class TileClickManager {
	private readonly actionManager: TileClickManagerProps["actionManager"]
	private readonly tileClickHandler: TileClickManagerProps["tileClickHandler"]

	constructor(props: TileClickManagerProps) {
		this.actionManager = props.actionManager
		this.tileClickHandler = props.tileClickHandler
	}

	onClick(tile: Tile) {
		const commands = this.tileClickHandler.onClick(tile)
		if (commands === null) {
			return null
		}

		return this.actionManager.doCommands(commands)
	}
}
