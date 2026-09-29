import { CommandName } from "./command"
import { GameRules } from "./gameRules"
import { createField } from "./testHelpers"
import { Tile, TileProps } from "./tile"
import { TileHandler } from "./tileHandler"

function createTileHandler() {
	const { fieldQueries } = createField({
		columns: 3,
		rows: 3,
		tilesProps: new Set(tilesProps),
	})
	return new TileHandler({
		gameRules: new GameRules(),
		fieldQueries: fieldQueries,
		randomizationFunction: () => 0,
	})
}

const tilesProps = [
	{
		kind: "red",
		position: { row: 0, column: 0 },
		id: "1",
	},
	{
		kind: "red",
		position: { row: 1, column: 0 },
		id: "2",
	},
	{
		kind: "yellow",
		position: { row: 2, column: 0 },
		id: "3",
	},
	{
		kind: "red",
		position: { row: 0, column: 1 },
		id: "4",
	},
	{
		kind: "yellow",
		position: { row: 1, column: 1 },
		id: "5",
	},
	{
		kind: "blue",
		position: { row: 2, column: 1 },
		id: "6",
	},
	{
		kind: "yellow",
		position: { row: 0, column: 2 },
		id: "7",
	},
	{
		kind: "blue",
		position: { row: 1, column: 2 },
		id: "8",
	},
	{
		kind: "yellow",
		position: { row: 2, column: 2 },
		id: "9",
	},
] satisfies Array<TileProps>

describe("tile click handling", () => {
	it("should return null if there is no connection", () => {
		const tileHandler = createTileHandler()
		const clickedTile = new Tile(tilesProps[2])
		const result = tileHandler.onClick(clickedTile)
		expect(result).toBeNull()
	})

	it("should return commands to remove and add tiles", () => {
		const tileHandler = createTileHandler()
		const clickedTile = new Tile(tilesProps[0])
		const result = tileHandler.onClick(clickedTile)
		expect(result).toEqual([
			{
				name: CommandName.REMOVE,
				payload: {
					removingFromPosition: clickedTile.getPosition(),
					tiles: new Set([
						new Tile(tilesProps[0]),
						new Tile(tilesProps[1]),
						new Tile(tilesProps[3]),
					]),
				},
			},
		])
	})
})

describe("tile remove handling", () => {
	it("should return null for normal kind", () => {
		const tileHandler = createTileHandler()
		const tile = new Tile(tilesProps[0])
		const result = tileHandler.onRemove(tile)
		expect(result).toBeNull()
	})
})
