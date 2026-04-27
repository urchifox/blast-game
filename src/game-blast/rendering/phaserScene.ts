import Phaser from "phaser"

import { GridSnapshot } from "../grid"
import { OnTileClickHandler } from "./renderer"
import { TileSnapshot } from "../tile"
import { wait } from "../../helpers/time"

export const SCENE_KEY = "blast"
const tileTextureModules = import.meta.glob("../assets/img/*.png", {
	eager: true,
	import: "default",
}) as Record<string, string>

/** tile heights per second */
const TILE_MOVE_SPEED = 10
const MIN_TILE_MOVE_DURATION_MS = 10
const TILE_BOUNCE_DURATION_MS = 150
const TILE_BOUNCE_HEIGHT_RATIO = 0.05
const TILE_APPEAR_DURATION_MS = 150
const TILE_REMOVE_DURATION_MS = 150
export const TILE_DELAY_BETWEEN_REMOVALS_MS = TILE_REMOVE_DURATION_MS / 4

export class PhaserScene extends Phaser.Scene {
	private readonly tilesMap = new Map<string, Phaser.GameObjects.Sprite>()
	private readonly appearingTweens = new Map<
		Phaser.GameObjects.Sprite,
		Phaser.Tweens.Tween
	>()
	private readonly movingTweens = new Map<
		Phaser.GameObjects.Sprite,
		Phaser.Tweens.Tween
	>()
	private isReady = false
	private onReadyCallbacks: Array<() => void> = []
	private onTileClick: OnTileClickHandler | null = null

	constructor() {
		super(SCENE_KEY)
	}

	// #region Initialization

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

	// #endregion

	// #region Resizing

	resize(
		tilesSnapshots: ReadonlyArray<TileSnapshot>,
		gridSnapshot: GridSnapshot
	) {
		for (const tileSnapshot of tilesSnapshots) {
			const tileSprite = this.tilesMap.get(tileSnapshot.id)
			if (tileSprite === undefined) {
				continue
			}
			this.updateTile(tileSnapshot, tileSprite, gridSnapshot)
		}
	}

	private updateTile(
		tileSnapshot: TileSnapshot,
		tileSprite: Phaser.GameObjects.Sprite,
		gridSnapshot: GridSnapshot
	) {
		const { x, y, zIndex, tileWidth, tileHeight } =
			this.getTileVisualProperties(tileSnapshot, gridSnapshot)
		tileSprite.setPosition(x, y)
		tileSprite.setDepth(zIndex)
		tileSprite.setDisplaySize(tileWidth, tileHeight)
	}

	// #endregion

	// #region Rendering

	async renderTiles(
		tiles: ReadonlyArray<TileSnapshot>,
		gridSnapshot: GridSnapshot,
		isAppearOnDefaultPosition?: boolean
	) {
		if (!this.isReady) {
			await Promise.resolve()
		}

		const tileHeight = gridSnapshot.tileHeight
		const pauseDuration =
			this.getMoveDuration({ distance: tileHeight, tileHeight: tileHeight }) +
			TILE_APPEAR_DURATION_MS / 2

		const renderTasks = tiles.map(async (tile, index) => {
			if (isAppearOnDefaultPosition) {
				await wait(index * pauseDuration)
			}
			await this.renderTile(tile, gridSnapshot, isAppearOnDefaultPosition)
		})

		await Promise.all(renderTasks)
	}

	private async renderTile(
		tileSnapshot: TileSnapshot,
		gridSnapshot: GridSnapshot,
		isAppearOnDefaultPosition?: boolean
	) {
		const { x, y, zIndex, tileWidth, tileHeight, imageKey } =
			this.getTileVisualProperties(tileSnapshot, gridSnapshot)

		const tileSprite = this.add
			.sprite(x, isAppearOnDefaultPosition ? 0 + tileHeight / 2 : y, imageKey)
			.setDepth(zIndex)
			.setDisplaySize(tileWidth, tileHeight)
			.setInteractive({ useHandCursor: true })

		const id = tileSnapshot.id
		this.tilesMap.set(id, tileSprite)
		tileSprite.on("pointerdown", () => this.onTileClick?.(id))

		await this.animateAppear(tileSprite)
		if (isAppearOnDefaultPosition) {
			await this.animateMovingToCurrentPosition(tileSnapshot, gridSnapshot)
		}
	}

	private animateAppear(tileSprite: Phaser.GameObjects.Sprite) {
		const targetScaleX = tileSprite.scaleX
		const targetScaleY = tileSprite.scaleY
		tileSprite.setScale(0)
		tileSprite.setAlpha(0)
		const onTweenComplete = (resolve: () => void) => {
			this.appearingTweens.delete(tileSprite)
			tileSprite.setInteractive({ useHandCursor: true })
			resolve()
		}
		return new Promise<void>((resolve) => {
			const appearingTween = this.tweens.add({
				onStart: () => {
					tileSprite.disableInteractive()
				},
				targets: tileSprite,
				alpha: 1,
				scaleX: targetScaleX,
				scaleY: targetScaleY,
				duration: TILE_APPEAR_DURATION_MS,
				ease: "Quad.easeOut",
				onComplete: () => onTweenComplete(resolve),
				onStop: () => onTweenComplete(resolve),
			})
			this.appearingTweens.set(tileSprite, appearingTween)
		})
	}

	// #endregion

	// #region Moving

	async moveTiles(
		tiles: ReadonlyArray<TileSnapshot>,
		gridSnapshot: GridSnapshot
	) {
		if (!this.isReady) {
			return
		}

		const moveTasks = tiles.map((tile) =>
			this.animateMovingToCurrentPosition(tile, gridSnapshot)
		)

		await Promise.all(moveTasks)
	}

	private async animateMovingToCurrentPosition(
		tileSnapshot: TileSnapshot,
		gridSnapshot: GridSnapshot
	) {
		const tileSprite = this.tilesMap.get(tileSnapshot.id)
		if (!tileSprite) {
			return
		}

		const { x, y, zIndex, tileHeight } = this.getTileVisualProperties(
			tileSnapshot,
			gridSnapshot
		)

		/* Prevent false moving upwards */
		if (tileSprite.y > y) {
			return
		}

		const distance = Phaser.Math.Distance.Between(
			tileSprite.x,
			tileSprite.y,
			x,
			y
		)
		const moveDuration = this.getMoveDuration({ distance, tileHeight })
		const bounceHeight = tileHeight * TILE_BOUNCE_HEIGHT_RATIO

		const currentMovingTween = this.movingTweens.get(tileSprite)
		currentMovingTween?.stop()
		this.movingTweens.delete(tileSprite)

		const onTweenComplete = (resolve: () => void) => {
			tileSprite.setDepth(zIndex)
			this.movingTweens.delete(tileSprite)
			tileSprite.setInteractive({ useHandCursor: true })

			resolve()
		}

		await new Promise<void>((resolve) => {
			const moveTween = this.tweens.add({
				targets: tileSprite,
				x,
				y,
				duration: moveDuration,
				ease: "Quad.easeIn",
				onStart: () => {
					tileSprite.disableInteractive()
				},
				onComplete: () => {
					onTweenComplete(resolve)
					this.tweens.add({
						targets: tileSprite,
						y: y - bounceHeight,
						duration: TILE_BOUNCE_DURATION_MS / 2,
						ease: "Sine.easeOut",
						yoyo: true,
					})
				},
				onStop: () => onTweenComplete(resolve),
			})
			this.movingTweens.set(tileSprite, moveTween)
		})
	}

	// #endregion

	// #region Removing

	async removeTile(tileId: string) {
		const tileSprite = this.tilesMap.get(tileId)
		if (tileSprite) {
			await this.animateRemoving(tileSprite).then(() => {
				tileSprite.destroy()
				this.tilesMap.delete(tileId)
			})
		}
		await Promise.resolve()
	}

	private animateRemoving(tileSprite: Phaser.GameObjects.Sprite) {
		return new Promise<void>((resolve) => {
			const appearingTween = this.appearingTweens.get(tileSprite)
			appearingTween?.stop()
			this.appearingTweens.delete(tileSprite)

			this.tweens.add({
				onStart: () => {
					tileSprite.disableInteractive()
				},
				targets: tileSprite,
				scale: 0,
				alpha: 0,
				duration: TILE_REMOVE_DURATION_MS,
				ease: "Quad.easeOut",
				onComplete: () => resolve(),
			})
		})
	}

	// #endregion

	async clearTiles() {
		const removeTasks = Array.from(this.tilesMap.entries()).map(
			([id, tileSprite]) =>
				this.removeTile(id).then(() => this.tweens.killTweensOf(tileSprite))
		)
		await Promise.all(removeTasks)
		this.appearingTweens.clear()
		this.movingTweens.clear()
		this.tilesMap.clear()
	}

	// #region Helpers

	private getTileVisualProperties(
		tileSnapshot: TileSnapshot,
		gridSnapshot: GridSnapshot
	) {
		const { column, row, image } = tileSnapshot
		const { tileWidth, tileHeight, tileGapX, tileGapY, rows } = gridSnapshot
		const x = column * (tileWidth + tileGapX) + tileWidth / 2
		const y = row * (tileHeight + tileGapY) + tileHeight / 2
		const zIndex = rows - row
		const imageKey = image

		return { x, y, zIndex, tileWidth, tileHeight, imageKey }
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

	// #endregion
}
