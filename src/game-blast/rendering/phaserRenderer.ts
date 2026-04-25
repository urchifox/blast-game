import Phaser from "phaser"

import { GridSnapshot } from "../grid"
import { PhaserScene } from "./phaserScene"
import { Tile } from "../tile"
import { Renderer } from "./renderer"

export class PhaserRenderer implements Renderer {
	private readonly container: HTMLElement
	private readonly game: Phaser.Game
	private scene: PhaserScene

	readonly readyPromise: Promise<void>

	constructor(props: { container: HTMLElement }) {
		const { container } = props

		this.container = container

		const initialCanvasWidth = this.getSafeCanvasSize()
		const initialCanvasHeight = this.getSafeCanvasSize()
		const rendererScene = new PhaserScene()

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
	}

	async init(): Promise<void> {
		await this.readyPromise
	}

	destroy() {
		this.game.destroy(true)
	}

	resize(updateGridSizes: () => GridSnapshot) {
		this.resetContainerSizes()
		const gridSnapshot = updateGridSizes()
		this.updateContainerSizes(gridSnapshot)
		this.scene.resize(gridSnapshot)
	}

	renderTiles({
		tiles,
		gridSnapshot,
	}: {
		tiles: ReadonlyArray<Tile>
		gridSnapshot: GridSnapshot
	}) {
		const { gridWidth, gridHeight } = gridSnapshot
		this.setContainerSizes({ width: gridWidth, height: gridHeight })

		this.scene.renderTiles(tiles, gridSnapshot)
	}

	private updateContainerSizes(gridSnapshot: GridSnapshot) {
		const { gridWidth, gridHeight } = gridSnapshot
		this.setContainerSizes({ width: gridWidth, height: gridHeight })
	}

	private resetContainerSizes() {
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

	private getSafeCanvasSize(size?: number) {
		if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
			return 1
		}

		return Math.max(1, Math.floor(size))
	}
}
