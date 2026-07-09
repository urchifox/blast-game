import { BoosterHandlerBomb } from "./boosterHandlerBomb"
import { TilePosition, Tile } from "../tile"
import { BoosterHandlerTeleport } from "./boosterHandlerTeleport"
import { TileClickHandlerResult } from "../types"
import { BoosterCommonProps, BoosterName } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { GameRules } from "../gameRules"

export type BoosterManagerProps = {
	selectTile: (tile: Tile) => void
	swapTiles: (tile1: Tile, tile2: Tile) => void
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

export class BoosterManager {
	private boostersHandlersMap: Record<BoosterName, BoosterHandler>
	private boostersHandlers: Array<BoosterHandler>

	constructor({
		selectTile,
		swapTiles,
		getTilesInRadius,
		removeTilesFromCenter,
		processRemovingTiles,
		boosterProps,
		gameRules,
	}: BoosterManagerProps) {
		this.boostersHandlersMap = {
			bomb: new BoosterHandlerBomb({
				boosterProps,
				getTilesInRadius,
				removeTilesFromCenter,
				processRemovingTiles,
				gameRules,
			}),
			teleport: new BoosterHandlerTeleport({
				boosterProps,
				selectTile,
				swapTiles,
				gameRules,
			}),
		}
		this.boostersHandlers = Object.values(this.boostersHandlersMap)
	}

	clear() {
		for (const handler of this.boostersHandlers) {
			handler.clear()
		}
	}

	setInitialValue() {
		for (const handler of this.boostersHandlers) {
			handler.setInitialValue()
		}
	}

	maybeUseBooster(tile: Tile) {
		for (const handler of this.boostersHandlers) {
			const isBoosterUsed = handler.maybeUse(tile)
			if (isBoosterUsed) {
				return true
			}
		}
		return false
	}

	onBoosterButtonClick(boosterName: BoosterName) {
		this.boostersHandlersMap[boosterName].tryActivate()
	}
}
