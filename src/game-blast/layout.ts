import {
	GAP_X,
	MAX_TILE_WIDTH,
	TILE_RATIO,
	GAP_Y,
	MAX_TILE_HEIGHT,
} from "./config"
import { GridSnapshot } from "./grid"

export type LayoutProps = {
	getGameContainerSize: () => { width: number; height: number }
}

export type LayoutSnapshot = {
	readonly gridWidth: number
	readonly gridHeight: number
	readonly tileWidth: number
	readonly tileHeight: number
	readonly tileGapX: number
	readonly tileGapY: number
}

export class Layout {
	private readonly getGameContainerSize: LayoutProps["getGameContainerSize"]

	private gridWidth?: number
	private gridHeight?: number

	private tileWidth?: number
	private tileHeight?: number
	private tileGapX?: number
	private tileGapY?: number

	constructor(props: LayoutProps) {
		this.getGameContainerSize = props.getGameContainerSize
	}

	getSnapshot(): LayoutSnapshot {
		return {
			gridWidth: this.gridWidth ?? 0,
			gridHeight: this.gridHeight ?? 0,
			tileWidth: this.tileWidth ?? 0,
			tileHeight: this.tileHeight ?? 0,
			tileGapX: this.tileGapX ?? 0,
			tileGapY: this.tileGapY ?? 0,
		}
	}

	private setGridSizes(gridSizes: LayoutSnapshot) {
		const { gridWidth, gridHeight, tileWidth, tileHeight, tileGapX, tileGapY } =
			gridSizes
		this.gridWidth = gridWidth
		this.gridHeight = gridHeight
		this.tileWidth = tileWidth
		this.tileHeight = tileHeight
		this.tileGapX = tileGapX
		this.tileGapY = tileGapY
	}

	updateGridSizes(gridSnapshot: GridSnapshot) {
		const gridSizes = this.getGridSizes(gridSnapshot)
		this.setGridSizes(gridSizes)
		return this.getSnapshot()
	}

	private getGridSizes({
		columns,
		rows,
	}: {
		columns: number
		rows: number
	}): LayoutSnapshot {
		const { width: containerWidth, height: containerHeight } =
			this.getGameContainerSize()

		// сначала пробуем рассчитать размер плитки отталкиваясь от ширины поля
		let tileWidth = containerWidth / (columns + GAP_X * (columns - 1))
		tileWidth = Math.min(MAX_TILE_WIDTH, tileWidth)
		let tileHeight = tileWidth / TILE_RATIO

		// проверяем, какого размера будет поле с такими карточками
		let gridHeight = this.getgridHeight({ tileHeight, rows })

		// если получившееся поля слишком длинное по вертикали
		// пересчитываем размер карточки, отталкиваясь от высоты поля
		if (gridHeight > containerHeight) {
			tileHeight = containerHeight / (rows + GAP_Y * (rows - 1))
			tileHeight = Math.min(MAX_TILE_HEIGHT, tileHeight)

			tileWidth = tileHeight * TILE_RATIO
			gridHeight = this.getgridHeight({ tileHeight, rows })
		}

		const gridWidth = this.getgridWidth({ tileWidth, columns })
		const tileGapX = GAP_X * tileWidth
		const tileGapY = GAP_Y * tileHeight

		return {
			gridWidth,
			gridHeight,
			tileWidth,
			tileHeight,
			tileGapX,
			tileGapY,
		}
	}

	private getgridWidth({
		tileWidth,
		columns,
	}: {
		tileWidth: number
		columns: number
	}) {
		return tileWidth * (columns + GAP_X * (columns - 1))
	}

	private getgridHeight({
		tileHeight,
		rows,
	}: {
		tileHeight: number
		rows: number
	}) {
		return tileHeight * (rows + GAP_Y * (rows - 1))
	}
}
