import { Field } from "../domain/field"
import { Grid } from "../domain/grid"
import { Tile, TileKind, TilePosition, TileSnapshot } from "../domain/tile"
import { wait } from "../../helpers/time"
import { TILE_DELAY_BETWEEN_REMOVALS_MS } from "./animationRules"
import { AnimationsManager } from "../../helpers/animationManager"
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
			tilesSnapshots: this.field.getTilesSnapshots(),
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
		const tilesSnapshots = this.field.getTilesSnapshots()
		this.renderer.resize({
			tilesSnapshots,
			gridSnapshot,
			layoutSnapshot,
		})
	}

	async animateAndWaitForAll(promise: Promise<void>) {
		this.animationsManager.animate(promise)
		await this.animationsManager.waitAllAnimations()
	}

	// #region Tiles Manipulation

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
			tile.isBlocked = true
			this.field.removeTile(tile.getPosition())
		}

		const sortedGroupedTiles = this.fieldQueries.getSortedGroupedTiles(
			tiles,
			centerPosition
		)

		for (const [_, tiles] of sortedGroupedTiles) {
			tiles.forEach((tile) => this.renderer.removeTile(tile.getId()))
			await wait(TILE_DELAY_BETWEEN_REMOVALS_MS)
		}
	}

	async swapTiles(tile1: Tile, tile2: Tile) {
		this.field.swapTiles(tile1, tile2)

		const gridSnapshot = this.grid.getSnapshot()
		const layoutSnapshot = this.layoutUI.getSnapshot()

		const promiseSelection = this.renderer
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
				return Promise.all([
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

		await this.animationsManager.animate(promiseSelection)
	}

	// #endregion

	// #region Field Manipulation

	async fillEmptyPositions(positions: Set<TilePosition>) {
		const { movedTiles, newTiles } = this.field.fillEmptyPositions(positions)

		const temporaryBlockedTiles = new Set<Tile>()

		for (const movedTile of movedTiles) {
			temporaryBlockedTiles.add(movedTile)
			movedTile.isBlocked = true
		}
		for (const newTile of newTiles) {
			temporaryBlockedTiles.add(newTile)
			newTile.isBlocked = true
		}

		const gridSnapshot = this.grid.getSnapshot()
		const layoutSnapshot = this.layoutUI.getSnapshot()

		const newTilesSnapshotsByColumns = new Map<number, Array<TileSnapshot>>()
		for (const tile of newTiles) {
			const column = tile.getPosition().column
			const tilesSnapshots = newTilesSnapshotsByColumns.get(column) ?? []
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
					layoutSnapshot,
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
				layoutSnapshot,
			})
			await Promise.all(renderTasks)
		} finally {
			for (const blockedTile of temporaryBlockedTiles) {
				blockedTile.isBlocked = false
			}
		}
	}

	shuffleField() {
		this.field.shuffle()
		const tiles = this.field.getTiles()
		const shuffleFieldPromise = this.renderer.shuffleTiles({
			tilesSnapshots: Array.from(tiles).map((tile) => tile.getSnapshot()),
			gridSnapshot: this.grid.getSnapshot(),
			layoutSnapshot: this.layoutUI.getSnapshot(),
		})
		return this.animationsManager.animate(shuffleFieldPromise)
	}

	// #endregion
}
