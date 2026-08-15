import { Field } from "./field"
import { Tile, TilePosition, TileSnapshot } from "./tile"
import { Grid } from "./grid"
import { TilesCollector } from "./tilesCollector"

type FieldQueriesProps = {
	field: Field
	grid: Grid
}

export class FieldQueries {
	private readonly field: FieldQueriesProps["field"]
	private readonly grid: FieldQueriesProps["grid"]

	constructor(props: FieldQueriesProps) {
		this.field = props.field
		this.grid = props.grid
	}

	getTiles(): Array<Tile> {
		return this.field.getTiles()
	}

	getPositions(tiles?: Array<Tile>): Array<TilePosition> {
		return this.field.getPositions(tiles)
	}

	getTilesSnapshots(): Array<TileSnapshot> {
		return this.getTiles().map((tile) => tile.getSnapshot())
	}

	getTileByPosition({ column, row }: TilePosition) {
		return this.getTiles().find(
			(tile) =>
				tile.getPosition().column === column && tile.getPosition().row === row
		)
	}

	getTileById(id: string) {
		return this.getTiles().find((tile) => tile?.getId() === id)
	}

	getTilesInRadius(position: TilePosition, radius: number) {
		const { columns, rows } = this.grid.getSnapshot()
		const { column: centerColumn, row: centerRow } = position
		const minColumn = Math.max(0, centerColumn - radius)
		const maxColumn = Math.min(columns - 1, centerColumn + radius)
		const minRow = Math.max(0, centerRow - radius)
		const maxRow = Math.min(rows - 1, centerRow + radius)

		const collector = new TilesCollector()

		for (let column = minColumn; column <= maxColumn; column++) {
			for (let row = minRow; row <= maxRow; row++) {
				const tile = this.getTileByPosition({ column, row })
				if (tile === undefined) {
					continue
				}
				collector.collect(tile)
			}
		}

		return collector.getCollection()
	}

	getTilesInRow(row: number) {
		const collector = new TilesCollector()

		for (const tile of this.getTiles()) {
			if (tile === undefined || tile.getPosition().row !== row) {
				continue
			}
			collector.collect(tile)
		}

		return collector.getCollection()
	}

	getTilesInColumn(column: number) {
		const collector = new TilesCollector()

		for (const tile of this.getTiles()) {
			if (tile === undefined || tile.getPosition().column !== column) {
				continue
			}
			collector.collect(tile)
		}

		return collector.getCollection()
	}

	getSameKindNeighbourTiles(tile: Tile) {
		const kind = tile.getKind()

		const collector = new TilesCollector()
		collector.collect(tile)

		for (const tileToRemove of collector.getCollection().tiles) {
			const neighborPositions = this.grid.getNeighbourPositions(
				tileToRemove.getPosition()
			)
			for (const neighborPosition of neighborPositions) {
				if (collector.isCollected(neighborPosition)) {
					continue
				}

				const neighborTile = this.getTileByPosition(neighborPosition)
				if (
					neighborTile !== undefined &&
					neighborTile.getKind() === kind &&
					!neighborTile.isBlocked
				) {
					collector.collect(neighborTile)
				}
			}
		}

		return collector.getCollection()
	}

	getSortedGroupedTiles(tiles: Set<Tile>, centerPosition: TilePosition) {
		const { column: centerColumn, row: centerRow } = centerPosition

		const groupedTiles = new Map<number, Set<Tile>>()

		for (const tile of tiles) {
			const distance = Math.max(
				Math.abs(tile.getPosition().column - centerColumn),
				Math.abs(tile.getPosition().row - centerRow)
			)
			const tiles = groupedTiles.get(distance) ?? new Set<Tile>()
			tiles.add(tile)
			groupedTiles.set(distance, tiles)
		}

		const sortedGroupedTiles = Array.from(groupedTiles.entries()).sort(
			(a, b) => a[0] - b[0]
		)

		return sortedGroupedTiles
	}
}
