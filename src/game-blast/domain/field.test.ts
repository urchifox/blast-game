import { Field } from "./field"
import { Grid } from "./grid"
import { Tile } from "./tile"

let field: Field
beforeEach(() => {
	const grid = new Grid()
	grid.createGrid({ columns: 3, rows: 3 })

	const randomizationFunction = () => 0
	let nextId = 1
	const createId = () => String(nextId++)

	field = new Field({
		getGridSnapshot: grid.getSnapshot.bind(grid),
		randomizationFunction,
		createId,
	})
	field.generateTiles()
})

const expectedGeneratedTiles: Array<Tile> = [
	new Tile({
		kind: "blue",
		position: { row: 0, column: 0 },
		id: "1",
	}),
	new Tile({
		kind: "blue",
		position: { row: 1, column: 0 },
		id: "2",
	}),
	new Tile({
		kind: "blue",
		position: { row: 2, column: 0 },
		id: "3",
	}),
	new Tile({
		kind: "blue",
		position: { row: 0, column: 1 },
		id: "4",
	}),
	new Tile({
		kind: "blue",
		position: { row: 1, column: 1 },
		id: "5",
	}),
	new Tile({
		kind: "blue",
		position: { row: 2, column: 1 },
		id: "6",
	}),
	new Tile({
		kind: "blue",
		position: { row: 0, column: 2 },
		id: "7",
	}),
	new Tile({
		kind: "blue",
		position: { row: 1, column: 2 },
		id: "8",
	}),
	new Tile({
		kind: "blue",
		position: { row: 2, column: 2 },
		id: "9",
	}),
]

describe("field", () => {
	it("fills positions after removing", () => {
		const positionsToDelete = [
			{ row: 1, column: 0 },
			{ row: 1, column: 1 },
			{ row: 1, column: 2 },
		]
		positionsToDelete.forEach((position) => {
			field.removeTile(position)
		})

		const { movedTiles, newTiles } = field.fillEmptyPositions(
			new Set(positionsToDelete)
		)

		const tiles = field.getTiles()

		const movedTilesIds = [...movedTiles].map((tile) => tile.getId())
		const movesTilesIdsExpected = [
			expectedGeneratedTiles[0],
			expectedGeneratedTiles[3],
			expectedGeneratedTiles[6],
		].map((tile) => tile.getId())

		expect(movedTilesIds).toEqual(movesTilesIdsExpected)

		expect(newTiles).toEqual(new Set([tiles[0], tiles[3], tiles[6]]))
	})

	it.each([
		{ tile1: expectedGeneratedTiles[0], tile2: expectedGeneratedTiles[1] },
		{ tile1: expectedGeneratedTiles[0], tile2: expectedGeneratedTiles[0] },
	])("swaps different tiles", ({ tile1, tile2 }) => {
		const tile1Position = tile1.getPosition()
		const tile2Position = tile2.getPosition()
		field.swapTiles(tile1, tile2)
		expect(tile1.getPosition()).toEqual(tile2Position)
		expect(tile2.getPosition()).toEqual(tile1Position)
	})
})
