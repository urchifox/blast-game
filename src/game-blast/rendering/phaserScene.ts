import Phaser from "phaser"

import { GridSnapshot } from "../grid"
import { OnTileClickHandler, TileInfoForRender } from "./renderer"
import { wait } from "../../helpers/time"

export const SCENE_KEY = "blast"
const tileTextureModules = import.meta.glob("../assets/img/*.png", {
	eager: true,
	import: "default",
}) as Record<string, string>

/** tile heights per second */
const TILE_MOVE_SPEED = 8
const MIN_TILE_MOVE_DURATION_MS = 10
const TILE_BOUNCE_DURATION_MS = 200
const TILE_BOUNCE_HEIGHT_RATIO = 0.05
const TILE_APPEAR_DURATION_MS = 300
const TILE_REMOVE_DURATION_MS = 300

export class PhaserScene extends Phaser.Scene {
	private readonly tilesMap = new Map<string, Phaser.GameObjects.Sprite>()
	private isReady = false
	private onReadyCallbacks: Array<() => void> = []
	private onTileClick: OnTileClickHandler | null = null

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

	resize(
		tilesInfo: ReadonlyArray<TileInfoForRender>,
		gridSnapshot: GridSnapshot
	) {
		for (const tileInfo of tilesInfo) {
			const tileSprite = this.tilesMap.get(tileInfo.id)
			if (tileSprite === undefined) {
				continue
			}
			this.updateTile(tileInfo, tileSprite, gridSnapshot)
		}
	}

	renderTiles(
		tiles: ReadonlyArray<TileInfoForRender>,
		gridSnapshot: GridSnapshot,
		isAppearOnDefaultPosition?: boolean
	) {
		if (!this.isReady) {
			return
		}

		const tileHeight = gridSnapshot.tileHeight
		const pauseDuration =
			this.getMoveDuration({ distance: tileHeight, tileHeight: tileHeight }) +
			TILE_APPEAR_DURATION_MS / 2

		tiles.forEach(async (tile, index) => {
			if (isAppearOnDefaultPosition) {
				await wait(index * pauseDuration)
			}
			this.renderTile(tile, gridSnapshot, isAppearOnDefaultPosition)
		})
	}

	moveTiles(
		tiles: ReadonlyArray<TileInfoForRender>,
		gridSnapshot: GridSnapshot
	) {
		if (!this.isReady) {
			return
		}

		tiles.forEach((tile) => {
			this.animateMovingToCurrentPosition(tile, gridSnapshot)
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

	setOnTileClick(onTileClick: OnTileClickHandler) {
		this.onTileClick = onTileClick
	}

	private async renderTile(
		tileInfo: TileInfoForRender,
		gridSnapshot: GridSnapshot,
		isAppearOnDefaultPosition?: boolean
	) {
		const { x, y, zIndex, tileWidth, tileHeight, imageKey } =
			this.getTileVisualProperties(tileInfo, gridSnapshot)

		const tileSprite = this.add
			.sprite(x, isAppearOnDefaultPosition ? 0 + tileHeight / 2 : y, imageKey)
			.setDepth(zIndex)
			.setDisplaySize(tileWidth, tileHeight)
			.setInteractive({ useHandCursor: true })

		const id = tileInfo.id
		this.tilesMap.set(id, tileSprite)
		tileSprite.on("pointerdown", () => this.onTileClick?.(id))

		await this.animateAppear(tileSprite)
		if (isAppearOnDefaultPosition) {
			this.animateMovingToCurrentPosition(tileInfo, gridSnapshot)
		}
	}

	private animateAppear(tileSprite: Phaser.GameObjects.Sprite) {
		const targetScaleX = tileSprite.scaleX
		const targetScaleY = tileSprite.scaleY
		tileSprite.setScale(0)
		return new Promise((resolve) => {
			this.tweens.add({
				targets: tileSprite,
				scaleX: targetScaleX,
				scaleY: targetScaleY,
				duration: TILE_APPEAR_DURATION_MS,
				ease: "Quad.easeOut",
				onComplete: resolve,
			})
		})
	}

	private getMoveDuration({
		distance,
		tileHeight,
	}: {
		distance: number
		tileHeight: number
	}) {
		return Math.max(
			MIN_TILE_MOVE_DURATION_MS,
			(distance / (Math.max(tileHeight, 1) * TILE_MOVE_SPEED)) * 1000
		)
	}

	private animateMovingToCurrentPosition(
		tileInfo: TileInfoForRender,
		gridSnapshot: GridSnapshot
	) {
		const tileSprite = this.tilesMap.get(tileInfo.id)
		if (!tileSprite) {
			return
		}

		const { x, y, zIndex, tileHeight } = this.getTileVisualProperties(
			tileInfo,
			gridSnapshot
		)
		const distance = Phaser.Math.Distance.Between(
			tileSprite.x,
			tileSprite.y,
			x,
			y
		)
		const moveDuration = this.getMoveDuration({ distance, tileHeight })
		const bounceHeight = tileHeight * TILE_BOUNCE_HEIGHT_RATIO

		this.tweens.killTweensOf(tileSprite)
		tileSprite.setDepth(zIndex)

		this.tweens.add({
			targets: tileSprite,
			x,
			y,
			duration: moveDuration,
			ease: "Quad.easeIn",
			onComplete: () => {
				this.tweens.add({
					targets: tileSprite,
					y: y - bounceHeight,
					duration: TILE_BOUNCE_DURATION_MS / 2,
					ease: "Sine.easeOut",
					yoyo: true,
				})
			},
		})
	}

	removeTile(tileId: string) {
		const tileSprite = this.tilesMap.get(tileId)
		if (tileSprite) {
			this.animateRemoving(tileSprite).then(() => {
				tileSprite.destroy()
			})
		}
		this.tilesMap.delete(tileId)
	}

	private animateRemoving(tileSprite: Phaser.GameObjects.Sprite) {
		return new Promise<void>((resolve) => {
			this.tweens.killTweensOf(tileSprite)
			this.tweens.add({
				targets: tileSprite,
				scale: 0,
				alpha: 0,
				duration: TILE_REMOVE_DURATION_MS,
				ease: "Quad.easeOut",
				onComplete: () => {
					resolve()
				},
			})
		})
	}

	private updateTile(
		tileInfo: TileInfoForRender,
		tileSprite: Phaser.GameObjects.Sprite,
		gridSnapshot: GridSnapshot
	) {
		const { x, y, zIndex, tileWidth, tileHeight } =
			this.getTileVisualProperties(tileInfo, gridSnapshot)
		tileSprite.setPosition(x, y)
		tileSprite.setDepth(zIndex)
		tileSprite.setDisplaySize(tileWidth, tileHeight)
	}

	private getTileVisualProperties(
		tileInfo: TileInfoForRender,
		gridSnapshot: GridSnapshot
	) {
		const { column, row, image } = tileInfo
		const { tileWidth, tileHeight, tileGapX, tileGapY, rows } = gridSnapshot
		const x = column * (tileWidth + tileGapX) + tileWidth / 2
		const y = row * (tileHeight + tileGapY) + tileHeight / 2
		const zIndex = rows - row
		const imageKey = image

		return { x, y, zIndex, tileWidth, tileHeight, imageKey }
	}
}
