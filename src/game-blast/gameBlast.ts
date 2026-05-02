import { getRandomNumber, pickRandomItem } from "../helpers/random"
import { wait } from "../helpers/time"
import { loadingScreen } from "../view/loadingScreen"
import { Booster } from "./booster"
import {
	BASE_SCORE,
	TILE_BOMB_RADIUS,
	BOOSTER_BOMBS_COUNT,
	BOOSTER_TELEPORT_COUNT,
	DEFAULT_COLUMNS,
	DEFAULT_ROWS,
	GROWTH_EXPONENT,
	MAX_AVG_COMBO,
	MAX_GOAL_SCORE,
	MAX_SHUFFLE_ATTEMPTS,
	MIN_AVG_COMBO,
	MIN_COMBO_SIZE,
	MIN_GOAL_SCORE,
	TILE_DELAY_BETWEEN_REMOVALS_MS,
	BOOSTER_BOMB_RADIUS,
} from "./config"
import { Field } from "./field"
import { Grid } from "./grid"
import { Progress } from "./progress"
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
	private readonly blockedTileIds = new Set<string>()

	private columns = 0
	private rows = 0

	private shuffleAttempts = 0

	private readonly openWinModal: () => void
	private readonly openLossModal: () => void

	private isGameEnded = false

	private readonly boosterBombs: Booster
	private readonly boosterTeleport: Booster

	private selectedTile: Tile | null = null

	constructor({
		renderer,
		setGameContainerSize,
		updateMovesCounter,
		updateScoreCounter,
		openWinModal,
		openLossModal,
		getContainerSize,
		updateBoosterBombCounter,
		updateBoosterTeleportCounter,
		onBoosterBombActiveChange,
		onBoosterTeleportActiveChange,
	}: {
		renderer: Renderer
		setGameContainerSize: (
			sizes: {
				width: number
				height: number
			} | null
		) => void
		updateMovesCounter: (props: {
			movesNumber: number
			movesLimit: number
		}) => void
		updateScoreCounter: (props: { score: number; goalScore: number }) => void
		openWinModal: () => void
		openLossModal: () => void
		getContainerSize: () => {
			width: number
			height: number
		}
		updateBoosterBombCounter: (currentValue: number) => void
		updateBoosterTeleportCounter: (currentValue: number) => void
		onBoosterBombActiveChange: (isActive: boolean) => void
		onBoosterTeleportActiveChange: (isActive: boolean) => void
	}) {
		this.renderer = renderer
		this.setGameContainerSize = setGameContainerSize
		this.openWinModal = openWinModal
		this.openLossModal = openLossModal

		this.grid = new Grid({ getContainerSize })
		this.field = new Field({
			getFieldSnapshot: this.grid.getSnapshot.bind(this.grid),
		})
		this.scoreProgress = new Progress({
			updateCounter: ({ currentValue, targetValue }) =>
				updateScoreCounter({
					score: currentValue,
					goalScore: targetValue,
				}),
		})
		this.movesProgress = new Progress({
			updateCounter: ({ currentValue, targetValue }) =>
				updateMovesCounter({
					movesNumber: currentValue,
					movesLimit: targetValue,
				}),
		})
		this.boosterBombs = new Booster({
			updateCounter: updateBoosterBombCounter,
			onActiveChange: onBoosterBombActiveChange,
		})
		this.boosterTeleport = new Booster({
			updateCounter: updateBoosterTeleportCounter,
			onActiveChange: onBoosterTeleportActiveChange,
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
		this.boosterBombs.clear()
		this.boosterTeleport.clear()
		this.isGameEnded = false
	}

	onResize() {
		this.setGameContainerSize(null)
		const snapshot = this.grid.updateGridSizes()
		this.setGameContainerSize({
			width: snapshot.gridWidth,
			height: snapshot.gridHeight,
		})
		const tilesSnapshots = this.field.getTilesSnapshots()
		this.renderer.resize(tilesSnapshots, snapshot)
	}

	// #region Level creation

	async startNewLevel() {
		loadingScreen.show()
		await this.clearLevel()
		this.generateLevelData()
		this.createLevel()
		loadingScreen.hide()
	}

	async restartLevel() {
		loadingScreen.show()
		await this.clearLevel()
		this.createLevel()
		loadingScreen.hide()
	}

	private generateLevelData() {
		this.columns = DEFAULT_COLUMNS
		this.rows = DEFAULT_ROWS

		const goalScore = getRandomNumber({
			min: MIN_GOAL_SCORE,
			max: MAX_GOAL_SCORE,
			step: 100,
		})
		this.scoreProgress.setTargetValue(goalScore)

		const movesLimit = this.estimateMoves(goalScore)
		this.movesProgress.setTargetValue(movesLimit)
	}

	private createLevel() {
		this.boosterBombs.setCurrentValue(BOOSTER_BOMBS_COUNT)
		this.boosterTeleport.setCurrentValue(BOOSTER_TELEPORT_COUNT)
		this.boosterBombs.renderCounter()
		this.boosterTeleport.renderCounter()
		this.setGameContainerSize(null)
		this.grid.createGrid(this.columns, this.rows)
		this.field.generateTiles()
		const gridSnapshot = this.grid.getSnapshot()
		this.setGameContainerSize({
			width: gridSnapshot.gridWidth,
			height: gridSnapshot.gridHeight,
		})
		this.renderer.renderTiles({
			tilesSnapshots: this.field.getTilesSnapshots(),
			gridSnapshot: gridSnapshot,
		})
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

		if (this.boosterBombs.isActivated()) {
			this.useBoosterBomb(tile)
			return
		}

		if (this.boosterTeleport.isActivated()) {
			this.useBoosterTeleport(tile)
			return
		}

		const kind = tile.getKind()
		const { removedTiles, removedPositions } = isTileKindSpecial(kind)
			? await this.specialTileHandler[kind](tile)
			: await this.onNormalTileClick(tile)

		await this.processRemovingTiles({ removedTiles, removedPositions })
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
			TILE_BOMB_RADIUS
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

	async processRemovingTiles({
		removedTiles,
		removedPositions,
	}: {
		removedTiles: Set<Tile>
		removedPositions: Set<TilePosition>
	}) {
		if (removedTiles.size === 0) {
			return
		}

		const points = this.getPoints(removedTiles.size)
		this.scoreProgress.addCurrentValue(points)
		this.movesProgress.addCurrentValue()

		await this.fillEmptyPositions(removedPositions)

		await this.checkGameEnd()
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

	onBoosterBombsButtonClick() {
		this.boosterBombs.tryActivate()
	}

	onBoosterTeleportButtonClick() {
		this.boosterTeleport.tryActivate()
	}

	private async useBoosterBomb(tile: Tile) {
		const { tiles, positions } = this.field.getTilesInRadius(
			tile.getPosition(),
			BOOSTER_BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return
		}

		this.boosterBombs.use()

		await this.removeTilesFromCenter(tiles, tile.getPosition())
		await this.processRemovingTiles({
			removedTiles: tiles,
			removedPositions: positions,
		})
	}

	private useBoosterTeleport(tile: Tile) {
		if (this.selectedTile === null) {
			this.selectedTile = tile
			return
		}

		this.field.swapTiles(this.selectedTile, tile)
		this.renderer.swapTiles({
			tilesSnapshots: [this.selectedTile.getSnapshot(), tile.getSnapshot()],
			gridSnapshot: this.grid.getSnapshot(),
		})
		this.boosterTeleport.use()
		this.selectedTile = null
	}

	// #endregion

	// #region Game End

	private async checkGameEnd() {
		if (this.isGameEnded) {
			return
		}

		if (this.scoreProgress.isTargetReached()) {
			this.win()
		} else if (this.movesProgress.isTargetReached()) {
			this.lose()
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
			await this.shuffleField()
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
