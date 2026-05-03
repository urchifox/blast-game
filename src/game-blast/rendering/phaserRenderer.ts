import Phaser from "phaser"

import { PhaserScene } from "./phaserScene"
import { Renderer, RendererParams, RendererResult } from "./renderer"

export class PhaserRenderer implements Renderer {
	private readonly container: HTMLElement
	private readonly game: Phaser.Game
	private scene: PhaserScene
	readonly readyPromise: Promise<void>

	constructor(props: {
		container: HTMLElement
		getContainerOffset: () => { offsetX: number; offsetY: number }
	}) {
		const { container, getContainerOffset } = props

		this.container = container

		const rendererScene = new PhaserScene({ getContainerOffset })

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
		this.scene = rendererScene
		this.readyPromise = new Promise<void>((resolve) => {
			this.scene.onReady(() => {
				resolve()
			})
		})
	}

	async init(): RendererResult<"init"> {
		await this.readyPromise
	}

	setOnTileClick(
		props: RendererParams<"setOnTileClick">
	): RendererResult<"setOnTileClick"> {
		this.scene.setOnTileClick(props)
	}

	destroy(): RendererResult<"destroy"> {
		this.game.destroy(true)
	}

	resize(props: RendererParams<"resize">): RendererResult<"resize"> {
		this.game.scale.resize(window.innerWidth, window.innerHeight)
		this.updateFieldOffsets()
		this.scene.resize(props)
	}

	async clearTiles(): RendererResult<"clearTiles"> {
		await this.scene.clearTiles()
	}

	updateFieldOffsets(): RendererResult<"updateFieldOffsets"> {
		this.scene.setOffsets()
	}

	async removeTile(
		props: RendererParams<"removeTile">
	): RendererResult<"removeTile"> {
		await this.scene.removeTile(props)
	}

	async fallTilesToCurrentPositions(
		props: RendererParams<"fallTilesToCurrentPositions">
	): RendererResult<"fallTilesToCurrentPositions"> {
		await this.scene.fallTilesToCurrentPosituons(props)
	}

	async renderTiles(
		props: RendererParams<"renderTiles">
	): RendererResult<"renderTiles"> {
		await this.scene.renderTiles(props)
	}

	async shuffleTiles(
		props: RendererParams<"shuffleTiles">
	): RendererResult<"shuffleTiles"> {
		await this.scene.shuffleTiles(props)
	}

	async swapTiles(
		props: RendererParams<"swapTiles">
	): RendererResult<"swapTiles"> {
		await this.scene.swapTiles(props)
	}

	async selectTile(
		props: RendererParams<"selectTile">
	): RendererResult<"selectTile"> {
		await this.scene.selectTile(props)
	}

	async unselectTile(
		props: RendererParams<"unselectTile">
	): RendererResult<"unselectTile"> {
		await this.scene.unselectTile(props)
	}
}
