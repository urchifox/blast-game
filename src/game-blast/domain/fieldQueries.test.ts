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

function createFieldQueries() {
	return createField({
		columns: 3,
		rows: 3,
		tilesProps: new Set(tilesProps),
	})
}

describe("field queries", () => {
	it.each(tilesProps)(
		"finds tile by its position",
		({ position, id, kind }) => {
			const { fieldQueries } = createFieldQueries()
			const tileByPosition = fieldQueries.getTileByPosition(position)
			expect(tileByPosition?.getPosition()).toEqual(position)
			expect(tileByPosition?.getId()).toEqual(id)
			expect(tileByPosition?.getKind()).toEqual(kind)
		}
	)

	it.each(tilesProps)("finds tile by its id", ({ position, id, kind }) => {
		const { fieldQueries } = createFieldQueries()
		const tileById = fieldQueries.getTileById(id)
		expect(tileById?.getId()).toEqual(id)
		expect(tileById?.getPosition()).toEqual(position)
		expect(tileById?.getKind()).toEqual(kind)
	})

	it.each([
		{
			position: { row: 0, column: 0 },
			radius: 1,
			expectedPositions: [
				{ row: 0, column: 0 },
				{ row: 1, column: 0 },
				{ row: 0, column: 1 },
				{ row: 1, column: 1 },
			],
		},
		{
			position: { row: 1, column: 1 },
			radius: 1,
			expectedPositions: tilesProps.map((tileProps) => tileProps.position),
		},
		{
			position: { row: 2, column: 2 },
			radius: 2,
			expectedPositions: tilesProps.map((tileProps) => tileProps.position),
		},
	])(
		"returns tiles in radius for position in range",
		({ position, radius, expectedPositions }) => {
			const { fieldQueries } = createFieldQueries()
			const tilesInRadius = fieldQueries.getTilesInRadius(
				position,
				radius
			).tiles
			const tilesInRadiusPositions = [...tilesInRadius].map((tile) =>
				tile.getPosition()
			)
			expect(new Set(tilesInRadiusPositions)).toEqual(
				new Set(expectedPositions)
			)
		}
	)

	it.each([
		{
			position: { row: -1, column: -1 },
			radius: 1,
			expectedPositions: [{ row: 0, column: 0 }],
		},
		{
			position: { row: 3, column: 3 },
			radius: 1,
			expectedPositions: [{ row: 2, column: 2 }],
		},
	])(
		"returns tiles in radius for position out of range",
		({ position, radius, expectedPositions }) => {
			const { fieldQueries } = createFieldQueries()
			const tilesInRadius = fieldQueries.getTilesInRadius(
				position,
				radius
			).tiles
			const tilesInRadiusPositions = [...tilesInRadius].map((tile) =>
				tile.getPosition()
			)
			expect(new Set(tilesInRadiusPositions)).toEqual(
				new Set(expectedPositions)
			)
		}
	)

	it.each([
		{
			row: 0,
			expectedPositions: [
				{ row: 0, column: 0 },
				{ row: 0, column: 1 },
				{ row: 0, column: 2 },
			],
		},
		{
			row: 2,
			expectedPositions: [
				{ row: 2, column: 0 },
				{ row: 2, column: 1 },
				{ row: 2, column: 2 },
			],
		},
		{
			row: -1,
			expectedPositions: [],
		},
		{
			row: 3,
			expectedPositions: [],
		},
	])("returns tiles in row", ({ row, expectedPositions }) => {
		const { fieldQueries } = createFieldQueries()
		const tilesInRow = fieldQueries.getTilesInRow(row).tiles
		const tilesInRowPositions = [...tilesInRow].map((tile) =>
			tile.getPosition()
		)
		expect(new Set(tilesInRowPositions)).toEqual(new Set(expectedPositions))
	})

	it.each([
		{
			column: 0,
			expectedPositions: [
				{ row: 0, column: 0 },
				{ row: 1, column: 0 },
				{ row: 2, column: 0 },
			],
		},
		{
			column: 2,
			expectedPositions: [
				{ row: 0, column: 2 },
				{ row: 1, column: 2 },
				{ row: 2, column: 2 },
			],
		},
		{
			column: -1,
			expectedPositions: [],
		},
		{
			column: 3,
			expectedPositions: [],
		},
	])("returns tiles in column", ({ column, expectedPositions }) => {
		const { fieldQueries } = createFieldQueries()
		const tilesInColumn = fieldQueries.getTilesInColumn(column).tiles
		const tilesInColumnPositions = [...tilesInColumn].map((tile) =>
			tile.getPosition()
		)
		expect(new Set(tilesInColumnPositions)).toEqual(new Set(expectedPositions))
	})

	it.each([
		{
			tilePosition: { row: 0, column: 0 },
			expectedPositions: [
				{ row: 0, column: 0 },
				{ row: 1, column: 0 },
				{ row: 0, column: 1 },
			],
		},
		{
			tilePosition: { row: 2, column: 0 },
			expectedPositions: [{ row: 2, column: 0 }],
		},
	])(
		"finds same kind neighbour tiles for provided tile",
		({ tilePosition, expectedPositions }) => {
			const { fieldQueries } = createFieldQueries()
			const tile = fieldQueries.getTileByPosition(tilePosition) as Tile
			const sameKindNeighbourTiles =
				fieldQueries.getSameKindNeighbourTiles(tile).tiles
			const sameKindNeighbourTilesPositions = [...sameKindNeighbourTiles].map(
				(tile) => tile.getPosition()
			)
			expect(new Set(sameKindNeighbourTilesPositions)).toEqual(
				new Set(expectedPositions)
			)
		}
	)

	it.each([
		{
			centerPosition: { row: 0, column: 0 },
			expectedGroups: [
				[0, new Set([{ row: 0, column: 0 }])],
				[
					1,
					new Set([
						{ row: 1, column: 0 },
						{ row: 0, column: 1 },
						{ row: 1, column: 1 },
					]),
				],
				[
					2,
					new Set([
						{ row: 2, column: 0 },
						{ row: 2, column: 1 },
						{ row: 2, column: 2 },
						{ row: 0, column: 2 },
						{ row: 1, column: 2 },
					]),
				],
			],
		},
	])(
		"groups and sorts tile by their distance from the center position",
		({ centerPosition, expectedGroups }) => {
			const { fieldQueries } = createFieldQueries()
			const tiles = fieldQueries.getTiles()
			const sortedGroupedTiles = fieldQueries.getSortedGroupedTiles(
				new Set(tiles),
				centerPosition
			)
			const sortedGroupedPositions = sortedGroupedTiles.map(
				([distance, tiles]) => [
					distance,
					new Set([...tiles].map((tile) => tile.getPosition())),
				]
			)
			expect(sortedGroupedPositions).toEqual(expectedGroups)
		}
	)
})
