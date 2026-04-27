import { getElementInnerSize } from "../helpers/dom"
import { getRandomNumber } from "../helpers/random"
import {
	BASE_SCORE,
	DEFAULT_COLUMNS,
	DEFAULT_ROWS,
	GROWTH_EXPONENT,
	MAX_AVG_COMBO,
	MAX_GOAL_SCORE,
	MIN_AVG_COMBO,
	MIN_GOAL_SCORE,
} from "./config"
import { Field } from "./field"
import { Grid } from "./grid"
import { Renderer } from "./rendering/renderer"
import { Tile, TilePosition, TileSnapshot } from "./tile"

export class GameBlast {
	private readonly container: HTMLElement
	private readonly renderer: Renderer
	private readonly grid: Grid
	private readonly field: Field
	private readonly toggleContainerFullSizeMode: (isFullSize: boolean) => void
	private readonly blockedTileIds = new Set<string>()

	private columns = 0
	private rows = 0

	private movesNumber = 0
	private movesLimit = 0
	private readonly updateMovesCounter: ({
		movesNumber,
		movesLimit,
	}: {
		movesNumber: number
		movesLimit: number
	}) => void

	private score = 0
	private goalScore = 0
	private readonly updateScoreCounter: ({
		score,
		goalScore,
	}: {
		score: number
		goalScore: number
	}) => void

	private readonly openWinModal: () => void
	private readonly openLossModal: () => void

	private isGameEnded = false

	constructor({
		container,
		renderer,
		toggleContainerFullSizeMode,
		updateMovesCounter,
		updateScoreCounter,
		openWinModal,
		openLossModal,
	}: {
		container: HTMLElement
		renderer: Renderer
		toggleContainerFullSizeMode: (isFullSize: boolean) => void
		updateMovesCounter: ({
			movesNumber,
			movesLimit,
		}: {
			movesNumber: number
			movesLimit: number
		}) => void
		updateScoreCounter: ({
			score,
			goalScore,
		}: {
			score: number
			goalScore: number
		}) => void
		openWinModal: () => void
		openLossModal: () => void
	}) {
		this.container = container
		this.renderer = renderer
		this.toggleContainerFullSizeMode = toggleContainerFullSizeMode
		this.updateMovesCounter = updateMovesCounter
		this.updateScoreCounter = updateScoreCounter
		this.openWinModal = openWinModal
		this.openLossModal = openLossModal

		this.grid = new Grid({
			getContainerSize: () => getElementInnerSize({ element: this.container }),
		})

		this.field = new Field({
			getFieldSnapshot: this.grid.getSnapshot.bind(this.grid),
		})
	}

	async init() {
		this.renderer.setOnTileClick(this.onTileClick.bind(this))
		await this.renderer.init()
		this.startNewLevel()
	}

	destroy() {
		this.clearLevel()
		this.renderer.destroy()
	}

	private async clearLevel() {
		await this.renderer.clearTiles()
		this.field.clearTiles()
		this.movesNumber = 0
		this.score = 0
	}

	onResize() {
		this.toggleContainerFullSizeMode(true)
		const snapshot = this.grid.updateGridSizes()
		this.toggleContainerFullSizeMode(false)
		const tilesSnapshots = this.field.getTilesSnapshots()
		this.renderer.resize(tilesSnapshots, snapshot)
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
		this.columns = DEFAULT_COLUMNS
		this.rows = DEFAULT_ROWS

		this.goalScore = getRandomNumber({
			min: MIN_GOAL_SCORE,
			max: MAX_GOAL_SCORE,
			step: 100,
		})

		this.movesLimit = this.estimateMoves(this.goalScore)
	}

	private createLevel() {
		this.toggleContainerFullSizeMode(true)
		this.grid.createGrid(this.columns, this.rows)
		this.field.generateTiles()
		this.renderer.renderTiles({
			tilesSnapshots: this.field.getTilesSnapshots(),
			gridSnapshot: this.grid.getSnapshot(),
		})
		this.toggleContainerFullSizeMode(false)
		this.updateMovesCounter({
			movesNumber: this.movesNumber,
			movesLimit: this.movesLimit,
		})
		this.updateScoreCounter({
			score: this.score,
			goalScore: this.goalScore,
		})
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

	// #region Tile interaction

	private async onTileClick(id: string) {
		if (this.isGameEnded) {
			return
		}

		if (this.blockedTileIds.has(id)) {
			return
		}

		const tile = this.field.getTileById(id)
		if (tile === undefined) {
			return
		}

		const { tilesToRemove, positionsToRemove } =
			this.getSameKindNeighbourTiles(tile)
		if (tilesToRemove.size === 1) {
			return
		}

		this.removeTiles(tilesToRemove)
		this.updateScore(tilesToRemove.size)
		this.updateMoves()

		await this.fillEmptyPositions(positionsToRemove)

		this.checkGameEnd()
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
					!this.blockedTileIds.has(neighborTile.getId())
				) {
					tilesToRemove.add(neighborTile)
					positionsToRemove.add(neighborPosition)
				}
			}
		}

		return { tilesToRemove, positionsToRemove }
	}

	private removeTiles(tiles: Set<Tile>) {
		for (const tile of tiles) {
			const removedTileId = tile.getId()
			this.blockedTileIds.add(removedTileId)
			this.field.removeTile(tile.getPosition())
			this.renderer.removeTile(removedTileId)
		}
	}

	private async fillEmptyPositions(positions: Set<TilePosition>) {
		const { movedTiles, newTiles } = this.field.fillEmptyPositions(positions)

		const temporaryblockedTilesIds = new Set<string>()

		for (const movedTile of movedTiles) {
			const movedTileId = movedTile.getId()
			temporaryblockedTilesIds.add(movedTileId)
			this.blockedTileIds.add(movedTileId)
		}
		for (const newTile of newTiles) {
			const newTileId = newTile.getId()
			temporaryblockedTilesIds.add(newTileId)
			this.blockedTileIds.add(newTileId)
		}

		const gridSnapshot = this.grid.getSnapshot()

		await this.renderer.moveTiles({
			tilesSnapshots: Array.from(movedTiles).map((tile) => tile.getSnapshot()),
			gridSnapshot,
		})

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

		await Promise.all(renderTasks)
		for (const blockedTileId of temporaryblockedTilesIds) {
			this.blockedTileIds.delete(blockedTileId)
		}
	}

	// #endregion

	// #region Progress

	private updateMoves() {
		this.movesNumber++
		this.updateMovesCounter({
			movesNumber: this.movesNumber,
			movesLimit: this.movesLimit,
		})
	}

	/** Uses power scale formula */
	private getPoints(removedTilesNumber: number) {
		return Math.round(
			BASE_SCORE * Math.pow(removedTilesNumber, GROWTH_EXPONENT)
		)
	}

	private updateScore(removedTilesNumber: number) {
		const points = this.getPoints(removedTilesNumber)
		this.score += points
		this.updateScoreCounter({
			score: this.score,
			goalScore: this.goalScore,
		})
	}

	// #endregion

	// #region Game End

	private checkGameEnd() {
		if (this.isGameEnded) {
			return
		}

		if (this.score >= this.goalScore) {
			this.win()
		} else if (this.movesNumber >= this.movesLimit) {
			this.lose()
		} else if (!this.isPossibleToMakeMove()) {
			this.lose()
		}
	}

	private isPossibleToMakeMove() {
		const tiles = this.field.getTiles()
		return tiles.some((tile) => {
			const { tilesToRemove } = this.getSameKindNeighbourTiles(tile)
			return tilesToRemove.size > 1
		})
	}

	private win() {
		if (this.isGameEnded) {
			return
		}

		this.isGameEnded = true
		this.openWinModal()
	}

	private lose() {
		if (this.isGameEnded) {
			return
		}

		this.isGameEnded = true
		this.openLossModal()
	}

	// #endregion
}
