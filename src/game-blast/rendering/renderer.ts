import { GridSnapshot } from "../grid"
import { Tile } from "../tile"

export type Renderer = {
	init(): Promise<void>
	destroy(): void
	setOnTileClick(onTileClick: (tile: Tile) => void): void
	renderTiles({
		tiles,
		gridSnapshot,
	}: {
		tiles: ReadonlyArray<Tile>
		gridSnapshot: GridSnapshot
	}): void
	resize(gridSnapshot: GridSnapshot): void
	clearTiles(): void
	removeTile(tile: Tile): void
}
