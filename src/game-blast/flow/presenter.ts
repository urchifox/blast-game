import { Field } from "../domain/field"
import { Grid } from "../domain/grid"
import { Tile, TileKind, TilePosition } from "../domain/tile"
import { wait } from "../../helpers/time"
import { TILE_DELAY_BETWEEN_REMOVALS_MS } from "./animationRules"
import { AnimationsManager } from "./animationManager"
import {
	LayoutUIContract,
	PresenterContract,
	RendererContract,
	OnTileClickCallback,
} from "../types"
import { FieldQueries } from "../domain/fieldQueries"

type PresenterProps = {
	layoutUI: LayoutUIContract
	field: Field
	fieldQueries: FieldQueries
	grid: Grid
	renderer: RendererContract
	animationsManager: AnimationsManager
}

export class Presenter implements PresenterContract {
	private readonly layoutUI: PresenterProps["layoutUI"]
	private readonly field: PresenterProps["field"]
	private readonly fieldQueries: PresenterProps["fieldQueries"]
	private readonly grid: PresenterProps["grid"]
	private readonly renderer: PresenterProps["renderer"]
	private readonly animationsManager: PresenterProps["animationsManager"]

	constructor(props: PresenterProps) {
		this.layoutUI = props.layoutUI
		this.field = props.field
		this.fieldQueries = props.fieldQueries
		this.grid = props.grid
		this.renderer = props.renderer
		this.animationsManager = props.animationsManager
	}

	async init(onTileClick: OnTileClickCallback) {
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
		this.layoutUI.setGameContainerSize(null)
		this.grid.createGrid({ columns, rows })
		this.field.generateTiles()
		const gridSnapshot = this.grid.getSnapshot()
		const layoutSnapshot = this.layoutUI.updateSizes(gridSnapshot)
		this.layoutUI.setGameContainerSize({
			width: layoutSnapshot.gridWidth,
			height: layoutSnapshot.gridHeight,
		})
		this.renderer.updateFieldOffsets()
		return this.renderer.renderTiles({
			tilesSnapshots: this.fieldQueries.getTilesSnapshots(),
			gridSnapshot,
			layoutSnapshot,
		})
	}

	updateGameSize() {
		this.layoutUI.setGameContainerSize(null)
		const gridSnapshot = this.grid.getSnapshot()
		const layoutSnapshot = this.layoutUI.updateSizes(gridSnapshot)
		this.layoutUI.setGameContainerSize({
			width: layoutSnapshot.gridWidth,
			height: layoutSnapshot.gridHeight,
		})
		const tilesSnapshots = this.fieldQueries.getTilesSnapshots()
		this.renderer.resize({
			tilesSnapshots,
			gridSnapshot,
			layoutSnapshot,
		})
	}

	// #region Tiles Manipulation

	waitForTileAnimations(tile: Tile) {
		return this.animationsManager.waitForTileAnimations(tile)
	}

	selectTile(tile: Tile) {
		this.renderer.selectTile({
			tileSnapshot: tile.getSnapshot(),
			layoutSnapshot: this.layoutUI.getSnapshot(),
		})
	}

	addTile({ kind, position }: { kind: TileKind; position: TilePosition }) {
		return this.field.addTile({ kind, position })
	}

	renderTile(tile: Tile) {
		return this.renderer.renderTiles({
			tilesSnapshots: [tile.getSnapshot()],
			gridSnapshot: this.grid.getSnapshot(),
			layoutSnapshot: this.layoutUI.getSnapshot(),
		})
	}

	async removeTilesFromCenter(
		tiles: Set<Tile>,
		centerPosition: TilePosition
	): Promise<void> {
		for (const tile of tiles) {
			tile.lock()
			this.field.removeTile(tile.getPosition())
		}

		const sortedGroupedTiles = this.fieldQueries.getSortedGroupedTiles(
			tiles,
			centerPosition
		)

		for (const [distance, tilesGroup] of sortedGroupedTiles) {
			tilesGroup.forEach((tile) => {
				const promise = async () => {
					await wait(distance * TILE_DELAY_BETWEEN_REMOVALS_MS)
					await this.renderer.removeTile(tile.getId())
				}

				this.animationsManager
					.setAnimation({
						tile,
						promise: promise(),
					})
					.finally(() => tile.unlock())
			})
		}

		await Promise.allSettled(
			Array.from(tiles).map((tile) => this.animationsManager.waitForTileAnimations(tile))
		)
	}

	async swapTiles(tile1: Tile, tile2: Tile) {
		tile1.lock()
		tile2.lock()
		this.field.swapTiles(tile1, tile2)

		const gridSnapshot = this.grid.getSnapshot()
		const layoutSnapshot = this.layoutUI.getSnapshot()

		const promiseAnimation = this.renderer
			.selectTile({
				tileSnapshot: tile2.getSnapshot(),
				layoutSnapshot,
			})
			.then(() => {
				return this.renderer.swapTiles({
					tilesSnapshots: [tile1.getSnapshot(), tile2.getSnapshot()],
					gridSnapshot,
					layoutSnapshot,
				})
			})
			.then(() => {
				return Promise.allSettled([
					this.renderer.unselectTile({
						tileSnapshot: tile1.getSnapshot(),
						gridSnapshot,
						layoutSnapshot,
					}),
					this.renderer.unselectTile({
						tileSnapshot: tile2.getSnapshot(),
						gridSnapshot,
						layoutSnapshot,
					}),
				])
			})
			.then(() => {})

		await Promise.allSettled(
			[tile1, tile2].map((tile) =>
				this.animationsManager
					.setAnimation({
						tile,
						promise: promiseAnimation,
					})
					.finally(() => tile.unlock())
			)
		)
	}

	// #endregion

	// #region Field Manipulation

	async processRemovedTiles(removedTiles: Set<Tile>) {
		const positions = new Set(
			[...removedTiles].map((tile) => tile.getPosition())
		)
		const { movedTiles, newTiles } = this.field.fillEmptyPositions(positions)

		for (const tile of [...movedTiles, ...newTiles]) {
			tile.lock()
		}

		const groupsByColumns = this.getGroupsByColumns({
			removedTiles,
			movedTiles,
			newTiles,
		})

		await Promise.allSettled(
			groupsByColumns.map((infoByColumn) =>
				this.animateFillingColumn(infoByColumn)
			)
		)
	}

	private getGroupsByColumns({
		removedTiles,
		movedTiles,
		newTiles,
	}: {
		removedTiles: Set<Tile>
		movedTiles: Set<Tile>
		newTiles: Set<Tile>
	}) {
		const removeTilesByColumn = this.groupByColumns(removedTiles)
		const movedTilesByColumn = this.groupByColumns(movedTiles)
		const newTilesByColumn = this.groupByColumns(newTiles)

		const infoByColumns = new Map<
			number,
			{
				removedTiles: Array<Tile>
				movedTiles: Array<Tile>
				newTiles: Array<Tile>
			}
		>()

		const columnsSet = new Set<number>([
			...removeTilesByColumn.keys(),
			...movedTilesByColumn.keys(),
			...newTilesByColumn.keys(),
		])
		for (const column of columnsSet) {
			const removedTiles = removeTilesByColumn.get(column) ?? []
			const movedTiles = movedTilesByColumn.get(column) ?? []
			const newTiles = newTilesByColumn.get(column) ?? []

			infoByColumns.set(column, {
				removedTiles,
				movedTiles,
				newTiles,
			})
		}

		return Array.from(infoByColumns.values())
	}

	private groupByColumns(tiles: Set<Tile>) {
		const tilesByColumn = new Map<number, Array<Tile>>()

		for (const tile of tiles) {
			const column = tile.getPosition().column

			const tiles = tilesByColumn.get(column) ?? []
			tiles.push(tile)
			tilesByColumn.set(column, tiles)
		}

		return tilesByColumn
	}

	private async animateFillingColumn({
		removedTiles,
		movedTiles,
		newTiles,
	}: {
		removedTiles: Array<Tile>
		movedTiles: Array<Tile>
		newTiles: Array<Tile>
	}) {
		await Promise.allSettled(
			removedTiles.map((tile) =>
				this.animationsManager.waitForTileAnimations(tile)
			)
		)

		const fallAnimationPromise = this.renderer.fallTilesToCurrentPositions({
			tilesSnapshots: this.getSnapshotsSortedByRow(movedTiles),
			gridSnapshot: this.grid.getSnapshot(),
			layoutSnapshot: this.layoutUI.getSnapshot(),
		})
		await Promise.allSettled(
			movedTiles.map((tile) =>
				this.animationsManager
					.setAnimation({
						tile,
						promise: fallAnimationPromise,
					})
					.finally(() => tile.unlock())
			)
		)

		const renderAnimationPromise = this.renderer.renderTiles({
			tilesSnapshots: this.getSnapshotsSortedByRow(newTiles),
			gridSnapshot: this.grid.getSnapshot(),
			layoutSnapshot: this.layoutUI.getSnapshot(),
			isAppearOnDefaultPosition: true,
		})
		await Promise.allSettled(
			newTiles.map((tile) =>
				this.animationsManager
					.setAnimation({
						tile,
						promise: renderAnimationPromise,
					})
					.finally(() => tile.unlock())
			)
		)
	}

	private getSnapshotsSortedByRow(tiles: Array<Tile>) {
		return tiles
			.map((tile) => tile.getSnapshot())
			.slice()
			.sort((a, b) => b.row - a.row)
	}

	async shuffleField() {
		this.field.shuffle()
		const tiles = Array.from(this.field.getTiles())
		for (const tile of tiles) {
			tile.lock()
		}
		const shuffleFieldPromise = this.renderer.shuffleTiles({
			tilesSnapshots: tiles.map((tile) => tile.getSnapshot()),
			gridSnapshot: this.grid.getSnapshot(),
			layoutSnapshot: this.layoutUI.getSnapshot(),
		})

		await Promise.allSettled(
			tiles.map((tile) =>
				this.animationsManager
					.setAnimation({
						tile,
						promise: shuffleFieldPromise,
					})
					.finally(() => tile.unlock())
			)
		)
	}

	// #endregion
}
