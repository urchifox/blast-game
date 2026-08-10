import { TileClickManager } from "./tile-handlers/tileClickManager"
import { BoosterManager } from "./boosters/boosterManager"
import { CompletionManager } from "./domain/completionManager"
import { ProgressManager } from "./progressManager"
import { LevelData, LevelGenerator } from "./domain/levelGenerator"
import { GameRules } from "./domain/gameRules"
import { BoosterName, GameCompletionStatus } from "./domain/types"
import { FieldQueries } from "./domain/fieldQueries"
import { Presenter } from "./presenter"
import { ActResult } from "./actionManager"

export type GameProps = {
	fieldQueries: FieldQueries
	presenter: Presenter
	gameRules: GameRules
	levelGenerator: LevelGenerator
	progressManager: ProgressManager
	tileClickManager: TileClickManager
	boosterManager: BoosterManager
	completionManager: CompletionManager
	openWinModal: () => void
	openLossModal: () => void
}

export class Game {
	private readonly fieldQueries: GameProps["fieldQueries"]
	private readonly presenter: GameProps["presenter"]
	private readonly gameRules: GameProps["gameRules"]
	private readonly levelGenerator: GameProps["levelGenerator"]
	private readonly progressManager: GameProps["progressManager"]
	private readonly tileClickManager: GameProps["tileClickManager"]
	private readonly boosterManager: GameProps["boosterManager"]
	private readonly completionManager: GameProps["completionManager"]
	private readonly openWinModal: GameProps["openWinModal"]
	private readonly openLossModal: GameProps["openLossModal"]

	private levelData: LevelData = {
		columns: 0,
		rows: 0,
		goalScore: 0,
		movesLimit: 0,
	}

	constructor(props: GameProps) {
		this.fieldQueries = props.fieldQueries
		this.presenter = props.presenter
		this.gameRules = props.gameRules
		this.levelGenerator = props.levelGenerator
		this.progressManager = props.progressManager
		this.tileClickManager = props.tileClickManager
		this.boosterManager = props.boosterManager
		this.completionManager = props.completionManager
		this.openWinModal = props.openWinModal
		this.openLossModal = props.openLossModal
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
		await this.createLevel()
	}

	async restartLevel() {
		await this.clearLevel()
		await this.createLevel()
	}

	private async createLevel() {
		const { columns, rows, goalScore, movesLimit } = this.levelData
		this.boosterManager.setInitialValue()
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

	private processActResult(actResult: Promise<ActResult>) {
		const animationPromise = async () => {
			const result = await actResult
			const { removedTiles } = result
			const removedPositions = new Set(
				[...removedTiles].map((tile) => tile.getPosition())
			)
			const points = this.gameRules.getPoints(removedTiles.size)
			this.progressManager.addProgress({points, moves: 1})
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
