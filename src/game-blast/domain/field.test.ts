import { createField } from "./testHelpers"
import { Tile, TileProps } from "./tile"

const tilesProps = [
	{
		id: "1",
		kind: "blue",
		position: { row: 0, column: 0 },
	},
	{
		id: "2",
		kind: "blue",
		position: { row: 1, column: 0 },
	},
	{
		id: "3",
		kind: "blue",
		position: { row: 2, column: 0 },
	},
	{
		id: "4",
		kind: "blue",
		position: { row: 0, column: 1 },
	},
	{
		id: "5",
		kind: "blue",
		position: { row: 1, column: 1 },
	},
	{
		id: "6",
		kind: "blue",
		position: { row: 2, column: 1 },
	},
	{
		id: "7",
		kind: "blue",
		position: { row: 0, column: 2 },
	},
	{
		id: "8",
		kind: "blue",
		position: { row: 1, column: 2 },
	},
	{
		id: "9",
		kind: "blue",
		position: { row: 2, column: 2 },
	},
] satisfies Array<TileProps>

describe("field", () => {
	it("fills positions after removing", () => {
		const { field } = createField({
			columns: 3,
			rows: 3,
			tilesProps: new Set(tilesProps),
		})
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

		const movedTilesPositions = [...movedTiles].map((tile) =>
			tile.getPosition()
		)
		const movesTilesPositionsExpected = [
			new Tile(tilesProps[0]),
			new Tile(tilesProps[3]),
			new Tile(tilesProps[6]),
		].map((tile) => tile.getPosition())
		expect(new Set(movedTilesPositions)).toEqual(
			new Set(movesTilesPositionsExpected)
		)
		expect(newTiles.size).toBe(positionsToDelete.length)
	})

	it.each([
		{ tile1: new Tile(tilesProps[0]), tile2: new Tile(tilesProps[1]) },
		{ tile1: new Tile(tilesProps[0]), tile2: new Tile(tilesProps[0]) },
	])("swaps tiles", ({ tile1, tile2 }) => {
		const { field } = createField({
			columns: 3,
			rows: 3,
			tilesProps: new Set(tilesProps),
		})
		const tile1Position = tile1.getPosition()
		const tile2Position = tile2.getPosition()

		field.swapTiles(tile1, tile2)

		expect(tile1.getPosition()).toEqual(tile2Position)
		expect(tile2.getPosition()).toEqual(tile1Position)
	})
})
