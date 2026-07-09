import { BoosterName, BoosterCommonProps } from "./boosters/booster"
import { Field } from "./field"
import { Grid } from "./grid"
import { Renderer } from "./rendering/renderer"
import { Tile } from "./tile"
import { AnimationsManager } from "../helpers/animationManager"
import { TileClickManager } from "./tile-handlers/tileClickManager"
import { BoosterManager } from "./boosters/boosterManager"
import { CompletionManager } from "./completionManager"
import { ProgressManager } from "./progressManager"
import { LevelData, LevelGenerator } from "./levelGenerator"
import { GameRules } from "./gameRules"
import { TileClickHandlerResult } from "./types"
import { FieldManipulator } from "./fieldManipulator"

export class GameBlast {
	private readonly renderer: Renderer
	private readonly grid: Grid
	private readonly field: Field

	private readonly setGameContainerSize: (
		sizes: {
			width: number
			height: number
		} | null
	) => void
	private readonly animationsManager: AnimationsManager

	private levelGenerator: LevelGenerator
	private tileClickManager: TileClickManager
	private boosterManager: BoosterManager
	private completionManager: CompletionManager
	private progressManager: ProgressManager
	private gameRules: GameRules
	private fieldManipulator: FieldManipulator

	private levelData: LevelData = {
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
		progressManager,
		gameRules,
		levelGenerator,
		animationsManager,
		fieldManipulator,
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
		progressManager: ProgressManager
		gameRules: GameRules
		levelGenerator: LevelGenerator
		animationsManager: AnimationsManager
		fieldManipulator: FieldManipulator
	}) {
		this.renderer = renderer
		this.setGameContainerSize = setGameContainerSize
		this.levelGenerator = levelGenerator
		this.gameRules = gameRules
		this.grid = grid
		this.field = field
		this.animationsManager = animationsManager
		this.fieldManipulator = fieldManipulator

		this.boosterManager = new BoosterManager({
			getTilesInRadius: this.field.getTilesInRadius.bind(this.field),
			removeTilesFromCenter: this.fieldManipulator.removeTilesFromCenter.bind(
				this.fieldManipulator
			),
			processRemovingTiles: this.processRemovingTiles.bind(this),
			selectTile: this.fieldManipulator.selectTile.bind(this.fieldManipulator),
			swapTiles: this.fieldManipulator.swapTiles.bind(this.fieldManipulator),
			boosterProps,
			gameRules,
		})

		this.tileClickManager = new TileClickManager({
			getTiles: this.field.getTiles.bind(this.field),
			getTilesInRadius: this.field.getTilesInRadius.bind(this.field),
			getTilesInRow: this.field.getTilesInRow.bind(this.field),
			getTilesInColumn: this.field.getTilesInColumn.bind(this.field),
			getSameKindNeighbourTiles:
				this.fieldManipulator.getSameKindNeighbourTiles.bind(
					this.fieldManipulator
				),
			renderTile: (tile: Tile) => {
				return this.renderer.renderTiles({
					tilesSnapshots: [tile.getSnapshot()],
					gridSnapshot: this.grid.getSnapshot(),
				})
			},
			addTile: this.field.addTile.bind(this.field),
			removeTiles: this.fieldManipulator.removeTiles.bind(
				this.fieldManipulator
			),
			removeTilesFromCenter: this.fieldManipulator.removeTilesFromCenter.bind(
				this.fieldManipulator
			),
			getPositions: this.field.getPositions.bind(this.field),
			gameRules,
		})
		this.progressManager = progressManager
		this.completionManager = new CompletionManager({
			gameRules,
			openWinModal,
			openLossModal,
			shuffleField: () => {
				const shuffleFieldPromise = this.fieldManipulator.shuffleField()
				return this.animationsManager.animate(shuffleFieldPromise)
			},
			getTiles: this.field.getTiles.bind(this.field),
			getSameKindNeighbourTiles:
				this.fieldManipulator.getSameKindNeighbourTiles.bind(
					this.fieldManipulator
				),
			isScoreTargetReached: this.progressManager.isScoreTargetReached.bind(
				this.progressManager
			),
			isMovesTargetReached: this.progressManager.isMovesTargetReached.bind(
				this.progressManager
			),
			waitAllAnimations: this.animationsManager.waitAllAnimations.bind(
				this.animationsManager
			),
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
		await this.fieldManipulator.clear()
		this.progressManager.clear()
		this.boosterManager.clear()
		this.completionManager.clear()
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
		this.levelData = this.levelGenerator.generateLevelData()
		this.createLevel()
	}

	async restartLevel() {
		await this.clearLevel()
		this.createLevel()
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
		this.progressManager.setinitialValues({ goalScore, movesLimit })
	}

	// #endregion

	private onTileClick(id: string) {
		if (this.completionManager.isGameCompleted()) {
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

	onBoosterButtonClick(boosterName: BoosterName) {
		this.boosterManager.onBoosterButtonClick(boosterName)
	}

	private processRemovingTiles(result: TileClickHandlerResult) {
		if (result === null) {
			return
		}

		const { removedTiles, removedPositions, removingPromise } = result

		const points = this.gameRules.getPoints(removedTiles.size)
		this.progressManager.addProgress(points)

		const fillEmptyPositionsPromise =
			this.fieldManipulator.fillEmptyPositions(removedPositions)

		const animationPromise = removingPromise
			.then(() => fillEmptyPositionsPromise)
			.then(() => this.completionManager.checkForMove())
		this.animationsManager.animate(animationPromise)

		this.completionManager.checkGameCompletion()
	}
}
