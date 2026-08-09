import { Booster } from "./booster"
import { Tile } from "../domain/tile"
import { Action, ActionManager, ActionName, ActResult } from "../actionManager"
import { BoosterUseHandler } from "../domain/boosterUseHandler"
import { BoosterName } from "../domain/types"
import { CommandName } from "../domain/command"

export type BoosterHandlerResult = {
	isUsed: boolean
	actResult: Promise<ActResult> | null
}

export type BoosterHandlerProps = {
	name: BoosterName
	tilesCountForUse: number
	booster: Booster
	boosterUseHandler: BoosterUseHandler
	actionManager: ActionManager
}

export class BoosterHandler {
	protected readonly tilesCountForUse: BoosterHandlerProps["tilesCountForUse"]
	private readonly name: BoosterHandlerProps["name"]
	private readonly booster: BoosterHandlerProps["booster"]
	private readonly boosterUseHandler: BoosterHandlerProps["boosterUseHandler"]
	private readonly actionManager: BoosterHandlerProps["actionManager"]

	constructor(props: BoosterHandlerProps) {
		this.name = props.name
		this.tilesCountForUse = props.tilesCountForUse
		this.booster = props.booster
		this.boosterUseHandler = props.boosterUseHandler
		this.actionManager = props.actionManager
	}

	use(tiles: Array<Tile>) {
		const commands = this.boosterUseHandler.use({
			boosterName: this.name,
			tiles: tiles,
		})
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
							centerPosition: tiles[0].getPosition(),
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

		this.booster.spend()
		return this.actionManager.act(actions)
	}

	clear() {
		this.booster.clear()
	}

	setInitialValue() {
		this.booster.setInitialValue()
		this.booster.renderCounter()
	}

	maybeUse(tiles: Array<Tile>) {
		if (this.booster.isActivated() && tiles.length === this.tilesCountForUse) {
			return this.use(tiles)
		}
		tiles.forEach((tile) => {
			this.actionManager.act([
				{
					name: ActionName.SELECT,
					payload: tile,
				},
			])
		})
		return null
	}

	tryActivate() {
		return this.booster.tryActivate()
	}
}
