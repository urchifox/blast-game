import Phaser from "phaser"

import { GridSnapshot } from "../grid"
import { Tile } from "../tile"

export const SCENE_KEY = "blast"
const tileTextureModules = import.meta.glob("../assets/img/*.png", {
	eager: true,
	import: "default",
}) as Record<string, string>

export class PhaserScene extends Phaser.Scene {
	private readonly tilesMap = new Map<Tile, Phaser.GameObjects.Sprite>()
	private isReady = false
	private onReadyCallbacks: Array<() => void> = []
	private onTileClick: ((tile: Tile) => void) | null = null

	constructor() {
		super(SCENE_KEY)
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
	}

	resize(gridSnapshot: GridSnapshot) {
		for (const [tile, tileSprite] of this.tilesMap) {
			this.updateTile(tile, tileSprite, gridSnapshot)
		}
	}

	renderTiles(tiles: ReadonlyArray<Tile>, gridSnapshot: GridSnapshot) {
		if (!this.isReady) {
			return
		}

		tiles.forEach((tile) => {
			this.renderTile(tile, gridSnapshot)
		})
	}

	moveTiles(tiles: ReadonlyArray<Tile>, gridSnapshot: GridSnapshot) {
		if (!this.isReady) {
			return
		}

		tiles.forEach((tile) => {
			this.moveTile(tile, gridSnapshot)
		})
	}

	clearTiles() {
		this.tilesMap.forEach((tileSprite) => {
			tileSprite.destroy()
		})
		this.tilesMap.clear()
	}

	onReady(callback: () => void) {
		if (this.isReady) {
			callback()
			return
		}

		this.onReadyCallbacks.push(callback)
	}

	setOnTileClick(onTileClick: (tile: Tile) => void) {
		this.onTileClick = onTileClick
	}

	private renderTile(tile: Tile, gridSnapshot: GridSnapshot) {
		const { x, y, zIndex, tileWidth, tileHeight, imageKey } =
			this.getTileVisualProperties(tile, gridSnapshot)

		const tileSprite = this.add
			.sprite(x, y, imageKey)
			.setDepth(zIndex)
			.setDisplaySize(tileWidth, tileHeight)
			.setInteractive({ useHandCursor: true })

		this.tilesMap.set(tile, tileSprite)
		tileSprite.on("pointerdown", () => {
			this.onTileClick?.(tile)
		})
	}

	private moveTile(tile: Tile, gridSnapshot: GridSnapshot) {
		const tileSprite = this.tilesMap.get(tile)
		if (tileSprite) {
			this.updateTile(tile, tileSprite, gridSnapshot)
		}
	}

	removeTile(tile: Tile) {
		const tileSprite = this.tilesMap.get(tile)
		if (tileSprite) {
			tileSprite.destroy()
		}
		this.tilesMap.delete(tile)
	}

	private updateTile(
		tile: Tile,
		tileSprite: Phaser.GameObjects.Sprite,
		gridSnapshot: GridSnapshot
	) {
		const { x, y, zIndex, tileWidth, tileHeight } =
			this.getTileVisualProperties(tile, gridSnapshot)
		tileSprite.setPosition(x, y)
		tileSprite.setDepth(zIndex)
		tileSprite.setDisplaySize(tileWidth, tileHeight)
	}

	private getTileVisualProperties(tile: Tile, gridSnapshot: GridSnapshot) {
		const { column, row } = tile.getPosition()
		const { tileWidth, tileHeight, tileGapX, tileGapY, rows } = gridSnapshot
		const x = column * (tileWidth + tileGapX) + tileWidth / 2
		const y = row * (tileHeight + tileGapY) + tileHeight / 2
		const zIndex = rows - row
		const imageKey = `tile-${tile.getKind()}`

		return { x, y, zIndex, tileWidth, tileHeight, imageKey }
	}
}
