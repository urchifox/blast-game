import { Command, CommandName } from "./command"
import { FieldQueries } from "./fieldQueries"
import { GameRules } from "./gameRules"
import { Tile } from "./tile"
import { BoosterName } from "./types"

export type BoosterUseHandlerProps = {
	gameRules: GameRules
	fieldQueries: FieldQueries
}

export class BoosterUseHandler {
	private readonly gameRules: BoosterUseHandlerProps["gameRules"]
	private readonly fieldQueries: BoosterUseHandlerProps["fieldQueries"]

	constructor(props: BoosterUseHandlerProps) {
		this.gameRules = props.gameRules
		this.fieldQueries = props.fieldQueries
	}

	use({
		boosterName,
		tiles,
	}: {
		boosterName: BoosterName
		tiles: Array<Tile>
	}): Array<Command> | null {
		const commands: Array<Command> = []

		switch (boosterName) {
			case "bomb": {
				const { tiles: tilesInRadius } = this.fieldQueries.getTilesInRadius(
					tiles[0].getPosition(),
					this.gameRules.BOOSTER_BOMB_RADIUS
				)
				commands.push({
					name: CommandName.REMOVE,
					payload: {
						tiles: tilesInRadius,
						removingFromPosition: tiles[0].getPosition(),
					},
				})
				break
			}
			case "teleport": {
				commands.push({
					name: CommandName.SWAP,
					payload: [tiles[0], tiles[1]],
				})
				break
			}
			default: {
				break
			}
		}

		return commands.length > 0 ? commands : null
	}
}
