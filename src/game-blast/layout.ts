import { getElementInnerSize } from "../helpers/dom"
import {
	GAP_X,
	MAX_TILE_WIDTH,
	TILE_RATIO,
	GAP_Y,
	MAX_TILE_HEIGHT,
} from "./config"
import { GridSnapshot } from "./grid"

export type LayoutProps = {
	gameContainer: HTMLElement
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
	private readonly gameContainer: HTMLElement

	private gridWidth?: number
	private gridHeight?: number

	private tileWidth?: number
	private tileHeight?: number
	private tileGapX?: number
	private tileGapY?: number

	constructor(props: LayoutProps) {
		this.gameContainer = props.gameContainer
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

	private setSizes(sizes: LayoutSnapshot) {
		const { gridWidth, gridHeight, tileWidth, tileHeight, tileGapX, tileGapY } =
			sizes
		this.gridWidth = gridWidth
		this.gridHeight = gridHeight
		this.tileWidth = tileWidth
		this.tileHeight = tileHeight
		this.tileGapX = tileGapX
		this.tileGapY = tileGapY
	}

	updateSizes(gridSnapshot: GridSnapshot) {
		const gridSizes = this.getSizes(gridSnapshot)
		this.setSizes(gridSizes)
		return this.getSnapshot()
	}

	private getSizes({
		columns,
		rows,
	}: {
		columns: number
		rows: number
	}): LayoutSnapshot {
		const { width: containerWidth, height: containerHeight } =
			this.getGameContainerSize()

		let tileWidth = containerWidth / (columns + GAP_X * (columns - 1))
		tileWidth = Math.min(MAX_TILE_WIDTH, tileWidth)
		let tileHeight = tileWidth / TILE_RATIO

		let gridHeight = this.getHeight({ tileHeight, rows })

		if (gridHeight > containerHeight) {
			tileHeight = containerHeight / (rows + GAP_Y * (rows - 1))
			tileHeight = Math.min(MAX_TILE_HEIGHT, tileHeight)

			tileWidth = tileHeight * TILE_RATIO
			gridHeight = this.getHeight({ tileHeight, rows })
		}

		const gridWidth = this.getWidth({ tileWidth, columns })
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

	private getWidth({
		tileWidth,
		columns,
	}: {
		tileWidth: number
		columns: number
	}) {
		return tileWidth * (columns + GAP_X * (columns - 1))
	}

	private getHeight({
		tileHeight,
		rows,
	}: {
		tileHeight: number
		rows: number
	}) {
		return tileHeight * (rows + GAP_Y * (rows - 1))
	}

	private getGameContainerSize() {
		return getElementInnerSize({ element: this.gameContainer })
	}

	getGameContainerOffset() {
		const { x, y } = this.gameContainer.getBoundingClientRect()
		const style = window.getComputedStyle(this.gameContainer)
		const offsetX = x + parseFloat(style.paddingLeft ?? "0")
		const offsetY = y + parseFloat(style.paddingTop ?? "0")

		return { offsetX, offsetY }
	}

	setGameContainerSize(sizes: { width: number; height: number } | null) {
		const isResetSizes = sizes === null
		this.gameContainer.classList.toggle(
			"game-blast-container__canvas-container--fullsize",
			isResetSizes
		)
		if (isResetSizes) {
			return
		}

		const { width, height } = sizes
		this.gameContainer.style.setProperty("--field-width", `${width}px`)
		this.gameContainer.style.setProperty("--field-height", `${height}px`)
	}
}
