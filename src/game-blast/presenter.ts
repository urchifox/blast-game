import { Tile, TileKind, TilePosition } from "./tile"

export type Presenter = {
	init: (onTileClick: (id: string) => void) => Promise<void>
	destroy: () => void
	clear: () => Promise<void>
	create: (props: { columns: number; rows: number }) => void
	updateGameSize: () => void

	shuffleField: () => Promise<void>
	fillEmptyPositions: (positions: Set<TilePosition>) => Promise<void>
	animateAndWaitForAll: (promise: Promise<void>) => Promise<void>

	selectTile: (tile: Tile) => void
	swapTiles: (tile1: Tile, tile2: Tile) => Promise<void>
	addTile: (props: { kind: TileKind; position: TilePosition }) => Tile
	renderTile: (tile: Tile) => Promise<void>

	removeTiles: (tiles: Set<Tile>) => Promise<void>
	removeTilesFromCenter: (
		tiles: Set<Tile>,
		centerPosition: TilePosition
	) => Promise<void>
}
