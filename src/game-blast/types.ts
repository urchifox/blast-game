import { BoosterHandlerBomb } from "./boosters/boosterHandlerBomb"
import { BoosterHandlerTeleport } from "./boosters/boosterHandlerTeleport"
import { Tile, TilePosition } from "./tile"

export type TileClickHandler = (tile: Tile) => TileRemovingInfo

export type BoosterHandlerResult = {
	isUsed: boolean
	tileRemovingInfo: TileRemovingInfo
}

export type TileRemovingInfo = {
	removedTiles: Set<Tile>
	removedPositions: Set<TilePosition>
	removingPromise: Promise<void>
} | null

export enum GameCompletionStatus {
	WIN = "win",
	LOSS = "loss",
	IN_PROGRESS = "in_progress",
}

export type BoostersHandlersMap = {
	bomb: BoosterHandlerBomb
	teleport: BoosterHandlerTeleport
}

export type BoosterName = keyof BoostersHandlersMap
