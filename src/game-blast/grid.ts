import {
	GAP_X,
	MAX_TILE_WIDTH,
	TILE_RATIO,
	GAP_Y,
	MAX_TILE_HEIGHT,
} from "./config"

export type GridSnapshot = {
	readonly rows: number
	readonly columns: number
} & GridSizes

type GridSizes = {
	gridWidth: number
	gridHeight: number
	tileWidth: number
	tileHeight: number
	tileGapX: number
	tileGapY: number
}

export class Grid {
	private rows?: number
	private columns?: number

	private gridWidth?: number
	private gridHeight?: number

	private tileWidth?: number
	private tileHeight?: number
	private tileGapX?: number
	private tileGapY?: number

	private getContainerSize: () => { width: number; height: number }

	constructor(props: {
		getContainerSize: () => { width: number; height: number }
	}) {
		const { getContainerSize } = props
		this.getContainerSize = getContainerSize
	}

	getSnapshot(): GridSnapshot {
		return {
			rows: this.rows ?? 0,
			columns: this.columns ?? 0,
			gridWidth: this.gridWidth ?? 0,
			gridHeight: this.gridHeight ?? 0,
			tileWidth: this.tileWidth ?? 0,
			tileHeight: this.tileHeight ?? 0,
			tileGapX: this.tileGapX ?? 0,
			tileGapY: this.tileGapY ?? 0,
		}
	}

	createGrid(columns: number, rows: number) {
		this.rows = rows
		this.columns = columns
		this.updateGridSizes()
	}

	// #region GRID SIZES

	updateGridSizes() {
		const gridSizes = this.getGridSizes({
			columns: this.columns ?? 0,
			rows: this.rows ?? 0,
		})
		this.setGridSizes(gridSizes)
	}

	private setGridSizes(gridSizes: GridSizes) {
		const { gridWidth, gridHeight, tileWidth, tileHeight, tileGapX, tileGapY } =
			gridSizes
		this.gridWidth = gridWidth
		this.gridHeight = gridHeight
		this.tileWidth = tileWidth
		this.tileHeight = tileHeight
		this.tileGapX = tileGapX
		this.tileGapY = tileGapY
	}

	private getGridSizes({
		columns,
		rows,
	}: {
		columns: number
		rows: number
	}): GridSizes {
		const { width: containerWidth, height: containerHeight } =
			this.getContainerSize()

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

	// #endregion
}
