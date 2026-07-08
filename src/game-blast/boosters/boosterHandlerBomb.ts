import { BoosterCommonProps } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { BOOSTER_BOMB_RADIUS, BOOSTER_BOMBS_COUNT } from "../config"
import { Tile, TilePosition } from "../tile"
import { TileClickHandlerResult } from "../types"

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
}

export class BoosterHandlerBomb extends BoosterHandler {
	private getTilesInRadius: BoosterHandlerBombProps["getTilesInRadius"]
	private removeTilesFromCenter: BoosterHandlerBombProps["removeTilesFromCenter"]
	private processRemovingTiles: BoosterHandlerBombProps["processRemovingTiles"]

	constructor({
		getTilesInRadius,
		removeTilesFromCenter,
		processRemovingTiles,
		boosterProps,
	}: BoosterHandlerBombProps) {
		super({
			name: "bomb",
			initialValue: BOOSTER_BOMBS_COUNT,
			...boosterProps,
		})
		this.getTilesInRadius = getTilesInRadius
		this.removeTilesFromCenter = removeTilesFromCenter
		this.processRemovingTiles = processRemovingTiles
	}

	use(tile: Tile) {
		const { tiles, positions } = this.getTilesInRadius(
			tile.getPosition(),
			BOOSTER_BOMB_RADIUS
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
