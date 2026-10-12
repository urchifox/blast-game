import { BoosterUseHandler } from "./boosterUseHandler"
import { Command, CommandName } from "./command"
import { GameRules } from "./gameRules"
import { createFieldComponentsStubbed, createTilesProps } from "./testHelpers"
import { Tile, TileKind } from "./tile"
import { BoosterName } from "./types"

const COLUMNS = 3
const ROWS = 3
const TILES_KINDS = [
	"red",
	"red",
	"yellow",

	"red",
	"yellow",
	"blue",

	"yellow",
	"blue",
	"yellow",
] satisfies Array<TileKind>
const tilesProps = createTilesProps({
	columns: COLUMNS,
	rows: ROWS,
	kinds: TILES_KINDS,
})

function createBoosterUseHandler() {
	const { fieldQueries } = createFieldComponentsStubbed({
		gridSize: { columns: COLUMNS, rows: ROWS },
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

describe("booster use handling", () => {
	it.each([
		{ boosterName: "bomb" as BoosterName, positions: [] },
		{ boosterName: "teleport" as BoosterName, positions: [] },
		{
			boosterName: "teleport" as BoosterName,
			positions: [{ row: 0, column: 0 }],
		},
		{
			boosterName: "teleport" as BoosterName,
			positions: [
				{ row: 0, column: 0 },
				{ row: 0, column: 0 },
			],
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
