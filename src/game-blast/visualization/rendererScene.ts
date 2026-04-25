import Phaser from "phaser"

import { GridSnapshot } from "../grid"
import { Tile } from "../tile"

export const SCENE_KEY = "blast"
const tileTextureModules = import.meta.glob("../assets/img/*.png", {
	eager: true,
	import: "default",
}) as Record<string, string>

export class RendererScene extends Phaser.Scene {
	private readonly getFieldSnapshot: () => GridSnapshot
	private readonly tilesMap = new Map<Tile, Phaser.GameObjects.Sprite>()
	private isReady = false
	private onReadyCallbacks: Array<() => void> = []

	constructor({ getFieldSnapshot }: { getFieldSnapshot: () => GridSnapshot }) {
		super(SCENE_KEY)
		this.getFieldSnapshot = getFieldSnapshot
	}

	preload() {
		Object.entries(tileTextureModules).forEach(([modulePath, textureUrl]) => {
			const fileName = modulePath.split("/").pop()
			if (!fileName) {
				return
			}

			const key = fileName.replace(/\.[^.]+$/, "")
			this.load.image(key, textureUrl)
		})
	}

	create() {
		this.isReady = true
		this.onReadyCallbacks.forEach((callback) => callback())
		this.onReadyCallbacks = []

		this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)
	}

	shutdown() {
		this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
	}

	private handleResize() {
		for (const [tile, tileSprite] of this.tilesMap) {
			this.updateTile(tile, tileSprite)
		}
	}

	renderTiles(tiles: Array<Tile>) {
		if (!this.isReady) {
			return
		}

		tiles.forEach((tile) => {
			this.renderTile(tile)
		})
	}

	onReady(callback: () => void) {
		if (this.isReady) {
			callback()
			return
		}

		this.onReadyCallbacks.push(callback)
	}

	private renderTile(tile: Tile) {
		const { x, y, zIndex, tileWidth, tileHeight, imageKey } =
			this.getTileVisualProperties(tile)

		const tileSprite = this.add
			.sprite(x, y, imageKey)
			.setDepth(zIndex)
			.setDisplaySize(tileWidth, tileHeight)
			.setInteractive({ useHandCursor: true })

		this.tilesMap.set(tile, tileSprite)
	}

	private updateTile(tile: Tile, tileSprite: Phaser.GameObjects.Sprite) {
		const { x, y, zIndex, tileWidth, tileHeight } =
			this.getTileVisualProperties(tile)
		tileSprite.setPosition(x, y)
		tileSprite.setDepth(zIndex)
		tileSprite.setDisplaySize(tileWidth, tileHeight)
	}

	private getTileVisualProperties(tile: Tile) {
		const { column, row } = tile.getPosition()
		const { tileWidth, tileHeight, tileGapX, tileGapY, rows } =
			this.getFieldSnapshot()
		const x = column * (tileWidth + tileGapX) + tileWidth / 2
		const y = row * (tileHeight + tileGapY) + tileHeight / 2
		const zIndex = rows - row
		const imageKey = `tile-${tile.getKind()}`

		return { x, y, zIndex, tileWidth, tileHeight, imageKey }
	}
}
