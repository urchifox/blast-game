import Phaser from "phaser"

import { GridSnapshot } from "../grid"
import { PhaserScene } from "./phaserScene"
import { OnTileClickHandler, Renderer, TileInfoForRender } from "./renderer"

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

	setOnTileClick(onTileClick: OnTileClickHandler) {
		this.scene.setOnTileClick(onTileClick)
	}

	destroy() {
		this.game.destroy(true)
	}

	resize(
		tilesInfo: ReadonlyArray<TileInfoForRender>,
		gridSnapshot: GridSnapshot
	) {
		const { gridWidth, gridHeight } = gridSnapshot
		this.setCanvasSizes({ width: gridWidth, height: gridHeight })
		this.scene.resize(tilesInfo, gridSnapshot)
	}

	clearTiles() {
		this.scene.clearTiles()
	}

	removeTile(id: string) {
		this.scene.removeTile(id)
	}

	moveTiles({
		tilesInfo,
		gridSnapshot,
	}: {
		tilesInfo: ReadonlyArray<TileInfoForRender>
		gridSnapshot: GridSnapshot
	}) {
		this.scene.moveTiles(tilesInfo, gridSnapshot)
	}

	renderTiles({
		tilesInfo,
		gridSnapshot,
	}: {
		tilesInfo: ReadonlyArray<TileInfoForRender>
		gridSnapshot: GridSnapshot
	}) {
		const { gridWidth, gridHeight } = gridSnapshot
		this.setCanvasSizes({ width: gridWidth, height: gridHeight })

		this.scene.renderTiles(tilesInfo, gridSnapshot)
	}

	private setCanvasSizes({
		width,
		height,
	}: {
		width?: number
		height?: number
	}) {
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
