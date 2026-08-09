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

export type ActionManagerProps = {
	presenter: Presenter
}

export class ActionManager {
	private readonly presenter: ActionManagerProps["presenter"]

	constructor(props: ActionManagerProps) {
		this.presenter = props.presenter
	}

	async act(actions: Array<Action>) {
		for (const { name: action, payload } of actions) {
			switch (action) {
				case ActionName.ADD: {
					await this.add(payload)
					break
				}
				case ActionName.REMOVE: {
					await this.remove(payload)
					break
				}
				case ActionName.SELECT: {
					this.select(payload)
					break
				}
				case ActionName.SWAP: {
					await this.swap(payload)
					break
				}
				default: {
					break
				}
			}
		}
	}

	private add(payload: ActionPayloadMap[ActionName.ADD]) {
		const tile = this.presenter.addTile(payload)
		return this.presenter.renderTile(tile)
	}

	private remove(payload: ActionPayloadMap[ActionName.REMOVE]) {
		return this.presenter.removeTilesFromCenter(
			payload.tiles,
			payload.centerPosition
		)
	}

	private select(payload: ActionPayloadMap[ActionName.SELECT]) {
		return this.presenter.selectTile(payload)
	}

	private swap(payload: ActionPayloadMap[ActionName.SWAP]) {
		return this.presenter.swapTiles(...payload)
	}
}
