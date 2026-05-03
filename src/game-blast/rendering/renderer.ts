import { GridSnapshot } from "../grid"
import { TileSnapshot } from "../tile"

export type OnTileClickHandler = (id: string) => void

export type Renderer = {
	init(): Promise<void>
	destroy(): void
	resize(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
	}): void
	clearTiles(): Promise<void>
	setOnTileClick(handler: OnTileClickHandler): void
	updateFieldOffsets: () => void
	renderTiles(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		isAppearOnDefaultPosition?: boolean
	}): Promise<void>
	removeTile(id: string): Promise<void>
	fallTilesToCurrentPositions(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
	}): Promise<void>
	shuffleTiles(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
	}): Promise<void>
	swapTiles(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
	}): Promise<void>
	selectTile(props: {
		tileSnapshot: TileSnapshot
		gridSnapshot: GridSnapshot
	}): Promise<void>
	unselectTile(props: {
		tileSnapshot: TileSnapshot
		gridSnapshot: GridSnapshot
	}): Promise<void>
}

export type RendererParams<Method extends keyof Renderer> = Parameters<
	Renderer[Method]
>[0]

export type RendererResult<Method extends keyof Renderer> = ReturnType<
	Renderer[Method]
>
