import { getElementInnerSize } from "../helpers/dom"
import { GridSnapshot } from "./grid"
import { LayoutCalculator } from "./layoutCalculator"

export type LayoutProps = {
	gameContainer: HTMLElement
	layoutCalculator: LayoutCalculator
	toggleGameContainerResetSizes: (isResetSizes: boolean) => void
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
	private readonly gameContainer: LayoutProps["gameContainer"]
	private readonly layoutCalculator: LayoutProps["layoutCalculator"]
	private readonly toggleGameContainerResetSizes: LayoutProps["toggleGameContainerResetSizes"]

	private gridWidth?: number
	private gridHeight?: number

	private tileWidth?: number
	private tileHeight?: number
	private tileGapX?: number
	private tileGapY?: number

	constructor(props: LayoutProps) {
		this.gameContainer = props.gameContainer
		this.layoutCalculator = props.layoutCalculator
		this.toggleGameContainerResetSizes = props.toggleGameContainerResetSizes
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
		const containerSize = this.getGameContainerSize()
		const gridSizes = this.layoutCalculator.getSizes({
			...gridSnapshot,
			containerWidth: containerSize.width,
			containerHeight: containerSize.height,
		})
		this.setSizes(gridSizes)
		return this.getSnapshot()
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
		this.toggleGameContainerResetSizes(isResetSizes)
		if (isResetSizes) {
			return
		}

		const { width, height } = sizes
		this.gameContainer.style.setProperty("--field-width", `${width}px`)
		this.gameContainer.style.setProperty("--field-height", `${height}px`)
	}
}
