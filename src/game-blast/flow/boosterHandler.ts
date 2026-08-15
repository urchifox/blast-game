import { Booster } from "./booster"
import { Tile } from "../domain/tile"
import { ActionManager, ActionName, ActResult } from "./actionManager"
import { BoosterUseHandler } from "../domain/boosterUseHandler"
import { BoosterName } from "../domain/types"

export type BoosterHandlerResult = {
	isUsed: boolean
	actResult: ActResult | null
}

export type BoosterHandlerProps = {
	name: BoosterName
	booster: Booster
	boosterUseHandler: BoosterUseHandler
	actionManager: ActionManager
}

export class BoosterHandler {
	private readonly name: BoosterHandlerProps["name"]
	private readonly booster: BoosterHandlerProps["booster"]
	private readonly boosterUseHandler: BoosterHandlerProps["boosterUseHandler"]
	private readonly actionManager: BoosterHandlerProps["actionManager"]

	constructor(props: BoosterHandlerProps) {
		this.name = props.name
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

		this.booster.spend()
		return this.actionManager.doCommands(commands)
	}

	clear() {
		this.reset()
	}

	reset() {
		this.booster.reset()
	}

	maybeUse(tiles: Array<Tile>) {
		if (this.booster.isActivated()) {
			const result = this.use(tiles)
			if (result !== null) {
				return result
			}
		}
		tiles.forEach((tile) => {
			this.actionManager.doActions([
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
