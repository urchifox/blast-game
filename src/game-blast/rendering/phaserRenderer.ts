import Phaser from "phaser"

import { GridSnapshot } from "../grid"
import { PhaserScene } from "./phaserScene"
import { OnTileClickHandler, Renderer } from "./renderer"
import { TileSnapshot } from "../tile"

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
		tilesSnapshots: ReadonlyArray<TileSnapshot>,
		gridSnapshot: GridSnapshot
	) {
		this.game.scale.resize(window.innerWidth, window.innerHeight)
		this.scene.setOffsets()
		this.scene.resize(tilesSnapshots, gridSnapshot)
	}

	async clearTiles() {
		await this.scene.clearTiles()
	}

	async removeTile(id: string) {
		await this.scene.removeTile(id)
	}

	async moveTiles({
		tilesSnapshots,
		gridSnapshot,
	}: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
	}) {
		await this.scene.moveTiles(tilesSnapshots, gridSnapshot)
	}

	async renderTiles({
		tilesSnapshots,
		gridSnapshot,
		isAppearOnDefaultPosition,
	}: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
		isAppearOnDefaultPosition?: boolean
	}) {
		this.scene.setOffsets()

		await this.scene.renderTiles(
			tilesSnapshots,
			gridSnapshot,
			isAppearOnDefaultPosition
		)
	}

	async shuffleTiles(props: {
		tilesSnapshots: ReadonlyArray<TileSnapshot>
		gridSnapshot: GridSnapshot
	}) {
		await this.scene.shuffleTiles(props.tilesSnapshots, props.gridSnapshot)
	}
}
