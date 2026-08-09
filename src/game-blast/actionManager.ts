import { Tile, TileKind, TilePosition } from "./domain/tile"
import { Presenter } from "./presenter"

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
	presenter: Presenter
}

export class ActionManager {
	private readonly presenter: ActionManagerProps["presenter"]

	constructor(props: ActionManagerProps) {
		this.presenter = props.presenter
	}

	async act(actions: Array<Action>) {
		const results: Array<ActionResult> = []

		for (const action of actions) {
			const result = await this.getActionResult(action)
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

	private async add(
		payload: ActionPayloadMap[ActionName.ADD]
	): Promise<ActionResultMap[ActionName.ADD]> {
		const tile = this.presenter.addTile(payload)
		await this.presenter.renderTile(tile)
		return { addedTile: tile }
	}

	private async remove(
		payload: ActionPayloadMap[ActionName.REMOVE]
	): Promise<ActionResultMap[ActionName.REMOVE]> {
		await this.presenter.removeTilesFromCenter(
			payload.tiles,
			payload.centerPosition
		)
		return { removedTiles: payload.tiles }
	}

	private select(
		payload: ActionPayloadMap[ActionName.SELECT]
	): ActionResultMap[ActionName.SELECT] {
		this.presenter.selectTile(payload)
		return { selectedTile: payload }
	}

	private async swap(
		payload: ActionPayloadMap[ActionName.SWAP]
	): Promise<ActionResultMap[ActionName.SWAP]> {
		await this.presenter.swapTiles(...payload)
		return { swappedTiles: payload }
	}
}
