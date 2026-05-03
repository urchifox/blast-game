import { getRandomNumber, pickRandomItem } from "../helpers/random"
import { wait } from "../helpers/time"
import { Booster, BoosterName } from "./booster"
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
import { Progress } from "../helpers/progress"
import { Renderer } from "./rendering/renderer"
import {
	isTileKindSpecial,
	Tile,
	TileKindSpecial,
	TilePosition,
	TileSnapshot,
} from "./tile"

type TileClickHandler = (tile: Tile) => TileClickHandlerResult
type TileClickHandlerResult = {
	removedTiles: Set<Tile>
	removedPositions: Set<TilePosition>
	removingPromise: Promise<void>
} | null

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

	private readonly openWinModal: () => void
	private readonly openLossModal: () => void

	private isGameEnded = false

	private readonly boosterBomb: Booster
	private readonly boosterTeleport: Booster

	private selectedTile: Tile | null = null

	private boosterMap: Record<
		BoosterName,
		{ getBooster: () => Booster; useBooster: (tile: Tile) => void }
	> = {
		bomb: {
			getBooster: () => this.boosterBomb,
			useBooster: this.useBoosterBomb.bind(this),
		},
		teleport: {
			getBooster: () => this.boosterTeleport,
			useBooster: this.useBoosterTeleport.bind(this),
		},
	}

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

	private animationPromises = new Set<Promise<void>>()

	constructor({
		renderer,
		setGameContainerSize,
		updateMovesCounter,
		updateScoreCounter,
		openWinModal,
		openLossModal,
		getContainerSize,
		updateBoosterCounter,
		onBoosterActiveChange,
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
		updateBoosterCounter: (booster: BoosterName, currentValue: number) => void
		onBoosterActiveChange: (boosterName: BoosterName, isActive: boolean) => void
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
		this.boosterBomb = new Booster({
			name: "bomb",
			updateCounter: updateBoosterCounter,
			onActiveChange: onBoosterActiveChange,
		})
		this.boosterTeleport = new Booster({
			name: "teleport",
			updateCounter: updateBoosterCounter,
			onActiveChange: onBoosterActiveChange,
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
		this.boosterBomb.clear()
		this.boosterTeleport.clear()
		this.selectedTile = null
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
		this.boosterBomb.setCurrentValue(BOOSTER_BOMBS_COUNT)
		this.boosterTeleport.setCurrentValue(BOOSTER_TELEPORT_COUNT)
		this.boosterBomb.renderCounter()
		this.boosterTeleport.renderCounter()
		this.setGameContainerSize(null)
		this.grid.createGrid({ columns, rows })
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

	// #region Tile interaction

	private onTileClick(id: string) {
		if (this.isGameEnded) {
			return
		}

		const tile = this.field.getTileById(id)
		if (tile === undefined || tile.getIsBlocked()) {
			return
		}

		for (const boosterName of Object.keys(this.boosterMap)) {
			const boosterData = this.boosterMap[boosterName as BoosterName]
			const booster = boosterData.getBooster()
			if (booster.isActivated()) {
				boosterData.useBooster(tile)
				return
			}
		}

		const kind = tile.getKind()
		const result = isTileKindSpecial(kind)
			? this.specialTileHandler[kind](tile)
			: this.onNormalTileClick(tile)

		this.processRemovingTiles(result)
	}

	// #region Normal tile handlers

	private onNormalTileClick(tile: Tile): TileClickHandlerResult {
		const { tilesToRemove, positionsToRemove } =
			this.getSameKindNeighbourTiles(tile)
		if (tilesToRemove.size < MIN_COMBO_SIZE) {
			return null
		}

		const removeTilesPromise = this.removeTiles(tilesToRemove)
		const newTile = this.getComboPrize(tilesToRemove.size, tile.getPosition())

		return {
			removedTiles: tilesToRemove,
			removedPositions: positionsToRemove,
			removingPromise: removeTilesPromise.then(() => {
				if (newTile !== undefined) {
					return this.renderer.renderTiles({
						tilesSnapshots: [newTile.getSnapshot()],
						gridSnapshot: this.grid.getSnapshot(),
					})
				}
			}),
		}
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

	private getComboPrize(comboSize: number, position: TilePosition) {
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

		return newTile
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

	private onBombTileClick(tile: Tile): TileClickHandlerResult {
		const { tiles, positions } = this.field.getTilesInRadius(
			tile.getPosition(),
			TILE_BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return null
		}
		const removingPromise = this.removeTilesFromCenter(
			tiles,
			tile.getPosition()
		)
		return {
			removedTiles: tiles,
			removedPositions: positions,
			removingPromise: removingPromise,
		}
	}

	private onDynamiteTileClick(tile: Tile): TileClickHandlerResult {
		const tiles = new Set(this.field.getTiles())
		const positions = new Set(this.field.getPositions())
		if (tiles.size === 0) {
			return null
		}
		const removingPromise = this.removeTilesFromCenter(
			tiles,
			tile.getPosition()
		)
		return {
			removedTiles: tiles,
			removedPositions: positions,
			removingPromise: removingPromise,
		}
	}

	private onRocketColumnTileClick(tile: Tile): TileClickHandlerResult {
		const { tiles, positions } = this.field.getTilesInColumn(
			tile.getPosition().column
		)
		if (tiles.size === 0) {
			return null
		}
		const removingPromise = this.removeTilesFromCenter(
			tiles,
			tile.getPosition()
		)
		return {
			removedTiles: tiles,
			removedPositions: positions,
			removingPromise: removingPromise,
		}
	}

	private onRocketRowTileClick(tile: Tile): TileClickHandlerResult {
		const { tiles, positions } = this.field.getTilesInRow(
			tile.getPosition().row
		)
		if (tiles.size === 0) {
			return null
		}
		const removingPromise = this.removeTilesFromCenter(
			tiles,
			tile.getPosition()
		)
		return {
			removedTiles: tiles,
			removedPositions: positions,
			removingPromise: removingPromise,
		}
	}

	// #endregion

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

	processRemovingTiles(result: TileClickHandlerResult) {
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
		this.animate(animationPromise)

		this.checkGameEnd()
	}

	private fillEmptyPositions(positions: Set<TilePosition>) {
		const { movedTiles, newTiles } = this.field.fillEmptyPositions(positions)

		const temporaryblockedTiles = new Set<Tile>()

		for (const movedTile of movedTiles) {
			temporaryblockedTiles.add(movedTile)
			movedTile.setIsBlocked(true)
		}
		for (const newTile of newTiles) {
			temporaryblockedTiles.add(newTile)
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
			.fallTilesToCurrentPosituons({
				tilesSnapshots: Array.from(movedTiles).map((tile) =>
					tile.getSnapshot()
				),
				gridSnapshot,
			})
			.then(() => {
				return Promise.all(renderTasks)
			})
			.then(() => {
				for (const blockedTile of temporaryblockedTiles) {
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
		this.boosterMap[boosterName].getBooster().tryActivate()
	}

	private useBoosterBomb(tile: Tile) {
		const { tiles, positions } = this.field.getTilesInRadius(
			tile.getPosition(),
			BOOSTER_BOMB_RADIUS
		)
		if (tiles.size === 0) {
			return
		}

		this.boosterBomb.spend()
		const removingPromise = this.removeTilesFromCenter(
			tiles,
			tile.getPosition()
		)
		this.processRemovingTiles({
			removedTiles: tiles,
			removedPositions: positions,
			removingPromise: removingPromise,
		})
	}

	private useBoosterTeleport(tile: Tile) {
		if (this.selectedTile === null) {
			this.selectedTile = tile
			this.renderer.selectTile({
				tileSnapshot: tile.getSnapshot(),
				gridSnapshot: this.grid.getSnapshot(),
			})
			return
		}

		const selectedTile = this.selectedTile
		this.selectedTile = null
		this.boosterTeleport.spend()
		this.field.swapTiles(selectedTile, tile)

		const promiseSelection = this.renderer
			.selectTile({
				tileSnapshot: tile.getSnapshot(),
				gridSnapshot: this.grid.getSnapshot(),
			})
			.then(() => {
				return this.renderer.swapTiles({
					tilesSnapshots: [selectedTile.getSnapshot(), tile.getSnapshot()],
					gridSnapshot: this.grid.getSnapshot(),
				})
			})
			.then(() => {
				return Promise.all([
					this.renderer.unselectTile({
						tileSnapshot: selectedTile.getSnapshot(),
						gridSnapshot: this.grid.getSnapshot(),
					}),
					this.renderer.unselectTile({
						tileSnapshot: tile.getSnapshot(),
						gridSnapshot: this.grid.getSnapshot(),
					}),
				])
			})
			.then(() => {})

		this.animate(promiseSelection)
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
			await this.animate(shuffleFieldPromise)
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
		this.waitAllAnimations().then(() => this.openWinModal())
	}

	private lose() {
		if (this.isGameEnded) {
			return
		}

		this.isGameEnded = true
		this.waitAllAnimations().then(() => this.openLossModal())
	}

	// #endregion

	// #region Animation

	private async animate(promise: Promise<void>) {
		this.animationPromises.add(promise)
		try {
			await promise
		} finally {
			this.animationPromises.delete(promise)
		}
	}

	private async waitAllAnimations(): Promise<void> {
		await Promise.allSettled(Array.from(this.animationPromises))
	}

	// #endregion
}
