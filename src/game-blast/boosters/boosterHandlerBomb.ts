import { BoosterHandler } from "./boosterHandler"
import { Tile } from "../tile"
import { TileRemovingInfo } from "../types"
import { BoosterCommonProps } from "./booster"
import { GameRules } from "../gameRules"
import { FieldManipulator } from "../fieldManipulator"

type InnerFieldManipulator = Pick<
	FieldManipulator,
	"getTilesInRadius" | "removeTilesFromCenter"
>

export type BoosterHandlerBombProps = {
	innerFieldManipulator: InnerFieldManipulator
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterHandlerBomb extends BoosterHandler {
	private readonly innerFieldManipulator: BoosterHandlerBombProps["innerFieldManipulator"]

	constructor({
		innerFieldManipulator,
		gameRules,
		boosterProps,
	}: BoosterHandlerBombProps) {
		super({
			name: "bomb",
			initialValue: gameRules.BOOSTER_BOMBS_COUNT,
			gameRules,
			...boosterProps,
		})
		this.innerFieldManipulator = innerFieldManipulator
	}

	use(tile: Tile): TileRemovingInfo {
		const { tiles, positions } = this.innerFieldManipulator.getTilesInRadius(
			tile.getPosition(),
			this.gameRules.BOOSTER_BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return null
		}

		this.spend()
		const removingPromise = this.innerFieldManipulator.removeTilesFromCenter(
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
