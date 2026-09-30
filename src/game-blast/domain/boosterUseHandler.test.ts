import { BoosterUseHandler } from "./boosterUseHandler"
import { Command, CommandName } from "./command"
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
	const boosterUseHandler = new BoosterUseHandler({
		gameRules: new GameRules(),
		fieldQueries: fieldQueries,
	})

	return {
		boosterUseHandler,
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

describe("booster use handling", () => {
	it.each([
		{ boosterName: "bomb" as BoosterName, positions: [] },
		{ boosterName: "teleport" as BoosterName, positions: [] },
		{
			boosterName: "teleport" as BoosterName,
			positions: [{ row: 0, column: 0 }],
		},
	])(
		"should return null if the tiles are not the required count",
		({ boosterName, positions }) => {
			const { boosterUseHandler, fieldQueries } = createBoosterUseHandler()
			const tiles = positions.map((position) =>
				fieldQueries.getTileByPosition(position)
			) as Array<Tile>

			const result = boosterUseHandler.use({ boosterName, tiles })

			expect(result).toBeNull()
		}
	)

	it.each([
		{
			positions: [{ row: 0, column: 0 }],
			expectedPositionsToRemove: tilesProps.map((props) => props.position),
		},
	])(
		"bomb should return command to remove tiles",
		({ positions, expectedPositionsToRemove }) => {
			const { boosterUseHandler, fieldQueries } = createBoosterUseHandler()
			const tiles = positions.map((position) =>
				fieldQueries.getTileByPosition(position)
			) as Array<Tile>

			const commands = boosterUseHandler.use({
				boosterName: "bomb" as BoosterName,
				tiles,
			})
			const command = commands?.[0] as Command<CommandName.REMOVE>
			const tilesInPayload = command.payload.tiles
			const tilesPositionsInPayload = [...tilesInPayload].map((tile) =>
				tile.getPosition()
			)

			expect(commands).toBeDefined()
			expect(commands?.length).toEqual(1)
			expect(command.name).toEqual(CommandName.REMOVE)
			expect(command.payload.removingFromPosition).toEqual(positions[0])
			expect(new Set(tilesPositionsInPayload)).toEqual(
				new Set(expectedPositionsToRemove)
			)
		}
	)

	it.each([
		{
			positions: [
				{ row: 0, column: 0 },
				{ row: 1, column: 0 },
			],
		},
	])("tile should return commands to swap tiles", ({ positions }) => {
		const { boosterUseHandler, fieldQueries } = createBoosterUseHandler()
		const tiles = positions.map((position) =>
			fieldQueries.getTileByPosition(position)
		) as Array<Tile>

		const commands = boosterUseHandler.use({
			boosterName: "teleport" as BoosterName,
			tiles,
		})
		const command = commands?.[0] as Command<CommandName.SWAP>
		const tilesInPayload = command.payload

		expect(commands).toBeDefined()
		expect(commands?.length).toEqual(1)
		expect(command.name).toEqual(CommandName.SWAP)
		expect(new Set(tilesInPayload)).toEqual(new Set(tiles))
	})
})
