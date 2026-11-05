import { TilesManager } from "./flow/tilesManager"
import { BoosterManager } from "./flow/boosterManager"
import { CompletionManager } from "./domain/completionManager"
import { ProgressManager } from "./flow/progressManager"
import { BoosterName, GameCompletionStatus } from "./domain/types"
import { FieldQueries } from "./domain/fieldQueries"
import {
	PresenterContract,
	ModalUIContract,
	LevelGeneratorContract,
	LevelData,
} from "./types"
import { Tile } from "./domain/tile"

export type GameProps = {
	fieldQueries: FieldQueries
	presenter: PresenterContract
	levelGenerator: LevelGeneratorContract
	progressManager: ProgressManager
	tilesManager: TilesManager
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
	private readonly tilesManager: GameProps["tilesManager"]
	private readonly boosterManager: GameProps["boosterManager"]
	private readonly completionManager: GameProps["completionManager"]
	private readonly winModalUI: GameProps["winModalUI"]
	private readonly lossModalUI: GameProps["lossModalUI"]

	private levelData: LevelData = {
		tilesProps: new Set(),
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
		this.tilesManager = props.tilesManager
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
		const { columns, rows, goalScore, movesLimit, tilesProps } = this.levelData
		this.boosterManager.clear()
		await this.presenter.create({ columns, rows, tilesProps })
		this.progressManager.setInitialValues({ goalScore, movesLimit })
	}

	// #endregion

	private async onTileClick(id: string) {
		if (this.completionManager.isGameCompleted()) {
			return
		}

		const tile = this.fieldQueries.getTileById(id)
		if (tile === undefined || tile.isLocked()) {
			return
		}

		const boosterHandlerResult = this.boosterManager.maybeUseBooster(tile)
		const actResult = boosterHandlerResult.isUsed
			? boosterHandlerResult.actResult
			: this.tilesManager.onClick(tile)
		if (actResult === null) {
			return
		}
		await this.processRemovingTiles(actResult.removedTiles)
	}

	onBoosterButtonClick(boosterName: BoosterName) {
		this.boosterManager.onBoosterButtonClick(boosterName)
	}

	private async processRemovingTiles(initialRemovedTiles: Set<Tile>) {
		const removedTiles = new Set(initialRemovedTiles)
		const triggeredTiles = new Set<Tile>()

		const triggerTile = async (tile: Tile) => {
			if (triggeredTiles.has(tile)) {
				return
			}
			triggeredTiles.add(tile)
			await this.presenter.waitForTileAnimations(tile)

			const actResult = this.tilesManager.onRemove(tile)
			if (actResult === null) {
				return
			}

			const chainedTriggers = []
			for (const chainedTile of actResult.removedTiles) {
				if (removedTiles.has(chainedTile)) {
					continue
				}
				removedTiles.add(chainedTile)
				chainedTriggers.push(triggerTile(chainedTile))
			}

			await Promise.all(chainedTriggers)
		}

		await Promise.all([...initialRemovedTiles].map(triggerTile))

		this.progressManager.processMove(removedTiles.size)

		await this.presenter.processRemovedTiles(removedTiles)
		await this.maybeShuffle()
		this.processGameCompletion()
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
