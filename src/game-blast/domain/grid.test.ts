import { Grid } from "./grid"

describe("grid creation", () => {
	it.each([
		{ columns: 5, rows: 10 },
		{ columns: 0, rows: 10 },
		{ columns: 10, rows: 0 },
	])("creates a grid with positive values", ({ columns, rows }) => {
		const grid = new Grid()
		grid.createGrid({ columns, rows })
		const snapshot = grid.getSnapshot()
		expect(snapshot.columns).toBe(columns)
		expect(snapshot.rows).toBe(rows)
	})

	it.each([
		{ columns: -5, rows: -10, expectedColumns: 0, expectedRows: 0 },
		{ columns: -1, rows: 10, expectedColumns: 0, expectedRows: 10 },
		{ columns: 10, rows: -1, expectedColumns: 10, expectedRows: 0 },
	])(
		"ignores negative values when creating a grid",
		({ columns, rows, expectedColumns, expectedRows }) => {
			const grid = new Grid()
			grid.createGrid({ columns, rows })
			const snapshot = grid.getSnapshot()
			expect(snapshot.columns).toBe(expectedColumns)
			expect(snapshot.rows).toBe(expectedRows)
		}
	)
})

describe("grid neighbour positions", () => {
	const grid = new Grid()
	grid.createGrid({ columns: 5, rows: 10 })

	it.each([
		{
			position: { row: 0, column: 0 },
			expectedPositions: [
				{ row: 1, column: 0 },
				{ row: 0, column: 1 },
			],
		},
		{
			position: { row: 0, column: 4 },
			expectedPositions: [
				{ row: 1, column: 4 },
				{ row: 0, column: 3 },
			],
		},
		{
			position: { row: 9, column: 0 },
			expectedPositions: [
				{ row: 8, column: 0 },
				{ row: 9, column: 1 },
			],
		},
		{
			position: { row: 9, column: 4 },
			expectedPositions: [
				{ row: 8, column: 4 },
				{ row: 9, column: 3 },
			],
		},
	])(
		"returns the neighbour positions for corner position $position",
		({ position, expectedPositions }) => {
			const neighbourPositions = grid.getNeighbourPositions(position)
			expect(new Set(neighbourPositions)).toEqual(new Set(expectedPositions))
		}
	)

	it.each([
		{
			position: { row: 0, column: 2 },
			expectedPositions: [
				{ row: 1, column: 2 },
				{ row: 0, column: 1 },
				{ row: 0, column: 3 },
			],
		},
		{
			position: { row: 9, column: 2 },
			expectedPositions: [
				{ row: 8, column: 2 },
				{ row: 9, column: 1 },
				{ row: 9, column: 3 },
			],
		},
		{
			position: { row: 4, column: 0 },
			expectedPositions: [
				{ row: 3, column: 0 },
				{ row: 5, column: 0 },
				{ row: 4, column: 1 },
			],
		},
		{
			position: { row: 4, column: 4 },
			expectedPositions: [
				{ row: 3, column: 4 },
				{ row: 5, column: 4 },
				{ row: 4, column: 3 },
			],
		},
	])(
		"returns the neighbour positions for side position $position",
		({ position, expectedPositions }) => {
			const neighbourPositions = grid.getNeighbourPositions(position)
			expect(new Set(neighbourPositions)).toEqual(new Set(expectedPositions))
		}
	)

	it.each([
		{
			position: { row: 2, column: 2 },
			expectedPositions: [
				{ row: 1, column: 2 },
				{ row: 3, column: 2 },
				{ row: 2, column: 1 },
				{ row: 2, column: 3 },
			],
		},
	])(
		"returns the neighbour positions for center position $position",
		({ position, expectedPositions }) => {
			const neighbourPositions = grid.getNeighbourPositions(position)
			expect(new Set(neighbourPositions)).toEqual(new Set(expectedPositions))
		}
	)

	it.each([
		{
			position: { row: -1, column: 0 },
			expectedPositions: [{ row: 0, column: 0 }],
		},
		{
			position: { row: 0, column: -1 },
			expectedPositions: [{ row: 0, column: 0 }],
		},
		{
			position: { row: -1, column: -1 },
			expectedPositions: [],
		},
		{
			position: { row: -2, column: 2 },
			expectedPositions: [],
		},
		{
			position: { row: 2, column: -2 },
			expectedPositions: [],
		},
		{
			position: { row: 10, column: 0 },
			expectedPositions: [{ row: 9, column: 0 }],
		},
		{
			position: { row: 0, column: 5 },
			expectedPositions: [{ row: 0, column: 4 }],
		},
		{
			position: { row: 10, column: 5 },
			expectedPositions: [],
		},
		{
			position: { row: 11, column: 0 },
			expectedPositions: [],
		},
		{
			position: { row: 0, column: 6 },
			expectedPositions: [],
		},
	])(
		"returns only neighbour positions inside grid for out of range position $position",
		({ position, expectedPositions }) => {
			const neighbourPositions = grid.getNeighbourPositions(position)
			expect(new Set(neighbourPositions)).toEqual(new Set(expectedPositions))
		}
	)
})
