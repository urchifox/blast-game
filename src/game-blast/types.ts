import { Tile, TilePosition } from "./tile"

export type TileClickHandler = (tile: Tile) => TileClickHandlerResult
export type TileClickHandlerResult = {
	removedTiles: Set<Tile>
	removedPositions: Set<TilePosition>
	removingPromise: Promise<void>
} | null
