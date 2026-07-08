import { getRandomNumber } from "../helpers/random"
import { wait } from "../helpers/time"
import { BoosterName, BoosterCommonProps } from "./booster"
import {
	BASE_SCORE,
	DEFAULT_COLUMNS,
	DEFAULT_ROWS,
	GROWTH_EXPONENT,
	MAX_AVG_COMBO,
	MAX_GOAL_SCORE,
	MAX_SHUFFLE_ATTEMPTS,
	MIN_AVG_COMBO,
	MIN_GOAL_SCORE,
	TILE_DELAY_BETWEEN_REMOVALS_MS,
} from "./config"
import { Field } from "./field"
import { Grid } from "./grid"
import { Progress } from "../helpers/progress"
import { Renderer } from "./rendering/renderer"
import { isTileKindSpecial, Tile, TilePosition, TileSnapshot } from "./tile"
import { AnimationsManager } from "../helpers/animationManager"
import { TileClickHandlerResult } from "./types"
import { TileClickManager } from "./tileClickManager"
import { BoosterManager } from "./boosterManager"

export class GameBlast {
	private readonly renderer: Renderer
	private readonly grid: Grid
	private readonly field: Field
	private readonly scoreProgress: Progress
	private readonly movesProgress: Progress
	private readonly setGameContainerSize: (
		sizes: {
			width: number
			height: number
		} | null
	) => void
	private shuffleAttempts = 0
	private readonly animationsManager = new AnimationsManager()
	private readonly openWinModal: () => void
	private readonly openLossModal: () => void

	private isGameEnded = false

	private tileClickManager: TileClickManager
	private boosterManager: BoosterManager

	private levelData: {
		columns: number
		rows: number
		goalScore: number
		movesLimit: number
	} = {
		columns: 0,
		rows: 0,
		goalScore: 0,
		movesLimit: 0,
	}

	constructor({
		renderer,
		setGameContainerSize,
		openWinModal,
		openLossModal,
		boosterProps,
		grid,
		field,
		scoreProgress,
		movesProgress,
	}: {
		renderer: Renderer
		setGameContainerSize: (
			sizes: {
				width: number
				height: number
			} | null
		) => void
		openWinModal: () => void
		openLossModal: () => void
		boosterProps: BoosterCommonProps
		grid: Grid
		field: Field
		scoreProgress: Progress
		movesProgress: Progress
	}) {
		this.renderer = renderer
		this.setGameContainerSize = setGameContainerSize
		this.openWinModal = openWinModal
		this.openLossModal = openLossModal

		this.grid = grid
		this.field = field
		this.scoreProgress = scoreProgress
		this.movesProgress = movesProgress

		this.boosterManager = new BoosterManager({
			getTilesInRadius: this.field.getTilesInRadius.bind(this.field),
			removeTilesFromCenter: this.removeTilesFromCenter.bind(this),
			processRemovingTiles: this.processRemovingTiles.bind(this),
			selectTile: this.selectTile.bind(this),
			swapTiles: this.swapTiles.bind(this),
			boosterProps,
		})

		this.tileClickManager = new TileClickManager({
			getTiles: this.field.getTiles.bind(this.field),
			getTilesInRadius: this.field.getTilesInRadius.bind(this.field),
			getTilesInRow: this.field.getTilesInRow.bind(this.field),
			getTilesInColumn: this.field.getTilesInColumn.bind(this.field),
			getSameKindNeighbourTiles: this.getSameKindNeighbourTiles.bind(this),
			renderTile: (tile: Tile) => {
				return this.renderer.renderTiles({
					tilesSnapshots: [tile.getSnapshot()],
					gridSnapshot: this.grid.getSnapshot(),
				})
			},
			addTile: this.field.addTile.bind(this.field),
			removeTiles: this.removeTiles.bind(this),
			removeTilesFromCenter: this.removeTilesFromCenter.bind(this),
			getPositions: this.field.getPositions.bind(this.field),
		})
	}

	async init() {
		this.renderer.setOnTileClick(this.onTileClick.bind(this))
		await this.renderer.init()
		await this.startNewLevel()
	}

	destroy() {
		this.clearLevel()
		this.renderer.destroy()
	}

	private async clearLevel() {
		await this.renderer.clearTiles()
		this.field.clearTiles()
		this.scoreProgress.clear()
		this.movesProgress.clear()
		this.boosterManager.clear()
		this.animationsManager.clear()
		this.isGameEnded = false
	}

	onResize() {
		this.setGameContainerSize(null)
		const gridSnapshot = this.grid.updateGridSizes()
		this.setGameContainerSize({
			width: gridSnapshot.gridWidth,
			height: gridSnapshot.gridHeight,
		})
		const tilesSnapshots = this.field.getTilesSnapshots()
		this.renderer.resize({ tilesSnapshots, gridSnapshot })
	}

	// #region Level creation

	async startNewLevel() {
		await this.clearLevel()
		this.generateLevelData()
		this.createLevel()
	}

	async restartLevel() {
		await this.clearLevel()
		this.createLevel()
	}

	private generateLevelData() {
		this.levelData.columns = DEFAULT_COLUMNS
		this.levelData.rows = DEFAULT_ROWS
		this.levelData.goalScore = getRandomNumber({
			min: MIN_GOAL_SCORE,
			max: MAX_GOAL_SCORE,
			step: 100,
		})
		this.levelData.movesLimit = this.estimateMoves(this.levelData.goalScore)
	}

	private createLevel() {
		const { columns, rows, goalScore, movesLimit } = this.levelData
		this.boosterManager.setInitialValue()
		this.setGameContainerSize(null)
		this.grid.createGrid({ columns, rows })
		this.field.generateTiles()
		const gridSnapshot = this.grid.getSnapshot()
		this.setGameContainerSize({
			width: gridSnapshot.gridWidth,
			height: gridSnapshot.gridHeight,
		})
		this.renderer.updateFieldOffsets()
		this.renderer.renderTiles({
			tilesSnapshots: this.field.getTilesSnapshots(),
			gridSnapshot: gridSnapshot,
		})
		this.scoreProgress.setTargetValue(goalScore)
		this.movesProgress.setTargetValue(movesLimit)
		this.scoreProgress.renderCounters()
		this.movesProgress.renderCounters()
	}

	/** Based on average score per move */
	private estimateMoves(targetScore: number): number {
		if (targetScore <= 0) {
			return 0
		}

		const avgCombo = getRandomNumber({ min: MIN_AVG_COMBO, max: MAX_AVG_COMBO })
		const avgScorePerMove = this.getPoints(avgCombo)
		const moves = targetScore / avgScorePerMove

		return Math.ceil(moves)
	}

	// #endregion

	private selectTile(tile: Tile) {
		this.renderer.selectTile({
			tileSnapshot: tile.getSnapshot(),
			gridSnapshot: this.grid.getSnapshot(),
		})
	}

	private swapTiles(tile1: Tile, tile2: Tile) {
		this.field.swapTiles(tile1, tile2)

		const promiseSelection = this.renderer
			.selectTile({
				tileSnapshot: tile2.getSnapshot(),
				gridSnapshot: this.grid.getSnapshot(),
			})
			.then(() => {
				return this.renderer.swapTiles({
					tilesSnapshots: [tile1.getSnapshot(), tile2.getSnapshot()],
					gridSnapshot: this.grid.getSnapshot(),
				})
			})
			.then(() => {
				return Promise.all([
					this.renderer.unselectTile({
						tileSnapshot: tile1.getSnapshot(),
						gridSnapshot: this.grid.getSnapshot(),
					}),
					this.renderer.unselectTile({
						tileSnapshot: tile2.getSnapshot(),
						gridSnapshot: this.grid.getSnapshot(),
					}),
				])
			})
			.then(() => {})

		this.animationsManager.animate(promiseSelection)
	}

	// #region Tile interaction

	private onTileClick(id: string) {
		if (this.isGameEnded) {
			return
		}

		const tile = this.field.getTileById(id)
		if (tile === undefined || tile.getIsBlocked()) {
			return
		}

		const isBoosterUsed = this.boosterManager.maybeUseBooster(tile)
		if (isBoosterUsed) {
			return
		}

		const result = this.tileClickManager.onClick(tile)

		this.processRemovingTiles(result)
	}

	private getSameKindNeighbourTiles(tile: Tile) {
		const position = tile.getPosition()
		const kind = tile.getKind()

		const tilesToRemove = new Set<Tile>([tile])
		const positionsToRemove = new Set<TilePosition>([position])

		for (const tileToRemove of tilesToRemove) {
			const neighborPositions = this.grid.getNeighbourPositions(
				tileToRemove.getPosition()
			)
			for (const neighborPosition of neighborPositions) {
				if (positionsToRemove.has(neighborPosition)) {
					continue
				}
				const neighborTile = this.field.getTile(neighborPosition)
				if (
					neighborTile !== undefined &&
					neighborTile.getKind() === kind &&
					!neighborTile.getIsBlocked()
				) {
					tilesToRemove.add(neighborTile)
					positionsToRemove.add(neighborPosition)
				}
			}
		}

		return { tilesToRemove, positionsToRemove }
	}

	private removeTiles(tiles: Set<Tile>): Promise<void> {
		const ids = new Set<string>()
		for (const tile of tiles) {
			const removedTileId = tile.getId()
			tile.setIsBlocked(true)
			this.field.removeTile(tile.getPosition())
			ids.add(removedTileId)
		}

		return new Promise<void>((resolve) => {
			ids.forEach((id) => {
				this.renderer.removeTile(id)
			})
			wait(TILE_DELAY_BETWEEN_REMOVALS_MS).then(() => {
				resolve()
			})
		})
	}

	private removeTilesFromCenter(
		tiles: Set<Tile>,
		centerPosition: TilePosition
	): Promise<void> {
		const { column: centerColumn, row: centerRow } = centerPosition
		const groupedTiles = new Map<number, Set<Tile>>()
		for (const tile of tiles) {
			const distance = Math.max(
				Math.abs(tile.getPosition().column - centerColumn),
				Math.abs(tile.getPosition().row - centerRow)
			)
			const tiles = groupedTiles.get(distance) || new Set<Tile>()
			tiles.add(tile)
			groupedTiles.set(distance, tiles)
		}
		const sortedGroupedTiles = Array.from(groupedTiles.entries()).sort(
			(a, b) => a[0] - b[0]
		)

		const animationPromises = new Set<Promise<void>>()
		for (const [_, tiles] of sortedGroupedTiles) {
			const removeTilesPromise = this.removeTiles(tiles)
			animationPromises.add(removeTilesPromise)
		}

		return (async () => {
			for (const promise of animationPromises) {
				await promise
			}
		})()
	}

	private processRemovingTiles(result: TileClickHandlerResult) {
		if (result === null) {
			return
		}

		const { removedTiles, removedPositions, removingPromise } = result

		const points = this.getPoints(removedTiles.size)
		this.scoreProgress.addCurrentValue(points)
		this.movesProgress.addCurrentValue()

		const fillEmptyPositionsPromise = this.fillEmptyPositions(removedPositions)

		const animationPromise = removingPromise
			.then(() => fillEmptyPositionsPromise)
			.then(() => this.checkForMove())
		this.animationsManager.animate(animationPromise)

		this.checkGameEnd()
	}

	private fillEmptyPositions(positions: Set<TilePosition>) {
		const { movedTiles, newTiles } = this.field.fillEmptyPositions(positions)

		const temporaryBlockedTiles = new Set<Tile>()

		for (const movedTile of movedTiles) {
			temporaryBlockedTiles.add(movedTile)
			movedTile.setIsBlocked(true)
		}
		for (const newTile of newTiles) {
			temporaryBlockedTiles.add(newTile)
			newTile.setIsBlocked(true)
		}

		const gridSnapshot = this.grid.getSnapshot()

		const newTilesSnapshotsByColumns = new Map<number, Array<TileSnapshot>>()
		for (const tile of newTiles) {
			const column = tile.getPosition().column
			const tilesSnapshots = newTilesSnapshotsByColumns.get(column) || []
			tilesSnapshots.push(tile.getSnapshot())
			newTilesSnapshotsByColumns.set(column, tilesSnapshots)
		}

		const renderTasks: Array<Promise<void>> = []
		for (const [_, tilesSnapshots] of newTilesSnapshotsByColumns) {
			tilesSnapshots.sort((a, b) => b.row - a.row)

			renderTasks.push(
				this.renderer.renderTiles({
					tilesSnapshots: tilesSnapshots,
					gridSnapshot,
					isAppearOnDefaultPosition: true,
				})
			)
		}

		return this.renderer
			.fallTilesToCurrentPositions({
				tilesSnapshots: Array.from(movedTiles).map((tile) =>
					tile.getSnapshot()
				),
				gridSnapshot,
			})
			.then(() => {
				return Promise.all(renderTasks)
			})
			.then(() => {
				for (const blockedTile of temporaryBlockedTiles) {
					blockedTile.setIsBlocked(false)
				}
			})
	}

	// #endregion

	// #region Shuffle filed

	private async shuffleField() {
		this.field.shuffle()
		const tiles = this.field.getTiles()
		await this.renderer.shuffleTiles({
			tilesSnapshots: Array.from(tiles).map((tile) => tile.getSnapshot()),
			gridSnapshot: this.grid.getSnapshot(),
		})
	}

	// #endregion

	// #region Progress

	/** Uses power scale formula */
	private getPoints(removedTilesNumber: number) {
		return Math.round(
			BASE_SCORE * Math.pow(removedTilesNumber, GROWTH_EXPONENT)
		)
	}

	// #endregion

	// #region Boosters

	onBoosterButtonClick(boosterName: BoosterName) {
		this.boosterManager.onBoosterButtonClick(boosterName)
	}

	// #endregion

	// #region Game End

	private checkGameEnd() {
		if (this.isGameEnded) {
			return
		}

		if (this.scoreProgress.isTargetReached()) {
			this.win()
		} else if (this.movesProgress.isTargetReached()) {
			this.lose()
		}
	}

	private async checkForMove() {
		if (this.isGameEnded) {
			return
		}

		const isPossibleToMakeMove = this.isPossibleToMakeMove()
		if (isPossibleToMakeMove) {
			return
		}

		if (this.shuffleAttempts >= MAX_SHUFFLE_ATTEMPTS) {
			this.lose()
			return
		}

		this.shuffleAttempts++
		let attempts = 0
		while (!this.isPossibleToMakeMove()) {
			const shuffleFieldPromise = this.shuffleField()
			await this.animationsManager.animate(shuffleFieldPromise)
			attempts++
			// Prevent infinite loop
			if (attempts >= 100) {
				this.lose()
				return
			}
		}
	}

	private isPossibleToMakeMove() {
		const tiles = this.field.getTiles()
		return tiles.some((tile) => {
			if (isTileKindSpecial(tile.getKind())) {
				return true
			}
			const { tilesToRemove } = this.getSameKindNeighbourTiles(tile)
			return tilesToRemove.size > 1
		})
	}

	private win() {
		if (this.isGameEnded) {
			return
		}

		this.isGameEnded = true
		this.animationsManager.waitAllAnimations().then(() => this.openWinModal())
	}

	private lose() {
		if (this.isGameEnded) {
			return
		}

		this.isGameEnded = true
		this.animationsManager.waitAllAnimations().then(() => this.openLossModal())
	}

	// #endregion
}
