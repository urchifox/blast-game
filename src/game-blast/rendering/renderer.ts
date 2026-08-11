import { GridSnapshot } from "../domain/grid"
import { TileSnapshot } from "../domain/tile"
import { LayoutSnapshot, LayoutUIContract } from "../types"

export type OnTileClickHandler = (id: string) => void

export type RendererProps = {
	container: HTMLElement
	layoutUI: LayoutUIContract
}

export abstract class Renderer {
	protected readonly container: RendererProps["container"]
	protected readonly layoutUI: RendererProps["layoutUI"]

	constructor(props: RendererProps) {
		this.container = props.container
		this.layoutUI = props.layoutUI
	}

	abstract init(): Promise<void>
	abstract destroy(): void
	abstract resize(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
	}): void
	abstract clearTiles(): Promise<void>
	abstract setOnTileClick(handler: OnTileClickHandler): void
	abstract updateFieldOffsets(): void
	abstract renderTiles(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
		isAppearOnDefaultPosition?: boolean
	}): Promise<void>
	abstract removeTile(id: string): Promise<void>
	abstract fallTilesToCurrentPositions(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
	}): Promise<void>
	abstract shuffleTiles(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
	}): Promise<void>
	abstract swapTiles(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
	}): Promise<void>
	abstract selectTile(props: {
		tileSnapshot: TileSnapshot
		layoutSnapshot: LayoutSnapshot
	}): Promise<void>
	abstract unselectTile(props: {
		tileSnapshot: TileSnapshot
		gridSnapshot: GridSnapshot
		layoutSnapshot: LayoutSnapshot
	}): Promise<void>

	getTileImage(tileSnapshot: TileSnapshot): string {
		return `tile-${tileSnapshot.kind}`
	}
}

export type RendererParams<Method extends keyof Renderer> = Parameters<
	Renderer[Method]
>[0]
