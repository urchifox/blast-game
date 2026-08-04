import { RandomizationFunction } from "../helpers/random"
import { BoosterName, BoosterCommonProps } from "./boosters/booster"
import { TileClickManager } from "./tile-handlers/tileClickManager"
import { BoosterManager } from "./boosters/boosterManager"
import { CompletionManager } from "./completionManager"
import { ProgressManager } from "./progressManager"
import { LevelData, LevelGenerator } from "./levelGenerator"
import { GameRules } from "./gameRules"
import { GameCompletionStatus, TileRemovingInfo } from "./types"
import { FieldQueries } from "./fieldQueries"
import { Presenter } from "./presenter"

type GameBlastProps = {
	fieldQueries: FieldQueries
	presenter: Presenter
	gameRules: GameRules
	levelGenerator: LevelGenerator
	progressManager: ProgressManager
	boosterProps: BoosterCommonProps
	randomizationFunction: RandomizationFunction
	openWinModal: () => void
	openLossModal: () => void
}

export class GameBlast {
	private readonly fieldQueries: GameBlastProps["fieldQueries"]
	private readonly presenter: GameBlastProps["presenter"]
	private readonly gameRules: GameBlastProps["gameRules"]
	private readonly levelGenerator: GameBlastProps["levelGenerator"]
	private readonly progressManager: GameBlastProps["progressManager"]
	private readonly openWinModal: GameBlastProps["openWinModal"]
	private readonly openLossModal: GameBlastProps["openLossModal"]

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
		this.fieldQueries = props.fieldQueries
		this.presenter = props.presenter
		this.gameRules = props.gameRules
		this.levelGenerator = props.levelGenerator
		this.progressManager = props.progressManager
		this.openWinModal = props.openWinModal
		this.openLossModal = props.openLossModal

		this.tileClickManager = new TileClickManager({
			fieldQueries: this.fieldQueries,
			presenter: this.presenter,
			gameRules: props.gameRules,
			randomizationFunction: props.randomizationFunction,
		})

		this.boosterManager = new BoosterManager({
			fieldQueries: this.fieldQueries,
			presenter: props.presenter,
			boosterProps: props.boosterProps,
			gameRules: props.gameRules,
		})

		this.completionManager = new CompletionManager({
			fieldQueries: this.fieldQueries,
			presenter: this.presenter,
			gameRules: props.gameRules,
			isScoreTargetReached: this.progressManager.isScoreTargetReached.bind(
				this.progressManager
			),
			isMovesTargetReached: this.progressManager.isMovesTargetReached.bind(
				this.progressManager
			),
		})
	}

	async init() {
		await this.presenter.init(this.onTileClick.bind(this))
		await this.startNewLevel()
	}

	async destroy() {
		await this.clearLevel()
		this.presenter.destroy()
	}

	private async clearLevel() {
		await this.presenter.clear()
		this.progressManager.clear()
		this.boosterManager.clear()
		this.completionManager.clear()
	}

	onResize() {
		this.presenter.updateGameSize()
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
		this.presenter.create({ columns, rows })
		this.progressManager.setInitialValues({ goalScore, movesLimit })
	}

	// #endregion

	private onTileClick(id: string) {
		if (this.completionManager.isGameCompleted()) {
			return
		}

		const tile = this.fieldQueries.getTileById(id)
		if (tile === undefined || tile.getIsBlocked()) {
			return
		}

		const boosterHandlerResult = this.boosterManager.maybeUseBooster(tile)
		const tileRemovingInfo = boosterHandlerResult.isUsed
			? boosterHandlerResult.tileRemovingInfo
			: this.tileClickManager.onClick(tile)
		this.processRemovingTiles(tileRemovingInfo)
	}

	onBoosterButtonClick(boosterName: BoosterName) {
		this.boosterManager.onBoosterButtonClick(boosterName)
	}

	private processRemovingTiles(tileRemovingInfo: TileRemovingInfo) {
		if (tileRemovingInfo === null) {
			return
		}

		const { removedTiles, removedPositions, removingPromise } = tileRemovingInfo

		const points = this.gameRules.getPoints(removedTiles.size)
		this.progressManager.addProgress(points)

		const animationPromise = removingPromise
			.then(() => this.presenter.fillEmptyPositions(removedPositions))
			.then(() => this.completionManager.checkForMove())
		this.presenter.animateAndWaitForAll(animationPromise).then(() => {
			this.processGameCompletion()
		})
	}

	private processGameCompletion() {
		const gameCompletionStatus = this.completionManager.checkGameCompletion()
		switch (gameCompletionStatus) {
			case GameCompletionStatus.IN_PROGRESS:
				return
			case GameCompletionStatus.WIN:
				this.openWinModal()
				break
			case GameCompletionStatus.LOSS:
				this.openLossModal()
				break
			default:
				return
		}
	}
}
