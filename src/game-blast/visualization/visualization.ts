import Phaser from "phaser"

import { GridSnapshot } from "../grid"
import { RendererScene } from "./rendererScene"
import { Tile } from "../tile"

export class Visualization {
	private readonly container: HTMLElement
	private readonly game: Phaser.Game
	private scene: RendererScene

	private readonly getFieldSnapshot: () => GridSnapshot

	readonly readyPromise: Promise<void>

	constructor(props: {
		container: HTMLElement
		getFieldSnapshot: () => GridSnapshot
	}) {
		const { container, getFieldSnapshot } = props

		this.container = container
		this.getFieldSnapshot = getFieldSnapshot

		const { gridWidth, gridHeight } = this.getFieldSnapshot()
		const initialCanvasWidth = this.getSafeCanvasSize(gridWidth)
		const initialCanvasHeight = this.getSafeCanvasSize(gridHeight)
		const rendererScene = new RendererScene({
			getFieldSnapshot: this.getFieldSnapshot,
		})

		this.game = new Phaser.Game({
			type: Phaser.AUTO,
			parent: this.container,
			width: initialCanvasWidth,
			height: initialCanvasHeight,
			transparent: true,
			physics: {
				default: "none",
			},
			scene: [rendererScene],
		})
		this.scene = rendererScene
		this.readyPromise = new Promise<void>((resolve) => {
			this.scene.onReady(() => {
				resolve()
			})
		})

		this.setContainerSizes({ width: gridWidth, height: gridHeight })
	}

	destroy() {
		this.game.destroy(true)
	}

	renderTiles(tiles: Array<Tile>) {
		const { gridWidth, gridHeight } = this.getFieldSnapshot()
		this.setContainerSizes({ width: gridWidth, height: gridHeight })

		this.scene.renderTiles(tiles)
	}

	updateContainerSizes() {
		const gridSnapshot = this.getFieldSnapshot()
		const { gridWidth, gridHeight } = gridSnapshot
		this.setContainerSizes({ width: gridWidth, height: gridHeight })
	}

	resetContainerSizes() {
		this.setContainerSizes({})
	}

	private setContainerSizes({
		width,
		height,
	}: {
		width?: number
		height?: number
	}) {
		const isWidthSet = typeof width === "number" && width > 0
		const isHeightSet = typeof height === "number" && height > 0

		const containerWidth = isWidthSet ? width.toString() : "100%"
		const containerHeight = isHeightSet ? height.toString() : "100%"
		this.container.style.setProperty("--grid-width", containerWidth)
		this.container.style.setProperty("--grid-height", containerHeight)

		const canvasWidth = this.getSafeCanvasSize(width)
		const canvasHeight = this.getSafeCanvasSize(height)
		this.game.scale.resize(canvasWidth, canvasHeight)
	}

	private getSafeCanvasSize(size: number | undefined) {
		if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
			return 1
		}

		return Math.max(1, Math.floor(size))
	}
}
