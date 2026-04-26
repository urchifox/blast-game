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
import { Renderer, TileInfoForRender } from "./rendering/renderer"
import { Tile, TilePosition } from "./tile"

export class GameBlast {
	private readonly container: HTMLElement
	private readonly renderer: Renderer
	private readonly grid: Grid
	private readonly field: Field
	private readonly toggleContainerFullSizeMode: (isFullSize: boolean) => void
	private readonly handleWindowResize = this.onResize.bind(this)
	private readonly blockedTileIds = new Set<string>()

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

	constructor({
		container,
		renderer,
		toggleContainerFullSizeMode,
		updateMovesCounter,
		updateScoreCounter,
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
	}) {
		this.container = container
		this.renderer = renderer
		this.toggleContainerFullSizeMode = toggleContainerFullSizeMode
		this.updateMovesCounter = updateMovesCounter
		this.updateScoreCounter = updateScoreCounter

		const getContainerSize = () =>
			getElementInnerSize({ element: this.container })
		this.grid = new Grid({
			getContainerSize,
		})

		const getFieldSnapshot = this.grid.getSnapshot.bind(this.grid)

		this.field = new Field({ getFieldSnapshot })

		window.addEventListener("resize", this.handleWindowResize)
	}

	async init() {
		this.renderer.setOnTileClick(this.onTileClick.bind(this))
		await this.renderer.init()
		this.generateLevel()
	}

	destroy() {
		window.removeEventListener("resize", this.handleWindowResize)
		this.renderer.destroy()
	}

	private onResize() {
		this.toggleContainerFullSizeMode(true)
		const snapshot = this.grid.updateGridSizes()
		this.toggleContainerFullSizeMode(false)
		const tilesInfo = this.field.getTilesInfo()
		this.renderer.resize(tilesInfo, snapshot)
	}

	generateLevel() {
		const columns = DEFAULT_COLUMNS
		const rows = DEFAULT_ROWS

		this.goalScore = getRandomNumber({
			min: MIN_GOAL_SCORE,
			max: MAX_GOAL_SCORE,
			step: 100,
		})
		this.updateScoreCounter({
			score: this.score,
			goalScore: this.goalScore,
		})

		this.movesLimit = this.estimateMoves(this.goalScore)
		this.updateMovesCounter({
			movesNumber: this.movesNumber,
			movesLimit: this.movesLimit,
		})

		this.toggleContainerFullSizeMode(true)
		this.grid.createGrid(columns, rows)
		this.field.generateTiles()
		this.renderer.renderTiles({
			tilesInfo: this.field.getTilesInfo(),
			gridSnapshot: this.grid.getSnapshot(),
		})
		this.toggleContainerFullSizeMode(false)
	}

	estimateMoves(targetScore: number): number {
		if (targetScore <= 0) {
			return 0
		}

		const avgCombo = getRandomNumber({ min: MIN_AVG_COMBO, max: MAX_AVG_COMBO })
		const avgScorePerMove = BASE_SCORE * Math.pow(avgCombo, GROWTH_EXPONENT)

		const moves = targetScore / avgScorePerMove

		return Math.ceil(moves)
	}

	clearLevel() {
		this.field.clearTiles()
		this.renderer.clearTiles()
		this.movesNumber = 0
		this.score = 0
	}

	async onTileClick(id: string) {
		if (this.blockedTileIds.has(id)) {
			return
		}

		const tile = this.field.getTileById(id)
		if (tile === undefined) {
			return
		}

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

		if (tilesToRemove.size === 1) {
			return
		}

		const temporaryblockedTilesIds = new Set<string>()

		for (const tile of tilesToRemove) {
			const removedTileId = tile.getId()
			this.blockedTileIds.add(removedTileId)
			this.field.removeTile(tile.getPosition())
			this.renderer.removeTile(removedTileId)
		}

		this.updateScore(tilesToRemove.size)
		this.updateMoves()

		const gridSnapshot = this.grid.getSnapshot()
		const { movedTiles, newTiles } =
			this.field.fillEmptyPositions(positionsToRemove)

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

		await this.renderer.moveTiles({
			tilesInfo: Array.from(movedTiles).map((tile) => tile.getInfoForRender()),
			gridSnapshot,
		})

		const newTilesInfoByColumns = new Map<number, Array<TileInfoForRender>>()
		for (const tile of newTiles) {
			const column = tile.getPosition().column
			const tilesInfo = newTilesInfoByColumns.get(column) || []
			tilesInfo.push(tile.getInfoForRender())
			newTilesInfoByColumns.set(column, tilesInfo)
		}

		const renderTasks: Array<Promise<void>> = []
		for (const [_, tilesInfo] of newTilesInfoByColumns) {
			tilesInfo.sort((a, b) => b.row - a.row)

			renderTasks.push(
				this.renderer.renderTiles({
					tilesInfo,
					gridSnapshot,
					isAppearOnDefaultPosition: true,
				})
			)
		}

		await Promise.all(renderTasks)
		for (const blockedTileId of temporaryblockedTilesIds) {
			this.blockedTileIds.delete(blockedTileId)
		}

		this.checkGameEnd()
	}

	private updateMoves() {
		this.movesNumber++
		this.updateMovesCounter({
			movesNumber: this.movesNumber,
			movesLimit: this.movesLimit,
		})
	}

	/** Uses power scale formula */
	private updateScore(tilesToRemove: number) {
		const points = Math.round(
			BASE_SCORE * Math.pow(tilesToRemove, GROWTH_EXPONENT)
		)
		this.score += points
		this.updateScoreCounter({
			score: this.score,
			goalScore: this.goalScore,
		})
	}

	private checkGameEnd() {
		if (this.score >= this.goalScore) {
			this.win()
		} else if (this.movesNumber >= this.movesLimit) {
			this.lose()
		}
	}

	private win() {
		alert("You win!")
		this.clearLevel()
		this.generateLevel()
	}

	private lose() {
		alert("You lose!")
		this.clearLevel()
		this.generateLevel()
	}
}
