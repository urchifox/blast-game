import { getElementInnerSize } from "../helpers/dom"
import { getRandomNumber, pickRandomItem } from "../helpers/random"
import { wait } from "../helpers/time"
import {
	BASE_SCORE,
	BOMB_RADIUS,
	DEFAULT_COLUMNS,
	DEFAULT_ROWS,
	GROWTH_EXPONENT,
	MAX_AVG_COMBO,
	MAX_GOAL_SCORE,
	MIN_AVG_COMBO,
	MIN_COMBO_SIZE,
	MIN_GOAL_SCORE,
	TILE_DELAY_BETWEEN_REMOVALS_MS,
} from "./config"
import { Field } from "./field"
import { Grid } from "./grid"
import { Renderer } from "./rendering/renderer"
import {
	isTileKindSpecial,
	Tile,
	TileKindSpecial,
	TilePosition,
	TileSnapshot,
} from "./tile"

type TileClickHandler = (tile: Tile) => TileClickHandlerResult
type TileClickHandlerResult = Promise<{
	removedTiles: Set<Tile>
	removedPositions: Set<TilePosition>
}>

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
		this.isGameEnded = false
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

		const kind = tile.getKind()
		const { removedTiles, removedPositions } = isTileKindSpecial(kind)
			? await this.specialTileHandler[kind](tile)
			: await this.onNormalTileClick(tile)

		if (removedTiles.size === 0) {
			return
		}

		this.updateScore(removedTiles.size)
		this.updateMoves()

		await this.fillEmptyPositions(removedPositions)

		this.checkGameEnd()
	}

	// #region Normal tile handlers

	private async onNormalTileClick(tile: Tile): TileClickHandlerResult {
		const { tilesToRemove, positionsToRemove } =
			this.getSameKindNeighbourTiles(tile)
		if (tilesToRemove.size < MIN_COMBO_SIZE) {
			return {
				removedTiles: new Set<Tile>(),
				removedPositions: new Set<TilePosition>(),
			}
		}

		await this.removeTiles(tilesToRemove)
		this.maybeAddComboPrize(tilesToRemove.size, tile.getPosition())

		return { removedTiles: tilesToRemove, removedPositions: positionsToRemove }
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

	private maybeAddComboPrize(comboSize: number, position: TilePosition) {
		const closestRewardableComboSize = this.rewardableComboSizesSorted.find(
			(value, index, array) => {
				const currentValue = parseInt(value)
				const isCurrentValueLess = currentValue <= comboSize
				if (!isCurrentValueLess) {
					return false
				}
				const isLastValue = index === array.length - 1
				if (isLastValue) {
					return true
				}
				const nextValue = parseInt(array[index + 1])
				const isNextValueGreater = nextValue > comboSize
				return isNextValueGreater
			}
		)
		if (closestRewardableComboSize === undefined) {
			return
		}

		const rewards = this.rewardsForCombo[parseInt(closestRewardableComboSize)]
		if (rewards === undefined) {
			return
		}

		const reward = pickRandomItem(rewards)
		const newTile = this.field.addTile({
			kind: reward,
			position,
		})
		this.renderer.renderTiles({
			tilesSnapshots: [newTile.getSnapshot()],
			gridSnapshot: this.grid.getSnapshot(),
		})
	}

	private rewardsForCombo: Record<number, Array<TileKindSpecial>> = {
		4: ["rockets-column", "rockets-row"],
		6: ["bomb"],
		8: ["dynamite"],
	}

	private rewardableComboSizesSorted = Object.keys(this.rewardsForCombo).sort(
		(key1, key2) => parseInt(key1) - parseInt(key2)
	)

	// #endregion

	// #region Special tile handlers

	private specialTileHandler: Record<TileKindSpecial, TileClickHandler> = {
		bomb: this.onBombTileClick.bind(this),
		dynamite: this.onDynamiteTileClick.bind(this),
		"rockets-column": this.onRocketColumnTileClick.bind(this),
		"rockets-row": this.onRocketRowTileClick.bind(this),
	}

	private async onBombTileClick(tile: Tile): TileClickHandlerResult {
		const { tiles, positions } = this.field.getTilesInRadius(
			tile.getPosition(),
			BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return {
				removedTiles: new Set<Tile>(),
				removedPositions: new Set<TilePosition>(),
			}
		}
		await this.removeTilesFromCenter(tiles, tile.getPosition())
		return {
			removedTiles: tiles,
			removedPositions: positions,
		}
	}

	private async onDynamiteTileClick(tile: Tile): TileClickHandlerResult {
		const tiles = new Set(this.field.getTiles())
		const positions = new Set(this.field.getPositions())
		if (tiles.size === 0) {
			return {
				removedTiles: new Set<Tile>(),
				removedPositions: new Set<TilePosition>(),
			}
		}
		await this.removeTilesFromCenter(tiles, tile.getPosition())
		return {
			removedTiles: tiles,
			removedPositions: positions,
		}
	}

	private async onRocketColumnTileClick(tile: Tile): TileClickHandlerResult {
		const { tiles, positions } = this.field.getTilesInColumn(
			tile.getPosition().column
		)
		if (tiles.size === 0) {
			return {
				removedTiles: new Set<Tile>(),
				removedPositions: new Set<TilePosition>(),
			}
		}
		await this.removeTilesFromCenter(tiles, tile.getPosition())
		return {
			removedTiles: tiles,
			removedPositions: positions,
		}
	}

	private async onRocketRowTileClick(tile: Tile): TileClickHandlerResult {
		const { tiles, positions } = this.field.getTilesInRow(
			tile.getPosition().row
		)
		if (tiles.size === 0) {
			return {
				removedTiles: new Set<Tile>(),
				removedPositions: new Set<TilePosition>(),
			}
		}
		await this.removeTilesFromCenter(tiles, tile.getPosition())
		return {
			removedTiles: tiles,
			removedPositions: positions,
		}
	}

	// #endregion

	private async removeTiles(tiles: Set<Tile>) {
		for (const tile of tiles) {
			const removedTileId = tile.getId()
			this.blockedTileIds.add(removedTileId)
			this.field.removeTile(tile.getPosition())
			this.renderer.removeTile(removedTileId)
		}
		await wait(TILE_DELAY_BETWEEN_REMOVALS_MS)
	}

	private async removeTilesFromCenter(
		tiles: Set<Tile>,
		centerPosition: TilePosition
	) {
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
		for (const [_, tiles] of sortedGroupedTiles) {
			await this.removeTiles(tiles)
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
