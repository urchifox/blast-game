import { Tile } from "../domain/tile"
import { TileClickHandler } from "../domain/tileClickHandler"
import { Action, ActionManager, ActionName } from "../actionManager"
import { CommandName } from "../domain/command"

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

		const actions: Array<Action> = []

		commands.forEach(({ name, payload }) => {
			switch (name) {
				case CommandName.ADD: {
					actions.push({
						name: ActionName.ADD,
						payload: payload,
					})
					break
				}
				case CommandName.REMOVE: {
					actions.push({
						name: ActionName.REMOVE,
						payload: {
							centerPosition: tile.getPosition(),
							tiles: payload.tiles,
						},
					})
					break
				}
				case CommandName.SWAP: {
					actions.push({
						name: ActionName.SWAP,
						payload: payload,
					})
					break
				}
				default: {
					break
				}
			}
		})

		return this.actionManager.act(actions)
	}
}
