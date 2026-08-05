import { Field } from "./field"
import { Tile, TilePosition } from "./tile"
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

				const neighborTile = this.field.getTile(neighborPosition)
				if (
					neighborTile !== undefined &&
					neighborTile.getKind() === kind &&
					!neighborTile.getIsBlocked()
				) {
					collector.collect(neighborTile)
				}
			}
		}

		return collector.getCollection()
	}
}
