import { Tile, TilePosition } from "./tile"

export type TileClickHandler = (tile: Tile) => TileRemovingInfo
export type TileRemovingInfo = {
	removedTiles: Set<Tile>
	removedPositions: Set<TilePosition>
	removingPromise: Promise<void>
} | null
