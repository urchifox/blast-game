import { Field } from "./field"
import { FieldQueries } from "./fieldQueries"
import { Grid } from "./grid"
import { TileProps } from "./tile"

export function createField({
	columns,
	rows,
	tilesProps,
	randomizationFunction,
}: {
	columns: number
	rows: number
	tilesProps: Set<TileProps>
	randomizationFunction?: () => number
}) {
	const grid = new Grid()
	grid.createGrid({ columns, rows })
	const getGridSnapshot = grid.getSnapshot.bind(grid)

	let nextId = 1
	const createId = () => String(nextId++)
	const field = new Field({
		getGridSnapshot,
		randomizationFunction: randomizationFunction || (() => 0),
		createId,
	})
	field.createInitialTiles(tilesProps)

	const fieldQueries = new FieldQueries({ field, grid })

	return { grid, field, fieldQueries }
}
