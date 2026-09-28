import { Field } from "./field"
import { FieldQueries } from "./fieldQueries"
import { Grid } from "./grid"
import { Tile } from "./tile"

let fieldQueries: FieldQueries
beforeEach(() => {
	const grid = new Grid()
	grid.createGrid({ columns: 3, rows: 3 })

	const randomizationFunction = () => 0
	let nextId = 1
	const createId = () => String(nextId++)

	const field = new Field({
		getGridSnapshot: grid.getSnapshot.bind(grid),
		randomizationFunction,
		createId,
	})
	vi.spyOn(field, "getTiles").mockReturnValue(expectedGeneratedTiles)

	fieldQueries = new FieldQueries({ field, grid })
})

const expectedGeneratedTiles: Array<Tile> = [
	new Tile({
		kind: "red",
		position: { row: 0, column: 0 },
		id: "1",
	}),
	new Tile({
		kind: "red",
		position: { row: 1, column: 0 },
		id: "2",
	}),
	new Tile({
		kind: "yellow",
		position: { row: 2, column: 0 },
		id: "3",
	}),
	new Tile({
		kind: "red",
		position: { row: 0, column: 1 },
		id: "4",
	}),
	new Tile({
		kind: "yellow",
		position: { row: 1, column: 1 },
		id: "5",
	}),
	new Tile({
		kind: "blue",
		position: { row: 2, column: 1 },
		id: "6",
	}),
	new Tile({
		kind: "yellow",
		position: { row: 0, column: 2 },
		id: "7",
	}),
	new Tile({
		kind: "blue",
		position: { row: 1, column: 2 },
		id: "8",
	}),
	new Tile({
		kind: "yellow",
		position: { row: 2, column: 2 },
		id: "9",
	}),
]

describe("field queries", () => {
	it.each(expectedGeneratedTiles)(
		"returns tile by its position",
		(expectedTile) => {
			const tilesByPosition = fieldQueries.getTileByPosition(
				expectedTile.getPosition()
			)
			expect(tilesByPosition).toEqual(expectedTile)
		}
	)

	it.each(expectedGeneratedTiles)("returns tile by its id", (expectedTile) => {
		const tilesById = fieldQueries.getTileById(expectedTile.getId())
		expect(tilesById).toEqual(expectedTile)
	})

	it.each([
		{
			position: expectedGeneratedTiles[0].getPosition(),
			radius: 1,
			expectedTiles: [
				expectedGeneratedTiles[0],
				expectedGeneratedTiles[1],
				expectedGeneratedTiles[3],
				expectedGeneratedTiles[4],
			],
		},
		{
			position: expectedGeneratedTiles[4].getPosition(),
			radius: 1,
			expectedTiles: expectedGeneratedTiles,
		},
		{
			position: expectedGeneratedTiles[8].getPosition(),
			radius: 2,
			expectedTiles: expectedGeneratedTiles,
		},
	])(
		"returns tiles in radius for position in range",
		({ position, radius, expectedTiles }) => {
			const tilesInRadius = fieldQueries.getTilesInRadius(
				position,
				radius
			).tiles
			expect([...tilesInRadius]).toEqual(expectedTiles)
		}
	)

	it.each([
		{
			position: { row: -1, column: -1 },
			radius: 1,
			expectedTiles: [expectedGeneratedTiles[0]],
		},
		{
			position: { row: 3, column: 3 },
			radius: 1,
			expectedTiles: [expectedGeneratedTiles[8]],
		},
	])(
		"returns tiles in radius for position out of range",
		({ position, radius, expectedTiles }) => {
			const tilesInRadius = fieldQueries.getTilesInRadius(
				position,
				radius
			).tiles
			expect([...tilesInRadius]).toEqual(expectedTiles)
		}
	)

	it.each([
		{
			row: 0,
			expectedTiles: [
				expectedGeneratedTiles[0],
				expectedGeneratedTiles[3],
				expectedGeneratedTiles[6],
			],
		},
		{
			row: 2,
			expectedTiles: [
				expectedGeneratedTiles[2],
				expectedGeneratedTiles[5],
				expectedGeneratedTiles[8],
			],
		},
		{
			row: -1,
			expectedTiles: [],
		},
		{
			row: 3,
			expectedTiles: [],
		},
	])("returns tiles in row", ({ row, expectedTiles }) => {
		const tilesInRow = fieldQueries.getTilesInRow(row).tiles
		expect([...tilesInRow]).toEqual(expectedTiles)
	})

	it.each([
		{
			column: 0,
			expectedTiles: [
				expectedGeneratedTiles[0],
				expectedGeneratedTiles[1],
				expectedGeneratedTiles[2],
			],
		},
		{
			column: 2,
			expectedTiles: [
				expectedGeneratedTiles[6],
				expectedGeneratedTiles[7],
				expectedGeneratedTiles[8],
			],
		},
		{
			column: -1,
			expectedTiles: [],
		},
		{
			column: 3,
			expectedTiles: [],
		},
	])("returns tiles in column", ({ column, expectedTiles }) => {
		const tilesInRow = fieldQueries.getTilesInColumn(column).tiles
		expect([...tilesInRow]).toEqual(expectedTiles)
	})

	it.each([
		{
			tile: expectedGeneratedTiles[0],
			expectedTiles: [
				expectedGeneratedTiles[0],
				expectedGeneratedTiles[1],
				expectedGeneratedTiles[3],
			],
		},
		{
			tile: expectedGeneratedTiles[2],
			expectedTiles: [expectedGeneratedTiles[2]],
		},
	])("returns same kind neighbour tiles", ({ tile, expectedTiles }) => {
		const sameKindNeighbourTiles =
			fieldQueries.getSameKindNeighbourTiles(tile).tiles
		expect([...sameKindNeighbourTiles]).toEqual(expectedTiles)
	})

	it.each([
		{
			tiles: expectedGeneratedTiles,
			centerPosition: expectedGeneratedTiles[0].getPosition(),
			expectedTiles: [
				[0, new Set([expectedGeneratedTiles[0]])],
				[
					1,
					new Set([
						expectedGeneratedTiles[1],
						expectedGeneratedTiles[3],
						expectedGeneratedTiles[4],
					]),
				],
				[
					2,
					new Set([
						expectedGeneratedTiles[2],
						expectedGeneratedTiles[5],
						expectedGeneratedTiles[8],
						expectedGeneratedTiles[6],
						expectedGeneratedTiles[7],
					]),
				],
			],
		},
	])(
		"returns same kind neighbour tiles",
		({ tiles, centerPosition, expectedTiles }) => {
			const sameKindNeighbourTiles = fieldQueries.getSortedGroupedTiles(
				new Set(tiles),
				centerPosition
			)
			expect([...sameKindNeighbourTiles]).toEqual(expectedTiles)
		}
	)
})
