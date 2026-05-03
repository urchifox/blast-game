import Phaser from "phaser"

import { GridSnapshot } from "../grid"
import { OnTileClickHandler, RendererParams } from "./renderer"
import { TileSnapshot } from "../tile"
import { wait } from "../../helpers/time"
import {
	TILE_APPEAR_DURATION_MS,
	TILE_BOUNCE_HEIGHT_RATIO,
	TILE_BOUNCE_DURATION_MS,
	TILE_REMOVE_DURATION_MS,
	MIN_TILE_FALL_DURATION_MS,
	TILE_FALL_SPEED,
	TILE_SHUFFLE_DURATION_MS,
} from "../config"
import { easeInOutBack } from "../../helpers/animation"

export const SCENE_KEY = "blast"
const tileTextureModules = import.meta.glob("../assets/img/*.png", {
	eager: true,
	import: "default",
}) as Record<string, string>

export class PhaserScene extends Phaser.Scene {
	private readonly tilesMap = new Map<string, Phaser.GameObjects.Sprite>()
	private readonly scaleTweens = new Map<
		Phaser.GameObjects.Sprite,
		Phaser.Tweens.Tween
	>()
	private readonly positionTweens = new Map<
		Phaser.GameObjects.Sprite,
		Phaser.Tweens.Tween
	>()
	private isReady = false
	private onReadyCallbacks: Array<() => void> = []
	private onTileClick: OnTileClickHandler | null = null

	private offsetX = 0
	private offsetY = 0

	private readonly getContainerOffset: () => {
		offsetX: number
		offsetY: number
	}

	constructor({
		getContainerOffset,
	}: {
		getContainerOffset: () => { offsetX: number; offsetY: number }
	}) {
		super(SCENE_KEY)
		this.getContainerOffset = getContainerOffset
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

	setOnTileClick(onTileClick: RendererParams<"setOnTileClick">) {
		this.onTileClick = onTileClick
	}

	// #endregion

	// #region Resizing

	resize({ tilesSnapshots, gridSnapshot }: RendererParams<"resize">) {
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

	async renderTiles({
		tilesSnapshots,
		gridSnapshot,
		isAppearOnDefaultPosition,
	}: RendererParams<"renderTiles">) {
		let pauseDuration = 0
		if (isAppearOnDefaultPosition) {
			const tileHeight = gridSnapshot.tileHeight
			const fallingDuration = this.getFallingDuration({
				distance: tileHeight,
				tileHeight: tileHeight,
			})
			pauseDuration = fallingDuration + TILE_APPEAR_DURATION_MS
		}

		const renderTasks = tilesSnapshots.map(async (tile, index) => {
			await this.renderTile({
				tileSnapshot: tile,
				gridSnapshot,
				isAppearOnDefaultPosition,
				pauseDuration: index * pauseDuration,
			})
		})

		await Promise.all(renderTasks)
	}

	private async renderTile({
		tileSnapshot,
		gridSnapshot,
		isAppearOnDefaultPosition,
		pauseDuration,
	}: {
		tileSnapshot: TileSnapshot
		gridSnapshot: GridSnapshot
		isAppearOnDefaultPosition?: boolean
		pauseDuration?: number
	}) {
		const { x, y, zIndex, tileWidth, tileHeight, imageKey } =
			this.getTileVisualProperties(
				tileSnapshot,
				gridSnapshot,
				isAppearOnDefaultPosition
			)

		const tileSprite = this.add
			.sprite(x, y, imageKey)
			.setDepth(zIndex)
			.setDisplaySize(tileWidth, tileHeight)
			.setInteractive({ useHandCursor: true })

		const id = tileSnapshot.id
		this.tilesMap.set(id, tileSprite)
		tileSprite.on("pointerdown", () => this.onTileClick?.(id))

		await this.animateAppear({ tileSprite, gridSnapshot, pauseDuration })
		if (isAppearOnDefaultPosition) {
			await this.animateFallingToCurrentPosition(tileSnapshot, gridSnapshot)
		}
	}

	private async animateAppear({
		tileSprite,
		gridSnapshot,
		pauseDuration,
	}: {
		tileSprite: Phaser.GameObjects.Sprite
		gridSnapshot: GridSnapshot
		pauseDuration?: number
	}) {
		tileSprite.disableInteractive()
		const { scaleX, scaleY } = this.getInitialTileScale(
			tileSprite,
			gridSnapshot
		)
		tileSprite.setScale(0)
		tileSprite.setAlpha(0)

		if (pauseDuration !== undefined && pauseDuration > 0) {
			await wait(pauseDuration)
		}
		return new Promise<void>((resolve) => {
			const onTweenComplete = () => {
				this.scaleTweens.delete(tileSprite)
				tileSprite.setInteractive({ useHandCursor: true })
				resolve()
			}

			const appearingTween = this.tweens.add({
				targets: tileSprite,
				alpha: 1,
				scaleX,
				scaleY,
				duration: TILE_APPEAR_DURATION_MS,
				ease: "Quad.easeOut",
				onComplete: onTweenComplete,
				onStop: onTweenComplete,
			})

			this.scaleTweens.set(tileSprite, appearingTween)
		})
	}

	// #endregion

	// #region Falling

	async fallTilesToCurrentPositions({
		tilesSnapshots,
		gridSnapshot,
	}: RendererParams<"fallTilesToCurrentPositions">) {
		const moveTasks = tilesSnapshots.map((tileSnapshot) =>
			this.animateFallingToCurrentPosition(tileSnapshot, gridSnapshot)
		)

		await Promise.all(moveTasks)
	}

	private async animateFallingToCurrentPosition(
		tileSnapshot: TileSnapshot,
		gridSnapshot: GridSnapshot
	) {
		const tileSprite = this.tilesMap.get(tileSnapshot.id)
		if (tileSprite === undefined) {
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

		const currentMovingTween = this.positionTweens.get(tileSprite)
		currentMovingTween?.stop()
		this.positionTweens.delete(tileSprite)
		tileSprite.disableInteractive()

		const distance = Phaser.Math.Distance.Between(
			tileSprite.x,
			tileSprite.y,
			x,
			y
		)
		const moveDuration = this.getFallingDuration({ distance, tileHeight })
		const bounceHeight = tileHeight * TILE_BOUNCE_HEIGHT_RATIO

		await new Promise<void>((resolve) => {
			const onTweenComplete = () => {
				tileSprite.setDepth(zIndex)
				this.positionTweens.delete(tileSprite)
				tileSprite.setInteractive({ useHandCursor: true })
				resolve()
			}

			const moveTween = this.tweens.add({
				targets: tileSprite,
				x,
				y,
				duration: moveDuration,
				ease: "Quad.easeIn",
				onComplete: () => {
					onTweenComplete()
					this.animateBouncing(tileSprite, y - bounceHeight)
				},
				onStop: onTweenComplete,
			})

			this.positionTweens.set(tileSprite, moveTween)
		})
	}

	private async animateBouncing(
		tileSprite: Phaser.GameObjects.Sprite,
		bounceY: number
	) {
		await new Promise((resolve) => {
			this.tweens.add({
				targets: tileSprite,
				y: bounceY,
				duration: TILE_BOUNCE_DURATION_MS / 2,
				ease: "Sine.easeOut",
				yoyo: true,
				onComplete: resolve,
				onStop: resolve,
			})
		})
	}

	// #endregion

	async swapTiles({
		tilesSnapshots,
		gridSnapshot,
	}: RendererParams<"swapTiles">) {
		const shuffleTasks = tilesSnapshots.map((tileSnapshot) =>
			this.animateShuffling(tileSnapshot, gridSnapshot)
		)
		await Promise.all(shuffleTasks)
	}

	// #region Removing

	async removeTile(tileId: RendererParams<"removeTile">) {
		const tileSprite = this.tilesMap.get(tileId)
		if (tileSprite === undefined) {
			return
		}

		tileSprite.disableInteractive()
		this.tilesMap.delete(tileId)
		const appearingTween = this.scaleTweens.get(tileSprite)
		appearingTween?.stop()
		this.scaleTweens.delete(tileSprite)

		await new Promise<void>((resolve) => {
			this.tweens.add({
				targets: tileSprite,
				scale: 0,
				alpha: 0,
				duration: TILE_REMOVE_DURATION_MS,
				ease: "Quad.easeOut",
				onComplete: () => {
					tileSprite.destroy()
					resolve()
				},
			})
		})
	}

	// #endregion

	// #region Shuffling

	async shuffleTiles({
		tilesSnapshots,
		gridSnapshot,
	}: RendererParams<"shuffleTiles">) {
		const shuffleTasks = tilesSnapshots.map((tileSnapshot) =>
			this.animateShuffling(tileSnapshot, gridSnapshot)
		)
		await Promise.all(shuffleTasks)
	}

	private async animateShuffling(
		tileSnapshot: TileSnapshot,
		gridSnapshot: GridSnapshot
	) {
		const tileSprite = this.tilesMap.get(tileSnapshot.id)
		if (!tileSprite) {
			return
		}

		const currentMovingTween = this.positionTweens.get(tileSprite)
		currentMovingTween?.stop()
		this.positionTweens.delete(tileSprite)
		tileSprite.disableInteractive()

		tileSprite.setDepth(Infinity)
		const { x, y, zIndex } = this.getTileVisualProperties(
			tileSnapshot,
			gridSnapshot
		)

		const { scaleX, scaleY } = this.getInitialTileScale(
			tileSprite,
			gridSnapshot
		)
		const scale = 1.05

		await new Promise<void>((resolve) => {
			const onTweenComplete = () => {
				this.positionTweens.delete(tileSprite)
				tileSprite.setInteractive({ useHandCursor: true })
				tileSprite.setDepth(zIndex)

				resolve()
			}

			this.tweens.add({
				targets: tileSprite,
				scaleX: scaleX * scale,
				scaleY: scaleY * scale,
				duration: TILE_SHUFFLE_DURATION_MS / 2,
				ease: "Cubic.easeInOut",
				onComplete: onTweenComplete,
				onStop: onTweenComplete,
				yoyo: true,
			})

			const moveTween = this.tweens.add({
				targets: tileSprite,
				x,
				y,
				duration: TILE_SHUFFLE_DURATION_MS,
				ease: easeInOutBack,
				onComplete: onTweenComplete,
				onStop: onTweenComplete,
			})
			this.positionTweens.set(tileSprite, moveTween)
		})
	}

	// #endregion

	async clearTiles() {
		const removeTasks = Array.from(this.tilesMap.entries()).map(
			([id, tileSprite]) =>
				this.removeTile(id).then(() => this.tweens.killTweensOf(tileSprite))
		)
		await Promise.all(removeTasks)
		this.scaleTweens.clear()
		this.positionTweens.clear()
		this.tilesMap.clear()
	}

	// #region Selecting

	async selectTile({
		tileSnapshot,
		gridSnapshot,
	}: RendererParams<"selectTile">) {
		const tileSprite = this.tilesMap.get(tileSnapshot.id)
		if (!tileSprite) {
			return
		}
		tileSprite.setDepth(Infinity)
		const { scaleX, scaleY } = this.getInitialTileScale(
			tileSprite,
			gridSnapshot
		)

		const scale = 1.1
		tileSprite.disableInteractive()

		await new Promise<void>((resolve) => {
			this.tweens.add({
				targets: tileSprite,
				scaleX: scaleX * scale,
				scaleY: scaleY * scale,
				duration: 300,
				ease: "Cubic.easeInOut",
				onComplete: () => resolve(),
				onStop: () => resolve(),
			})
		})
	}

	async unselectTile({
		tileSnapshot,
		gridSnapshot,
	}: RendererParams<"unselectTile">) {
		const tileSprite = this.tilesMap.get(tileSnapshot.id)
		if (!tileSprite) {
			return
		}

		const { scaleX, scaleY } = this.getInitialTileScale(
			tileSprite,
			gridSnapshot
		)

		await new Promise<void>((resolve) => {
			const onEnd = () => {
				const { zIndex } = this.getTileVisualProperties(
					tileSnapshot,
					gridSnapshot
				)
				tileSprite.setDepth(zIndex)
				tileSprite.setInteractive({ useHandCursor: true })
				resolve()
			}
			this.tweens.add({
				targets: tileSprite,
				scaleX,
				scaleY,
				duration: 300,
				ease: "Cubic.easeInOut",
				onComplete: onEnd,
				onStop: onEnd,
			})
		})
	}

	// #endregion

	// #region Helpers

	setOffsets() {
		const { offsetX, offsetY } = this.getContainerOffset()
		this.offsetX = offsetX
		this.offsetY = offsetY
	}

	private getTileVisualProperties(
		tileSnapshot: TileSnapshot,
		gridSnapshot: GridSnapshot,
		isAppearOnDefaultPosition?: boolean
	) {
		const { column, row, image } = tileSnapshot
		const { tileWidth, tileHeight, tileGapX, tileGapY, rows } = gridSnapshot
		const x = column * (tileWidth + tileGapX) + tileWidth / 2 + this.offsetX
		const y = isAppearOnDefaultPosition
			? this.offsetY + tileHeight / 2
			: row * (tileHeight + tileGapY) + tileHeight / 2 + this.offsetY
		const zIndex = rows - row
		const imageKey = image

		return { x, y, zIndex, tileWidth, tileHeight, imageKey }
	}

	private getFallingDuration({
		distance,
		tileHeight,
	}: {
		distance: number
		tileHeight: number
	}) {
		return Math.max(
			MIN_TILE_FALL_DURATION_MS,
			(distance / (Math.max(tileHeight, 1) * TILE_FALL_SPEED)) * 1000
		)
	}

	getInitialTileScale(
		tileSprite: Phaser.GameObjects.Sprite,
		gridSnapshot: GridSnapshot
	) {
		const { tileWidth, tileHeight } = gridSnapshot
		const frameWidth = tileSprite.frame.width
		const frameHeight = tileSprite.frame.height
		const scaleX = tileWidth / frameWidth
		const scaleY = tileHeight / frameHeight
		return { scaleX, scaleY }
	}

	// #endregion
}
