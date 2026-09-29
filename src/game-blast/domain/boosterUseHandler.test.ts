import { BoosterUseHandler } from "./boosterUseHandler"
import { CommandName } from "./command"
import { GameRules } from "./gameRules"
import { createField } from "./testHelpers"
import { Tile, TileProps } from "./tile"
import { BoosterName } from "./types"

function createBoosterUseHandler() {
	const { fieldQueries } = createField({
		columns: 3,
		rows: 3,
		tilesProps: new Set(tilesProps),
	})
	return new BoosterUseHandler({
		gameRules: new GameRules(),
		fieldQueries: fieldQueries,
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

describe("booster use handling", () => {
	it.each([
		{ boosterName: "bomb" as BoosterName, tiles: [] },
		{ boosterName: "teleport" as BoosterName, tiles: [] },
		{
			boosterName: "teleport" as BoosterName,
			tiles: [new Tile(tilesProps[0])],
		},
	])(
		"should return null if the tiles are not the required count",
		({ boosterName, tiles }) => {
			const boosterUseHandler = createBoosterUseHandler()
			const result = boosterUseHandler.use({ boosterName, tiles })
			expect(result).toBeNull()
		}
	)

	it.each([
		{
			tiles: [new Tile(tilesProps[0])],
			expectedTilesToRemove: tilesProps.map((tile) => new Tile(tile)),
		},
	])(
		"bomb should return commands to remove tiles",
		({ tiles, expectedTilesToRemove }) => {
			const boosterUseHandler = createBoosterUseHandler()
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
			tiles: [new Tile(tilesProps[0]), new Tile(tilesProps[1])],
		},
	])("tile should return commands to swap tiles", ({ tiles }) => {
		const boosterUseHandler = createBoosterUseHandler()
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
