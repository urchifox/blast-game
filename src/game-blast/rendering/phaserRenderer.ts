import Phaser from "phaser"

import { PhaserScene } from "./phaserScene"
import { Renderer, RendererParams, RendererProps } from "./renderer"

export class PhaserRenderer extends Renderer {
	private readonly game: Phaser.Game
	private scene: PhaserScene
	readonly readyPromise: Promise<void>

	constructor(props: RendererProps) {
		super(props)

		const rendererScene = new PhaserScene({
			getContainerOffset: props.layout.getGameContainerOffset.bind(
				props.layout
			),
			getTileImage: this.getTileImage.bind(this),
		})

		this.game = new Phaser.Game({
			type: Phaser.AUTO,
			parent: this.container,
			transparent: true,
			width: window.innerWidth,
			height: window.innerHeight,
			physics: {
				default: "none",
			},
			scene: [rendererScene],
		})
		this.game.canvas.classList.add("canvas-container__canvas")

		this.scene = rendererScene
		this.readyPromise = new Promise<void>((resolve) => {
			this.scene.onReady(() => {
				resolve()
			})
		})
	}

	async init() {
		await this.readyPromise
	}

	setOnTileClick(props: RendererParams<"setOnTileClick">) {
		this.scene.setOnTileClick(props)
	}

	destroy() {
		this.game.destroy(true)
	}

	resize(props: RendererParams<"resize">) {
		this.game.scale.resize(window.innerWidth, window.innerHeight)
		this.updateFieldOffsets()
		this.scene.resize(props)
	}

	async clearTiles() {
		await this.scene.clearTiles()
	}

	updateFieldOffsets() {
		this.scene.setOffsets()
	}

	async removeTile(props: RendererParams<"removeTile">) {
		await this.scene.removeTile(props)
	}

	async fallTilesToCurrentPositions(
		props: RendererParams<"fallTilesToCurrentPositions">
	) {
		await this.scene.fallTilesToCurrentPositions(props)
	}

	async renderTiles(props: RendererParams<"renderTiles">) {
		await this.scene.renderTiles(props)
	}

	async shuffleTiles(props: RendererParams<"shuffleTiles">) {
		await this.scene.shuffleTiles(props)
	}

	async swapTiles(props: RendererParams<"swapTiles">) {
		await this.scene.swapTiles(props)
	}

	async selectTile(props: RendererParams<"selectTile">) {
		await this.scene.selectTile(props)
	}

	async unselectTile(props: RendererParams<"unselectTile">) {
		await this.scene.unselectTile(props)
	}
}
