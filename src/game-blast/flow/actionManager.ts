import { Command, CommandName } from "../domain/command"
import { Tile, TileKind, TilePosition } from "../domain/tile"
import { PresenterContract } from "../types"

export type Action<T extends ActionName = ActionName> = {
	[K in T]: {
		name: K
		payload: ActionPayloadMap[K]
	}
}[T]

export enum ActionName {
	ADD = "add",
	REMOVE = "remove",
	SELECT = "select",
	SWAP = "swap",
}

export type ActionPayloadMap = {
	[ActionName.ADD]: {
		kind: TileKind
		position: TilePosition
	}
	[ActionName.REMOVE]: {
		centerPosition: TilePosition
		tiles: Set<Tile>
	}
	[ActionName.SELECT]: Tile
	[ActionName.SWAP]: [Tile, Tile]
}

export type ActionResultMap = {
	[ActionName.ADD]: { addedTile: Tile }
	[ActionName.REMOVE]: { removedTiles: Set<Tile> }
	[ActionName.SELECT]: { selectedTile: Tile }
	[ActionName.SWAP]: { swappedTiles: [Tile, Tile] }
}

export type ActionResult<T extends ActionName = ActionName> = ActionResultMap[T]

export type ActResult = {
	addedTiles: Set<Tile>
	removedTiles: Set<Tile>
	selectedTiles: Set<Tile>
	swappedTiles: Set<[Tile, Tile]>
}

export type ActionManagerProps = {
	presenter: PresenterContract
}

export class ActionManager {
	private readonly presenter: ActionManagerProps["presenter"]

	constructor(props: ActionManagerProps) {
		this.presenter = props.presenter
	}

	doCommands(commands: Array<Command>) {
		const actions = this.convertCommandToAction(commands)
		return this.doActions(actions)
	}

	private convertCommandToAction(commands: Array<Command>) {
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
							centerPosition: payload.removingFromPosition,
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

		return actions
	}

	doActions(actions: Array<Action>) {
		const results: Array<ActionResult> = []

		for (const action of actions) {
			const result = this.getActionResult(action)
			if (result !== null) {
				results.push(result)
			}
		}

		const actResult: ActResult = {
			addedTiles: new Set(),
			removedTiles: new Set(),
			selectedTiles: new Set(),
			swappedTiles: new Set(),
		}
		for (const result of results) {
			if ("addedTile" in result) {
				actResult.addedTiles.add(result.addedTile)
			}
			if ("removedTiles" in result) {
				result.removedTiles.forEach((tile) => actResult.removedTiles.add(tile))
			}
			if ("selectedTile" in result) {
				actResult.selectedTiles.add(result.selectedTile)
			}
			if ("swappedTiles" in result) {
				actResult.swappedTiles.add(result.swappedTiles)
			}
		}
		return actResult
	}

	private getActionResult(action: Action) {
		const { name, payload } = action
		switch (name) {
			case ActionName.ADD: {
				return this.add(payload)
			}
			case ActionName.REMOVE: {
				return this.remove(payload)
			}
			case ActionName.SELECT: {
				return this.select(payload)
			}
			case ActionName.SWAP: {
				return this.swap(payload)
			}
			default: {
				return null
			}
		}
	}

	private add(
		payload: ActionPayloadMap[ActionName.ADD]
	): ActionResultMap[ActionName.ADD] {
		const tile = this.presenter.addTile(payload)
		this.presenter.renderTile(tile)
		return { addedTile: tile }
	}

	private remove(
		payload: ActionPayloadMap[ActionName.REMOVE]
	): ActionResultMap[ActionName.REMOVE] {
		this.presenter.removeTilesFromCenter(payload.tiles, payload.centerPosition)
		return { removedTiles: payload.tiles }
	}

	private select(
		payload: ActionPayloadMap[ActionName.SELECT]
	): ActionResultMap[ActionName.SELECT] {
		this.presenter.selectTile(payload)
		return { selectedTile: payload }
	}

	private swap(
		payload: ActionPayloadMap[ActionName.SWAP]
	): ActionResultMap[ActionName.SWAP] {
		this.presenter.swapTiles(...payload)
		return { swappedTiles: payload }
	}
}
