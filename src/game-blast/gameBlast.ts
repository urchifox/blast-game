import { BoosterName, BoosterCommonProps } from "./boosters/booster"
import { Renderer } from "./rendering/renderer"
import { AnimationsManager } from "../helpers/animationManager"
import { TileClickManager } from "./tile-handlers/tileClickManager"
import { BoosterManager } from "./boosters/boosterManager"
import { CompletionManager } from "./completionManager"
import { ProgressManager } from "./progressManager"
import { LevelData, LevelGenerator } from "./levelGenerator"
import { GameRules } from "./gameRules"
import { TileClickHandlerResult } from "./types"
import { FieldManipulator } from "./fieldManipulator"

type GameBlastProps = {
	fieldManipulator: FieldManipulator
	gameRules: GameRules
	levelGenerator: LevelGenerator
	progressManager: ProgressManager
	renderer: Renderer
	animationsManager: AnimationsManager
	boosterProps: BoosterCommonProps
	openWinModal: () => void
	openLossModal: () => void
}

export class GameBlast {
	private readonly fieldManipulator: GameBlastProps["fieldManipulator"]
	private readonly gameRules: GameBlastProps["gameRules"]
	private readonly levelGenerator: GameBlastProps["levelGenerator"]
	private readonly progressManager: GameBlastProps["progressManager"]
	private readonly renderer: GameBlastProps["renderer"]
	private readonly animationsManager: GameBlastProps["animationsManager"]

	private tileClickManager: TileClickManager
	private boosterManager: BoosterManager
	private completionManager: CompletionManager

	private levelData: LevelData = {
		columns: 0,
		rows: 0,
		goalScore: 0,
		movesLimit: 0,
	}

	constructor(props: GameBlastProps) {
		this.fieldManipulator = props.fieldManipulator
		this.gameRules = props.gameRules
		this.levelGenerator = props.levelGenerator
		this.progressManager = props.progressManager
		this.renderer = props.renderer
		this.animationsManager = props.animationsManager

		this.tileClickManager = new TileClickManager({
			innerFieldManipulator: this.fieldManipulator,
			gameRules: props.gameRules,
		})

		this.boosterManager = new BoosterManager({
			innerFieldManipulator: props.fieldManipulator,
			boosterProps: props.boosterProps,
			gameRules: props.gameRules,
		})

		this.completionManager = new CompletionManager({
			innerFieldManipulator: this.fieldManipulator,
			gameRules: props.gameRules,
			openWinModal: props.openWinModal,
			openLossModal: props.openLossModal,
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
		this.fieldManipulator.updateGameSize()
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
		this.fieldManipulator.create({ columns, rows })
		this.progressManager.setinitialValues({ goalScore, movesLimit })
	}

	// #endregion

	private onTileClick(id: string) {
		if (this.completionManager.isGameCompleted()) {
			return
		}

		const tile = this.fieldManipulator.getTileById(id)
		if (tile === undefined || tile.getIsBlocked()) {
			return
		}

		const boosterhandlerResult = this.boosterManager.maybeUseBooster(tile)
		const handlerResult = boosterhandlerResult.isUsed
			? boosterhandlerResult.result
			: this.tileClickManager.onClick(tile)
		this.processRemovingTiles(handlerResult)
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
