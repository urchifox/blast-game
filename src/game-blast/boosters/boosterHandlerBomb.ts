import { BoosterHandler } from "./boosterHandler"
import { Tile, TilePosition } from "../tile"
import { TileClickHandlerResult } from "../types"
import { BoosterCommonProps } from "./booster"
import { GameRules } from "../gameRules"

export type BoosterHandlerBombProps = {
	getTilesInRadius: (
		position: TilePosition,
		radius: number
	) => {
		tiles: Set<Tile>
		positions: Set<TilePosition>
	}
	removeTilesFromCenter: (
		tiles: Set<Tile>,
		centerPosition: TilePosition
	) => Promise<void>
	processRemovingTiles: (result: TileClickHandlerResult) => void
	boosterProps: BoosterCommonProps
	gameRules: GameRules
}

export class BoosterHandlerBomb extends BoosterHandler {
	private getTilesInRadius: BoosterHandlerBombProps["getTilesInRadius"]
	private removeTilesFromCenter: BoosterHandlerBombProps["removeTilesFromCenter"]
	private processRemovingTiles: BoosterHandlerBombProps["processRemovingTiles"]

	constructor({
		getTilesInRadius,
		removeTilesFromCenter,
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
		this.getTilesInRadius = getTilesInRadius
		this.removeTilesFromCenter = removeTilesFromCenter
		this.processRemovingTiles = processRemovingTiles
	}

	use(tile: Tile) {
		const { tiles, positions } = this.getTilesInRadius(
			tile.getPosition(),
			this.gameRules.BOOSTER_BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return
		}

		this.spend()
		const removingPromise = this.removeTilesFromCenter(
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
