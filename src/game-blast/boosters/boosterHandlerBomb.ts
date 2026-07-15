import { BoosterHandler } from "./boosterHandler"
import { Tile } from "../tile"
import { TileRemovingInfo } from "../types"
import { BoosterCommonProps } from "./booster"
import { GameRules } from "../gameRules"
import { FieldManipulator } from "../fieldManipulator"

export type BoosterHandlerBombProps = {
	fieldManipulator: Pick<
		FieldManipulator,
		"getTilesInRadius" | "removeTilesFromCenter"
	>
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterHandlerBomb extends BoosterHandler {
	private readonly fieldManipulator: BoosterHandlerBombProps["fieldManipulator"]

	constructor(props: BoosterHandlerBombProps) {
		super({
			name: "bomb",
			initialValue: props.gameRules.BOOSTER_BOMBS_COUNT,
			gameRules: props.gameRules,
			...props.boosterProps,
		})
		this.fieldManipulator = props.fieldManipulator
	}

	use(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.fieldManipulator.getTilesInRadius(
			tile.getPosition(),
			this.gameRules.BOOSTER_BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return null
		}

		this.spend()
		const removingPromise = this.fieldManipulator.removeTilesFromCenter(
			tiles,
			tile.getPosition()
		)
		return {
			removedTiles: tiles,
			removedPositions: positions,
			removingPromise: removingPromise,
		}
	}
}
