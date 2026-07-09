import { Field } from "./field"
import { Grid } from "./grid"
import { Renderer } from "./rendering/renderer"
import { Tile, TileKind, TilePosition, TileSnapshot } from "./tile"
import { wait } from "../helpers/time"
import { TILE_DELAY_BETWEEN_REMOVALS_MS } from "./config"
import { AnimationsManager } from "../helpers/animationManager"

type FieldManipulatorProps = {
	renderer: Renderer
	animationsManager: AnimationsManager
	getGameContainerSize: () => {
		width: number
		height: number
	}
	setGameContainerSize: (
		sizes: {
			width: number
			height: number
		} | null
	) => void
}

export class FieldManipulator {
	private readonly renderer: FieldManipulatorProps["renderer"]
	private readonly animationsManager: FieldManipulatorProps["animationsManager"]
	private readonly setGameContainerSize: FieldManipulatorProps["setGameContainerSize"]

	private readonly field: Field
	private readonly grid: Grid

	constructor(props: FieldManipulatorProps) {
		this.renderer = props.renderer
		this.animationsManager = props.animationsManager
		this.setGameContainerSize = props.setGameContainerSize

		this.grid = new Grid({
			getContainerSize: props.getGameContainerSize,
		})
		this.field = new Field({
			getFieldSnapshot: this.grid.getSnapshot.bind(this.grid),
		})
	}

	selectTile(tile: Tile) {
		this.renderer.selectTile({
			tileSnapshot: tile.getSnapshot(),
			gridSnapshot: this.grid.getSnapshot(),
		})
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

	getSameKindNeighbourTiles(tile: Tile) {
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

	removeTiles(tiles: Set<Tile>): Promise<void> {
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

	removeTilesFromCenter(
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

	fillEmptyPositions(positions: Set<TilePosition>) {
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

		return this.renderer
			.fallTilesToCurrentPositions({
				tilesSnapshots: Array.from(movedTiles).map((tile) =>
					tile.getSnapshot()
				),
				gridSnapshot,
			})
			.then(() => {
				return Promise.all(renderTasks)
			})
			.then(() => {
				for (const blockedTile of temporaryBlockedTiles) {
					blockedTile.setIsBlocked(false)
				}
			})
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

	async clear() {
		await this.renderer.clearTiles()
		this.field.clearTiles()
		this.animationsManager.clear()
	}

	renderTile(tile: Tile) {
		return this.renderer.renderTiles({
			tilesSnapshots: [tile.getSnapshot()],
			gridSnapshot: this.grid.getSnapshot(),
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

	addTile({ kind, position }: { kind: TileKind; position: TilePosition }) {
		return this.field.addTile({ kind, position })
	}
}
