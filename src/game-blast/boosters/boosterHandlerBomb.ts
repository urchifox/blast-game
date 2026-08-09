import {
	BoosterHandler,
	BoosterHandlerProps,
	BoosterHandlerResult,
} from "./boosterHandler"
import { Tile } from "../domain/tile"
import { FieldQueries } from "../domain/fieldQueries"
import { ActionManager, ActionName } from "../actionManager"

export type BoosterHandlerBombProps = BoosterHandlerProps & {
	fieldQueries: FieldQueries
	actionManager: ActionManager
}

export class BoosterHandlerBomb extends BoosterHandler {
	private readonly fieldQueries: BoosterHandlerBombProps["fieldQueries"]
	private readonly actionManager: BoosterHandlerBombProps["actionManager"]

	constructor(props: BoosterHandlerBombProps) {
		super(props)
		this.fieldQueries = props.fieldQueries
		this.actionManager = props.actionManager
	}

	use(tile: Tile): BoosterHandlerResult["actResult"] {
		const { tiles } = this.fieldQueries.getTilesInRadius(
			tile.getPosition(),
			this.gameRules.BOOSTER_BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return null
		}

		this.spend()
		return this.actionManager.act([
			{
				name: ActionName.REMOVE,
				payload: {
					centerPosition: tile.getPosition(),
					tiles: tiles,
				},
			},
		])
	}
}
