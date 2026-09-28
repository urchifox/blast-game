import { BoosterUseHandler } from "./boosterUseHandler"
import { CommandName } from "./command"
import { Field } from "./field"
import { FieldQueries } from "./fieldQueries"
import { GameRules } from "./gameRules"
import { Grid } from "./grid"
import { Tile } from "./tile"
import { BoosterName } from "./types"

let boosterUseHandler: BoosterUseHandler
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

	boosterUseHandler = new BoosterUseHandler({
		gameRules: new GameRules(),
		fieldQueries: fieldQueries,
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

describe("booster use handling", () => {
	it.each([
		{ boosterName: "bomb" as BoosterName, tiles: [] },
		{ boosterName: "teleport" as BoosterName, tiles: [] },
		{
			boosterName: "teleport" as BoosterName,
			tiles: [expectedGeneratedTiles[0]],
		},
	])(
		"should return null if the tiles are not the required count",
		({ boosterName, tiles }) => {
			const result = boosterUseHandler.use({ boosterName, tiles })
			expect(result).toBeNull()
		}
	)

	it.each([
		{
			tiles: [expectedGeneratedTiles[0]],
			expectedTilesToRemove: expectedGeneratedTiles,
		},
	])(
		"bomb should return commands to remove tiles",
		({ tiles, expectedTilesToRemove }) => {
			const result = boosterUseHandler.use({
				boosterName: "bomb" as BoosterName,
				tiles,
			})
			expect(result).toEqual([
				{
					name: CommandName.REMOVE,
					payload: {
						tiles: new Set(expectedTilesToRemove),
						removingFromPosition: tiles[0].getPosition(),
					},
				},
			])
		}
	)

	it.each([
		{
			tiles: [expectedGeneratedTiles[0], expectedGeneratedTiles[1]],
		},
	])("tile should return commands to swap tiles", ({ tiles }) => {
		const result = boosterUseHandler.use({
			boosterName: "teleport" as BoosterName,
			tiles,
		})
		expect(result).toEqual([
			{
				name: CommandName.SWAP,
				payload: tiles,
			},
		])
	})
})
