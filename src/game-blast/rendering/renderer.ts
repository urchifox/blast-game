import { GridSnapshot } from "../grid"
import { TileSnapshot } from "../tile"

export type OnTileClickHandler = (id: string) => void

export type Renderer = {
	init(): Promise<void>
	destroy(): void
	setOnTileClick(handler: OnTileClickHandler): void
	renderTiles({
		tilesSnapshots,
		gridSnapshot,
		isAppearOnDefaultPosition,
	}: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		isAppearOnDefaultPosition?: boolean
	}): Promise<void>
	resize(
		tilesSnapshots: ReadonlyArray<TileSnapshot>,
		gridSnapshot: GridSnapshot
	): void
	clearTiles(): Promise<void>
	removeTile(id: string): Promise<void>
	moveTiles({
		tilesSnapshots,
		gridSnapshot,
	}: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
	}): Promise<void>
}
