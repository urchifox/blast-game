import { Command, CommandName } from "./command"
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
	const tileHandler = new TileHandler({
		gameRules: new GameRules(),
		fieldQueries: fieldQueries,
		randomizationFunction: () => 0,
	})
	return {
		tileHandler,
		fieldQueries,
	}
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
		const { tileHandler, fieldQueries } = createTileHandler()
		const clickedPosition = { row: 2, column: 0 }
		const clickedTile = fieldQueries.getTileByPosition(clickedPosition) as Tile

		const commands = tileHandler.onClick(clickedTile)

		expect(commands).toBeNull()
	})

	it("should return commands to remove and add tiles", () => {
		const { tileHandler, fieldQueries } = createTileHandler()
		const clickedPosition = { row: 0, column: 0 }
		const clickedTile = fieldQueries.getTileByPosition(clickedPosition) as Tile

		const commands = tileHandler.onClick(clickedTile)
		const command = commands?.[0] as Command<CommandName.REMOVE>
		const tilesInPayload = command.payload.tiles
		const tilesPositionsInPayload = [...tilesInPayload].map((tile) =>
			tile.getPosition()
		)

		expect(commands).toBeDefined()
		expect(commands?.length).toEqual(1)
		expect(command.name).toEqual(CommandName.REMOVE)
		expect(command.payload.removingFromPosition).toEqual(clickedPosition)
		expect(new Set(tilesPositionsInPayload)).toEqual(
			new Set([
				{ row: 0, column: 0 },
				{ row: 1, column: 0 },
				{ row: 0, column: 1 },
			])
		)
	})
})

describe("tile remove handling", () => {
	it("should return null for normal kind", () => {
		const { tileHandler, fieldQueries } = createTileHandler()
		const position = { row: 0, column: 0 }
		const tile = fieldQueries.getTileByPosition(position) as Tile

		const result = tileHandler.onRemove(tile)

		expect(result).toBeNull()
	})
})
