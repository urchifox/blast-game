import { Field } from "./field"
import { TilePosition } from "./tile"

type FieldQueriesProps = {
	field: Field
}

export class FieldQueries {
	private readonly field: FieldQueriesProps["field"]

	constructor(props: FieldQueriesProps) {
		this.field = props.field
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
}
