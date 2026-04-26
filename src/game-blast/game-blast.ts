import { getElementInnerSize } from "../helpers/dom"
import { DEFAULT_COLUMNS, DEFAULT_ROWS } from "./config"
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

	constructor({
		container,
		renderer,
		toggleContainerFullSizeMode,
	}: {
		container: HTMLElement
		renderer: Renderer
		toggleContainerFullSizeMode: (isFullSize: boolean) => void
	}) {
		this.container = container
		this.renderer = renderer
		this.toggleContainerFullSizeMode = toggleContainerFullSizeMode

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

		this.toggleContainerFullSizeMode(true)
		this.grid.createGrid(columns, rows)
		this.field.generateTiles()
		this.renderer.renderTiles({
			tilesInfo: this.field.getTilesInfo(),
			gridSnapshot: this.grid.getSnapshot(),
		})
		this.toggleContainerFullSizeMode(false)
	}

	clearLevel() {
		this.field.clearTiles()
		this.renderer.clearTiles()
	}

	onTileClick(id: string) {
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
				if (neighborTile !== undefined && neighborTile.getKind() === kind) {
					tilesToRemove.add(neighborTile)
					positionsToRemove.add(neighborPosition)
				}
			}
		}

		if (tilesToRemove.size === 1) {
			return
		}

		for (const tile of tilesToRemove) {
			this.field.removeTile(tile.getPosition())
			this.renderer.removeTile(tile.getId())
		}

		const gridSnapshot = this.grid.getSnapshot()
		const { movedTiles, newTiles } =
			this.field.fillEmptyPositions(positionsToRemove)
		this.renderer.moveTiles({
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

		for (const [_, tilesInfo] of newTilesInfoByColumns) {
			tilesInfo.sort((a, b) => b.row - a.row)

			this.renderer.renderTiles({
				tilesInfo,
				gridSnapshot,
				isAppearOnDefaultPosition: true,
			})
		}
	}
}
