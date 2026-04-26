import { GridSnapshot } from "../grid"

export type TileInfoForRender = {
	id: string
	image: string
	row: number
	column: number
}

export type OnTileClickHandler = (id: string) => void

export type Renderer = {
	init(): Promise<void>
	destroy(): void
	setOnTileClick(handler: OnTileClickHandler): void
	renderTiles({
		tilesInfo,
		gridSnapshot,
	}: {
		tilesInfo: ReadonlyArray<TileInfoForRender>
		gridSnapshot: GridSnapshot
	}): void
	resize(
		tilesInfo: ReadonlyArray<TileInfoForRender>,
		gridSnapshot: GridSnapshot
	): void
	clearTiles(): void
	removeTile(id: string): void
	moveTiles({
		tilesInfo,
		gridSnapshot,
	}: {
		tilesInfo: ReadonlyArray<TileInfoForRender>
		gridSnapshot: GridSnapshot
	}): void
}
