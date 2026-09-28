import { Field } from "./field"
import { FieldQueries } from "./fieldQueries"
import { Grid } from "./grid"
import { TileProps } from "./tile"

export function createField({
	columns,
	rows,
	tilesProps,
}: {
	columns: number
	rows: number
	tilesProps: Set<TileProps>
}) {
	const grid = new Grid()
	grid.createGrid({ columns, rows })
	const getGridSnapshot = grid.getSnapshot.bind(grid)

	let nextId = 1
	const createId = () => String(nextId++)
	const randomizationFunction = () => 0
	const field = new Field({
		getGridSnapshot,
		randomizationFunction,
		createId,
	})
	field.createInitialTiles(tilesProps)

	const fieldQueries = new FieldQueries({ field, grid })

	return { grid, field, fieldQueries }
}
