import { BoosterHandler } from "./boosterHandler"
import { Tile } from "../tile"
import { TileClickHandlerResult } from "../types"
import { BoosterCommonProps } from "./booster"
import { GameRules } from "../gameRules"
import { FieldManipulator } from "../fieldManipulator"

type InnerFieldManipulator = Pick<
	FieldManipulator,
	"getTilesInRadius" | "removeTilesFromCenter"
>

export type BoosterHandlerBombProps = {
	innerFieldManipulator: InnerFieldManipulator
	processRemovingTiles: (result: TileClickHandlerResult) => void
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterHandlerBomb extends BoosterHandler {
	private readonly innerFieldManipulator: BoosterHandlerBombProps["innerFieldManipulator"]
	private readonly processRemovingTiles: BoosterHandlerBombProps["processRemovingTiles"]

	constructor({
		innerFieldManipulator,
		processRemovingTiles,
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
		this.processRemovingTiles = processRemovingTiles
	}

	use(tile: Tile) {
		const { tiles, positions } = this.innerFieldManipulator.getTilesInRadius(
			tile.getPosition(),
			this.gameRules.BOOSTER_BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return
		}

		this.spend()
		const removingPromise = this.innerFieldManipulator.removeTilesFromCenter(
			tiles,
			tile.getPosition()
		)
		this.processRemovingTiles({
			removedTiles: tiles,
			removedPositions: positions,
			removingPromise: removingPromise,
		})
	}
}
