import { CommandName } from "./command"
import { Field } from "./field"
import { FieldQueries } from "./fieldQueries"
import { GameRules } from "./gameRules"
import { Grid } from "./grid"
import { Tile } from "./tile"
import { TileHandler } from "./tileHandler"

let tileHandler: TileHandler
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
	const fieldQueries = new FieldQueries({ field, grid })

	tileHandler = new TileHandler({
		gameRules: new GameRules(),
		fieldQueries: fieldQueries,
		randomizationFunction: () => 0,
	})
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

describe("tile click handling", () => {
	it("should return null if there is no connection", () => {
		const clickedTile = expectedGeneratedTiles[2]
		const result = tileHandler.onClick(clickedTile)
		expect(result).toBeNull()
	})

	it("should return commands to remove and add tiles", () => {
		const clickedTile = expectedGeneratedTiles[0]
		const result = tileHandler.onClick(clickedTile)
		expect(result).toEqual([
			{
				name: CommandName.REMOVE,
				payload: {
					removingFromPosition: clickedTile.getPosition(),
					tiles: new Set([
						expectedGeneratedTiles[0],
						expectedGeneratedTiles[1],
						expectedGeneratedTiles[3],
					]),
				},
			},
		])
	})
})

describe("tile remove handling", () => {
	it("should return null for normal kind", () => {
		const tile = expectedGeneratedTiles[0]
		const result = tileHandler.onRemove(tile)
		expect(result).toBeNull()
	})
})
