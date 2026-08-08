import { Tile, TilePosition } from "./domain/tile"

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
