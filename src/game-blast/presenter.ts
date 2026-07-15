import { Field } from "./field"
import { Grid } from "./grid"
import { Renderer } from "./rendering/renderer"
import { Tile, TileKind, TilePosition, TileSnapshot } from "./tile"
import { wait } from "../helpers/time"
import { TILE_DELAY_BETWEEN_REMOVALS_MS } from "./config"
import { AnimationsManager } from "../helpers/animationManager"

type PresenterProps = {
	field: Field
	grid: Grid
	renderer: Renderer
	animationsManager: AnimationsManager
	setGameContainerSize: (
		sizes: {
			width: number
			height: number
		} | null
	) => void
}

export class Presenter {
	private readonly field: PresenterProps["field"]
	private readonly grid: PresenterProps["grid"]
	private readonly renderer: PresenterProps["renderer"]
	private readonly animationsManager: PresenterProps["animationsManager"]
	private readonly setGameContainerSize: PresenterProps["setGameContainerSize"]

	constructor(props: PresenterProps) {
		this.field = props.field
		this.grid = props.grid
		this.renderer = props.renderer
		this.animationsManager = props.animationsManager
		this.setGameContainerSize = props.setGameContainerSize
	}

	async init(onTileClick: (id: string) => void) {
		this.renderer.setOnTileClick(onTileClick)
		await this.renderer.init()
	}

	destroy() {
		this.renderer.destroy()
	}

	async clear() {
		await this.renderer.clearTiles()
		this.field.clearTiles()
		this.animationsManager.clear()
	}

	create({ columns, rows }: { columns: number; rows: number }) {
		this.setGameContainerSize(null)
		this.grid.createGrid({ columns, rows })
		this.field.generateTiles()
		const gridSnapshot = this.grid.getSnapshot()
		this.setGameContainerSize({
			width: gridSnapshot.gridWidth,
			height: gridSnapshot.gridHeight,
		})
		this.renderer.updateFieldOffsets()
		this.renderer.renderTiles({
			tilesSnapshots: this.field.getTilesSnapshots(),
			gridSnapshot: gridSnapshot,
		})
	}

	updateGameSize() {
		this.setGameContainerSize(null)
		const gridSnapshot = this.grid.updateGridSizes()
		this.setGameContainerSize({
			width: gridSnapshot.gridWidth,
			height: gridSnapshot.gridHeight,
		})
		const tilesSnapshots = this.field.getTilesSnapshots()
		this.renderer.resize({ tilesSnapshots, gridSnapshot })
	}

	async animateAndWaitForAll(promise: Promise<void>) {
		this.animationsManager.animate(promise)
		await this.animationsManager.waitAllAnimations()
	}

	// #region Tiles Manipulation

	selectTile(tile: Tile) {
		this.renderer.selectTile({
			tileSnapshot: tile.getSnapshot(),
			gridSnapshot: this.grid.getSnapshot(),
		})
	}

	addTile({ kind, position }: { kind: TileKind; position: TilePosition }) {
		return this.field.addTile({ kind, position })
	}

	renderTile(tile: Tile) {
		return this.renderer.renderTiles({
			tilesSnapshots: [tile.getSnapshot()],
			gridSnapshot: this.grid.getSnapshot(),
		})
	}

	async removeTiles(tiles: Set<Tile>): Promise<void> {
		const ids = new Set<string>()
		for (const tile of tiles) {
			const removedTileId = tile.getId()
			tile.setIsBlocked(true)
			this.field.removeTile(tile.getPosition())
			ids.add(removedTileId)
		}

		ids.forEach((id) => {
			this.renderer.removeTile(id)
		})

		await wait(TILE_DELAY_BETWEEN_REMOVALS_MS)
	}

	async removeTilesFromCenter(
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

		for (const [_, tiles] of sortedGroupedTiles) {
			await this.removeTiles(tiles)
		}
	}

	swapTiles(tile1: Tile, tile2: Tile) {
		this.field.swapTiles(tile1, tile2)

		const promiseSelection = this.renderer
			.selectTile({
				tileSnapshot: tile2.getSnapshot(),
				gridSnapshot: this.grid.getSnapshot(),
			})
			.then(() => {
				return this.renderer.swapTiles({
					tilesSnapshots: [tile1.getSnapshot(), tile2.getSnapshot()],
					gridSnapshot: this.grid.getSnapshot(),
				})
			})
			.then(() => {
				return Promise.all([
					this.renderer.unselectTile({
						tileSnapshot: tile1.getSnapshot(),
						gridSnapshot: this.grid.getSnapshot(),
					}),
					this.renderer.unselectTile({
						tileSnapshot: tile2.getSnapshot(),
						gridSnapshot: this.grid.getSnapshot(),
					}),
				])
			})
			.then(() => {})

		this.animationsManager.animate(promiseSelection)
	}

	// #endregion

	// #region Field Manipulation

	async fillEmptyPositions(positions: Set<TilePosition>) {
		const { movedTiles, newTiles } = this.field.fillEmptyPositions(positions)

		const temporaryBlockedTiles = new Set<Tile>()

		for (const movedTile of movedTiles) {
			temporaryBlockedTiles.add(movedTile)
			movedTile.setIsBlocked(true)
		}
		for (const newTile of newTiles) {
			temporaryBlockedTiles.add(newTile)
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

		try {
			await this.renderer.fallTilesToCurrentPositions({
				tilesSnapshots: Array.from(movedTiles).map((tile_1) =>
					tile_1.getSnapshot()
				),
				gridSnapshot,
			})
			await Promise.all(renderTasks)
		} finally {
			for (const blockedTile of temporaryBlockedTiles) {
				blockedTile.setIsBlocked(false)
			}
		}
	}

	shuffleField() {
		this.field.shuffle()
		const tiles = this.field.getTiles()
		const shuffleFieldPromise = this.renderer.shuffleTiles({
			tilesSnapshots: Array.from(tiles).map((tile) => tile.getSnapshot()),
			gridSnapshot: this.grid.getSnapshot(),
		})
		return this.animationsManager.animate(shuffleFieldPromise)
	}

	// #endregion

	// #region Getters

	getPositions() {
		return this.field.getPositions()
	}

	getTiles() {
		return this.field.getTiles()
	}

	getTilesInRadius(position: TilePosition, radius: number) {
		return this.field.getTilesInRadius(position, radius)
	}

	getTilesInRow(row: number) {
		return this.field.getTilesInRow(row)
	}

	getTilesInColumn(column: number) {
		return this.field.getTilesInColumn(column)
	}

	getTileById(id: string) {
		return this.field.getTileById(id)
	}

	getSameKindNeighbourTiles(tile: Tile) {
		const position = tile.getPosition()
		const kind = tile.getKind()

		const tilesToRemove = new Set<Tile>([tile])
		const stringifiedPositionsToRemove = new Set<string>()
		const positionsToRemove = new Set<TilePosition>([position])

		for (const tileToRemove of tilesToRemove) {
			const neighborPositions = this.grid.getNeighbourPositions(
				tileToRemove.getPosition()
			)
			for (const neighborPosition of neighborPositions) {
				const stringifiedPosition = JSON.stringify(neighborPosition)
				if (stringifiedPositionsToRemove.has(stringifiedPosition)) {
					continue
				}

				const neighborTile = this.field.getTile(neighborPosition)
				if (
					neighborTile !== undefined &&
					neighborTile.getKind() === kind &&
					!neighborTile.getIsBlocked()
				) {
					tilesToRemove.add(neighborTile)
					stringifiedPositionsToRemove.add(stringifiedPosition)
					positionsToRemove.add(neighborPosition)
				}
			}
		}

		return { tilesToRemove, positionsToRemove }
	}

	// #endregion
}
