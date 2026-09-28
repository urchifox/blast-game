import { createField } from "./testHelpers"
import { Tile, TileProps } from "./tile"

const tilesProps = [
	{
		id: "1",
		kind: "red",
		position: { row: 0, column: 0 },
	},
	{
		id: "2",
		kind: "red",
		position: { row: 1, column: 0 },
	},
	{
		id: "3",
		kind: "yellow",
		position: { row: 2, column: 0 },
	},
	{
		id: "4",
		kind: "red",
		position: { row: 0, column: 1 },
	},
	{
		id: "5",
		kind: "yellow",
		position: { row: 1, column: 1 },
	},
	{
		id: "6",
		kind: "blue",
		position: { row: 2, column: 1 },
	},
	{
		id: "7",
		kind: "yellow",
		position: { row: 0, column: 2 },
	},
	{
		id: "8",
		kind: "blue",
		position: { row: 1, column: 2 },
	},
	{
		id: "9",
		kind: "yellow",
		position: { row: 2, column: 2 },
	},
] satisfies Array<TileProps>

const tilesFromProps = tilesProps.map((tileProps) => new Tile(tileProps))

function createFieldQueries() {
	return createField({
		columns: 3,
		rows: 3,
		tilesProps: new Set(tilesProps),
	})
}

describe("field queries", () => {
	it.each(tilesFromProps)("finds tile by its position", (expectedTile) => {
		const { fieldQueries } = createFieldQueries()
		const tileByPosition = fieldQueries.getTileByPosition(
			expectedTile.getPosition()
		)
		expect(tileByPosition).toEqual(expectedTile)
	})

	it.each(tilesFromProps)("finds tile by its id", (expectedTile) => {
		const { fieldQueries } = createFieldQueries()
		const tileById = fieldQueries.getTileById(expectedTile.getId())
		expect(tileById).toEqual(expectedTile)
	})

	it.each([
		{
			position: tilesFromProps[0].getPosition(),
			radius: 1,
			expectedTiles: [
				tilesFromProps[0],
				tilesFromProps[1],
				tilesFromProps[3],
				tilesFromProps[4],
			],
		},
		{
			position: tilesFromProps[4].getPosition(),
			radius: 1,
			expectedTiles: tilesFromProps,
		},
		{
			position: tilesFromProps[8].getPosition(),
			radius: 2,
			expectedTiles: tilesFromProps,
		},
	])(
		"returns tiles in radius for position in range",
		({ position, radius, expectedTiles }) => {
			const { fieldQueries } = createFieldQueries()
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
			expectedTiles: [tilesFromProps[0]],
		},
		{
			position: { row: 3, column: 3 },
			radius: 1,
			expectedTiles: [tilesFromProps[8]],
		},
	])(
		"returns tiles in radius for position out of range",
		({ position, radius, expectedTiles }) => {
			const { fieldQueries } = createFieldQueries()
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
			expectedTiles: [tilesFromProps[0], tilesFromProps[3], tilesFromProps[6]],
		},
		{
			row: 2,
			expectedTiles: [tilesFromProps[2], tilesFromProps[5], tilesFromProps[8]],
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
		const { fieldQueries } = createFieldQueries()
		const tilesInRow = fieldQueries.getTilesInRow(row).tiles
		expect([...tilesInRow]).toEqual(expectedTiles)
	})

	it.each([
		{
			column: 0,
			expectedTiles: [tilesFromProps[0], tilesFromProps[1], tilesFromProps[2]],
		},
		{
			column: 2,
			expectedTiles: [tilesFromProps[6], tilesFromProps[7], tilesFromProps[8]],
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
		const { fieldQueries } = createFieldQueries()
		const tilesInColumn = fieldQueries.getTilesInColumn(column).tiles
		expect([...tilesInColumn]).toEqual(expectedTiles)
	})

	it.each([
		{
			tile: tilesFromProps[0],
			expectedTiles: [tilesFromProps[0], tilesFromProps[1], tilesFromProps[3]],
		},
		{
			tile: tilesFromProps[2],
			expectedTiles: [tilesFromProps[2]],
		},
	])(
		"finds same kind neighbour tiles for provided tile",
		({ tile, expectedTiles }) => {
			const { fieldQueries } = createFieldQueries()
			const sameKindNeighbourTiles =
				fieldQueries.getSameKindNeighbourTiles(tile).tiles
			expect([...sameKindNeighbourTiles]).toEqual(expectedTiles)
		}
	)

	it.each([
		{
			tiles: tilesFromProps,
			centerPosition: tilesFromProps[0].getPosition(),
			expectedTiles: [
				[0, new Set([tilesFromProps[0]])],
				[1, new Set([tilesFromProps[1], tilesFromProps[3], tilesFromProps[4]])],
				[
					2,
					new Set([
						tilesFromProps[2],
						tilesFromProps[5],
						tilesFromProps[8],
						tilesFromProps[6],
						tilesFromProps[7],
					]),
				],
			],
		},
	])(
		"groups and sorts tile by their distance from the center position",
		({ tiles, centerPosition, expectedTiles }) => {
			const { fieldQueries } = createFieldQueries()
			const sortedGroupedTiles = fieldQueries.getSortedGroupedTiles(
				new Set(tiles),
				centerPosition
			)
			expect([...sortedGroupedTiles]).toEqual(expectedTiles)
		}
	)
})
