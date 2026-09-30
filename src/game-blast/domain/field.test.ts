import { createField } from "./testHelpers"
import { TileProps } from "./tile"

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
		const newTilesPositions = [...newTiles].map((tile) => tile.getPosition())

		expect(new Set(movedTilesPositions)).toEqual(new Set(positionsToDelete))
		expect(new Set(newTilesPositions)).toEqual(
			new Set([
				{ row: 0, column: 0 },
				{ row: 0, column: 1 },
				{ row: 0, column: 2 },
			])
		)
	})

	it("swaps tiles", () => {
		const { field } = createField({
			columns: 3,
			rows: 3,
			tilesProps: new Set(tilesProps),
		})
		const tile1 = field.getTiles()[0]
		const tile1Position = tile1.getPosition()
		const tile2 = field.getTiles()[1]
		const tile2Position = tile2.getPosition()

		field.swapTiles(tile1, tile2)

		expect(tile1.getPosition()).toEqual(tile2Position)
		expect(tile2.getPosition()).toEqual(tile1Position)
	})

	it("shuffle dont change content but change positions of tiles", () => {
		const { field } = createField({
			columns: 3,
			rows: 3,
			tilesProps: new Set(tilesProps),
			randomizationFunction: () => 0.5,
		})
		const tilesBeforeShuffle = field.getTiles()

		field.shuffle()

		const tilesAfterShuffle = field.getTiles()
		const isContentEqual =
			tilesBeforeShuffle.length === tilesAfterShuffle.length &&
			tilesBeforeShuffle.every((item) => tilesAfterShuffle.includes(item))
		const isPositionsEqual = tilesAfterShuffle.every((tile) => {
			const tileId = tile.getId()
			const tileProps = tilesProps.find((props) => props.id === tileId)
			const { column: newColumn, row: newRow } = tile.getPosition()
			const { column: initialColumn, row: initialRow } = (
				tileProps as TileProps
			).position
			return newColumn === initialColumn && newRow === initialRow
		})
		expect(isContentEqual).toBe(true)
		expect(isPositionsEqual).toBe(false)
	})
})
