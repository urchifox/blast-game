import { GridSnapshot } from "./domain/grid"
import { TilePosition, Tile, TileKind, TileSnapshot } from "./domain/tile"
import { BoosterName } from "./domain/types"

export type LayoutSnapshot = {
	readonly gridWidth: number
	readonly gridHeight: number
	readonly tileWidth: number
	readonly tileHeight: number
	readonly tileGapX: number
	readonly tileGapY: number
}

export type LayoutUIContract = {
	getSnapshot(): LayoutSnapshot
	updateSizes(gridSnapshot: GridSnapshot): LayoutSnapshot
	getGameContainerOffset(): { offsetX: number; offsetY: number }
	setGameContainerSize(sizes: { width: number; height: number } | null): void
}

export type ProgressUIContract = {
	updateMovesCounter(props: { movesLeft: number }): void
	updateScoreCounter(props: { score: number; goalScore: number }): void
}

export type ModalUIContract = {
	open(): void
}

export type BoosterUIContract = {
	updateBoosterCounter(currentValue: number): void
	toggleBoosterButtonActive(active: boolean): void
}

export type BoosterUIMap = Record<BoosterName, BoosterUIContract>

export type PresenterContract = {
	init(onTileClick: OnTileClickCallback): Promise<void>
	destroy(): void
	clear(): Promise<void>
	create(props: { columns: number; rows: number }): Promise<void>
	updateGameSize(): void

	shuffleField(): Promise<void>
	processRemovedTiles(removedTiles: Set<Tile>): Promise<void>
	animateAndWaitForAll(promise: Promise<void>): Promise<void>

	selectTile(tile: Tile): void
	swapTiles(tile1: Tile, tile2: Tile): Promise<void>
	addTile(props: { kind: TileKind; position: TilePosition }): Tile
	renderTile(tile: Tile): Promise<void>

	removeTilesFromCenter(
		tiles: Set<Tile>,
		centerPosition: TilePosition
	): Promise<void>
}

export type OnTileClickCallback = (id: string) => void

export type RendererContract = {
	init(): Promise<void>
	destroy(): void
	resize(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
	}): void
	clearTiles(): Promise<void>
	setOnTileClick(handler: OnTileClickCallback): void
	updateFieldOffsets(): void
	renderTiles(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
		isAppearOnDefaultPosition?: boolean
	}): Promise<void>
	removeTile(id: string): Promise<void>
	fallTilesToCurrentPositions(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
	}): Promise<void>
	shuffleTiles(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
	}): Promise<void>
	swapTiles(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
	}): Promise<void>
	selectTile(props: {
		tileSnapshot: TileSnapshot
		layoutSnapshot: LayoutSnapshot
	}): Promise<void>
	unselectTile(props: {
		tileSnapshot: TileSnapshot
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
	}): Promise<void>
}
