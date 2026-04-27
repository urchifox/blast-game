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
		isAppearOnDefaultPosition,
	}: {
		tilesInfo: ReadonlyArray<TileInfoForRender>
		gridSnapshot: GridSnapshot
		isAppearOnDefaultPosition?: boolean
	}): Promise<void>
	resize(
		tilesInfo: ReadonlyArray<TileInfoForRender>,
		gridSnapshot: GridSnapshot
	): void
	clearTiles(): Promise<void>
	removeTile(id: string): Promise<void>
	moveTiles({
		tilesInfo,
		gridSnapshot,
	}: {
		tilesInfo: ReadonlyArray<TileInfoForRender>
		gridSnapshot: GridSnapshot
	}): Promise<void>
}
