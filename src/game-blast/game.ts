import { TileClickManager } from "./flow/tileClickManager"
import { BoosterManager } from "./flow/boosterManager"
import { CompletionManager } from "./domain/completionManager"
import { ProgressManager } from "./flow/progressManager"
import { LevelData, LevelGenerator } from "./domain/levelGenerator"
import { BoosterName, GameCompletionStatus } from "./domain/types"
import { FieldQueries } from "./domain/fieldQueries"
import { PresenterContract, ModalUIContract } from "./types"
import { ActResult } from "./flow/actionManager"

export type GameProps = {
	fieldQueries: FieldQueries
	presenter: PresenterContract
	levelGenerator: LevelGenerator
	progressManager: ProgressManager
	tileClickManager: TileClickManager
	boosterManager: BoosterManager
	completionManager: CompletionManager
	winModalUI: ModalUIContract
	lossModalUI: ModalUIContract
}

export class Game {
	private readonly fieldQueries: GameProps["fieldQueries"]
	private readonly presenter: GameProps["presenter"]
	private readonly levelGenerator: GameProps["levelGenerator"]
	private readonly progressManager: GameProps["progressManager"]
	private readonly tileClickManager: GameProps["tileClickManager"]
	private readonly boosterManager: GameProps["boosterManager"]
	private readonly completionManager: GameProps["completionManager"]
	private readonly winModalUI: GameProps["winModalUI"]
	private readonly lossModalUI: GameProps["lossModalUI"]

	private levelData: LevelData = {
		columns: 0,
		rows: 0,
		goalScore: 0,
		movesLimit: 0,
	}

	constructor(props: GameProps) {
		this.fieldQueries = props.fieldQueries
		this.presenter = props.presenter
		this.levelGenerator = props.levelGenerator
		this.progressManager = props.progressManager
		this.tileClickManager = props.tileClickManager
		this.boosterManager = props.boosterManager
		this.completionManager = props.completionManager
		this.winModalUI = props.winModalUI
		this.lossModalUI = props.lossModalUI
	}

	async init() {
		await this.presenter.init(this.onTileClick.bind(this))
		await this.initNewLevel()
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

	private async initNewLevel() {
		this.levelData = this.levelGenerator.generateLevelData()
		await this.createLevel()
	}

	async startNewLevel() {
		await this.clearLevel()
		await this.initNewLevel()
	}

	async restartLevel() {
		await this.clearLevel()
		await this.createLevel()
	}

	private async createLevel() {
		const { columns, rows, goalScore, movesLimit } = this.levelData
		this.boosterManager.reset()
		await this.presenter.create({ columns, rows })
		this.progressManager.setInitialValues({ goalScore, movesLimit })
	}

	// #endregion

	private onTileClick(id: string) {
		if (this.completionManager.isGameCompleted()) {
			return
		}

		const tile = this.fieldQueries.getTileById(id)
		if (tile === undefined || tile.isBlocked) {
			return
		}

		const boosterHandlerResult = this.boosterManager.maybeUseBooster(tile)
		const actResult = boosterHandlerResult.isUsed
			? boosterHandlerResult.actResult
			: this.tileClickManager.onClick(tile)
		if (actResult === null) {
			return
		}
		this.processActResult(actResult)
	}

	onBoosterButtonClick(boosterName: BoosterName) {
		this.boosterManager.onBoosterButtonClick(boosterName)
	}

	private processActResult(actResult: ActResult) {
		const animationPromise = async () => {
			const result = actResult
			const { removedTiles } = result
			const removedPositions = new Set(
				[...removedTiles].map((tile) => tile.getPosition())
			)
			this.progressManager.processMove(removedTiles.size)
			await this.presenter.fillEmptyPositions(removedPositions)
			await this.maybeShuffle()
		}
		this.presenter.animateAndWaitForAll(animationPromise()).then(() => {
			this.processGameCompletion()
		})
	}

	async maybeShuffle() {
		const isShuffleNeeded = this.completionManager.isShuffleNeeded()
		if (!isShuffleNeeded) {
			return
		}
		// Prevent infinite loop
		let attempts = 0
		while (attempts < 100 && this.completionManager.isShuffleNeeded()) {
			await this.presenter.shuffleField()
			attempts++
		}
		this.completionManager.updateShuffleAttempts()
	}

	private processGameCompletion() {
		const gameCompletionStatus = this.completionManager.checkGameCompletion()
		switch (gameCompletionStatus) {
			case GameCompletionStatus.IN_PROGRESS:
				return
			case GameCompletionStatus.WIN:
				this.winModalUI.open()
				break
			case GameCompletionStatus.LOSS:
				this.lossModalUI.open()
				break
			default:
				return
		}
	}
}
