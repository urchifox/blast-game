import { Command, CommandName } from "./command"
import { GameRules } from "./gameRules"
import {
	createFieldComponentsStubbed,
	createRandomizationFunctionStub,
	createTilesProps,
} from "./testHelpers"
import { Tile, TileKind } from "./tile"
import { TileHandler } from "./tileHandler"

const COLUMNS = 7
const ROWS = 7
const TILES_KINDS = [
	"green",
	"rockets-column",
	"rockets-row",
	"red",
	"red",
	"green",
	"green",

	"yellow",
	"yellow",
	"purple",
	"purple",
	"red",
	"green",
	"blue",

	"purple",
	"purple",
	"purple",
	"yellow",
	"yellow",
	"green",
	"blue",

	"purple",
	"yellow",
	"yellow",
	"yellow",
	"blue",
	"blue",
	"blue",

	"purple",
	"green",
	"green",
	"green",
	"green",
	"green",
	"blue",

	"purple",
	"yellow",
	"yellow",
	"yellow",
	"dynamite",
	"green",
	"blue",

	"bomb",
	"yellow",
	"yellow",
	"yellow",
	"yellow",
	"blue",
	"blue",
] satisfies Array<TileKind>
const tilesProps = createTilesProps({
	columns: COLUMNS,
	rows: ROWS,
	kinds: TILES_KINDS,
})

function createTileHandler() {
	const { fieldQueries } = createFieldComponentsStubbed({
		gridSize: { columns: COLUMNS, rows: ROWS },
		tilesProps: new Set(tilesProps),
	})
	const tileHandler = new TileHandler({
		gameRules: new GameRules(),
		fieldQueries: fieldQueries,
		randomizationFunction: createRandomizationFunctionStub(),
	})
	return {
		tileHandler,
		fieldQueries,
	}
}

describe("tile click handling", () => {
	it.each([{ clickedPosition: { row: 0, column: 0 } }])(
		"no commands if there is no connection to clicked tile",
		({ clickedPosition }) => {
			const { tileHandler, fieldQueries } = createTileHandler()
			const clickedTile = fieldQueries.getTileByPosition(
				clickedPosition
			) as Tile

			const commands = tileHandler.onClick(clickedTile)

			expect(commands).toBeNull()
		}
	)

	it.each([
		{
			clickedPosition: { row: 1, column: 0 },
			positionsToRemove: [
				{ row: 1, column: 0 },
				{ row: 1, column: 1 },
			],
		},
		{
			clickedPosition: { row: 0, column: 3 },
			positionsToRemove: [
				{ row: 0, column: 3 },
				{ row: 0, column: 4 },
				{ row: 1, column: 4 },
			],
		},
	])(
		"commands to remove tiles if 2 or 3 connections to clicked tile",
		({ clickedPosition, positionsToRemove }) => {
			const { tileHandler, fieldQueries } = createTileHandler()
			const clickedTile = fieldQueries.getTileByPosition(
				clickedPosition
			) as Tile

			const commands = tileHandler.onClick(clickedTile)
			const commandRemove = commands?.[0] as Command<CommandName.REMOVE>
			const tilesToRemove = commandRemove.payload.tiles
			const tilesToRemovePositions = [...tilesToRemove].map((tile) =>
				tile.getPosition()
			)

			expect(commands).toBeDefined()
			expect(commands?.length).toEqual(1)
			expect(commandRemove.name).toEqual(CommandName.REMOVE)
			expect(commandRemove.payload.removingFromPosition).toEqual(
				clickedPosition
			)
			expect(new Set(tilesToRemovePositions)).toEqual(
				new Set(positionsToRemove)
			)
		}
	)

	it.each([
		{
			clickedPosition: { row: 0, column: 6 },
			positionsToRemove: [
				{ row: 0, column: 6 },
				{ row: 0, column: 5 },
				{ row: 1, column: 5 },
				{ row: 2, column: 5 },
			],
			bonusTypes: ["rockets-column", "rockets-row"],
		},
		{
			clickedPosition: { row: 3, column: 3 },
			positionsToRemove: [
				{ row: 3, column: 3 },
				{ row: 3, column: 2 },
				{ row: 3, column: 1 },
				{ row: 2, column: 3 },
				{ row: 2, column: 4 },
			],
			bonusTypes: ["rockets-column", "rockets-row"],
		},
		{
			clickedPosition: { row: 4, column: 5 },
			positionsToRemove: [
				{ row: 5, column: 5 },
				{ row: 4, column: 5 },
				{ row: 4, column: 4 },
				{ row: 4, column: 3 },
				{ row: 4, column: 2 },
				{ row: 4, column: 1 },
			],
			bonusTypes: ["bomb"],
		},
		{
			clickedPosition: { row: 6, column: 1 },
			positionsToRemove: [
				{ row: 6, column: 1 },
				{ row: 6, column: 2 },
				{ row: 6, column: 3 },
				{ row: 5, column: 1 },
				{ row: 5, column: 2 },
				{ row: 5, column: 3 },
				{ row: 6, column: 4 },
			],
			bonusTypes: ["bomb"],
		},
		{
			clickedPosition: { row: 2, column: 0 },
			positionsToRemove: [
				{ row: 2, column: 0 },
				{ row: 2, column: 1 },
				{ row: 2, column: 2 },
				{ row: 1, column: 2 },
				{ row: 1, column: 3 },
				{ row: 3, column: 0 },
				{ row: 4, column: 0 },
				{ row: 5, column: 0 },
			],
			bonusTypes: ["dynamite"],
		},
		{
			clickedPosition: { row: 1, column: 6 },
			positionsToRemove: [
				{ row: 1, column: 6 },
				{ row: 2, column: 6 },
				{ row: 3, column: 6 },
				{ row: 3, column: 5 },
				{ row: 3, column: 4 },
				{ row: 4, column: 6 },
				{ row: 5, column: 6 },
				{ row: 6, column: 6 },
				{ row: 6, column: 5 },
			],
			bonusTypes: ["dynamite"],
		},
	])(
		"commands to remove tiles and add bonus if more than 4 connections to clicked tile",
		({ clickedPosition, positionsToRemove, bonusTypes }) => {
			const { tileHandler, fieldQueries } = createTileHandler()
			const clickedTile = fieldQueries.getTileByPosition(
				clickedPosition
			) as Tile

			const commands = tileHandler.onClick(clickedTile)
			const commandRemove = commands?.[0] as Command<CommandName.REMOVE>
			const tilesToRemove = commandRemove.payload.tiles
			const tilesToRemovePositions = [...tilesToRemove].map((tile) =>
				tile.getPosition()
			)
			const commandAdd = commands?.[1] as Command<CommandName.ADD>
			const bonusType = commandAdd.payload.kind
			const bonusPosition = commandAdd.payload.position

			expect(commands).toBeDefined()
			expect(commands?.length).toEqual(2)
			expect(commandRemove.name).toEqual(CommandName.REMOVE)
			expect(commandRemove.payload.removingFromPosition).toEqual(
				clickedPosition
			)
			expect(new Set(tilesToRemovePositions)).toEqual(
				new Set(positionsToRemove)
			)
			expect(commandAdd.name).toEqual(CommandName.ADD)
			expect(bonusType).toBeOneOf(bonusTypes)
			expect(bonusPosition).toEqual(clickedPosition)
		}
	)
})

describe("tile remove handling", () => {
	it.each([{ clickedPosition: { row: 0, column: 0 } }])(
		"commans nothing after normal tile removal",
		({ clickedPosition }) => {
			const { tileHandler, fieldQueries } = createTileHandler()
			const tile = fieldQueries.getTileByPosition(clickedPosition) as Tile

			const commands = tileHandler.onRemove(tile)

			expect(commands).toBeNull()
		}
	)

	it.each([
		{
			clickedPosition: { row: 0, column: 1 },
			positionsToRemove: [
				{ row: 0, column: 1 },
				{ row: 1, column: 1 },
				{ row: 2, column: 1 },
				{ row: 3, column: 1 },
				{ row: 4, column: 1 },
				{ row: 5, column: 1 },
				{ row: 6, column: 1 },
			],
		},
		{
			clickedPosition: { row: 0, column: 2 },
			positionsToRemove: [
				{ row: 0, column: 0 },
				{ row: 0, column: 1 },
				{ row: 0, column: 2 },
				{ row: 0, column: 3 },
				{ row: 0, column: 4 },
				{ row: 0, column: 5 },
				{ row: 0, column: 6 },
			],
		},
		{
			clickedPosition: { row: 6, column: 0 },
			positionsToRemove: [
				{ row: 6, column: 0 },
				{ row: 6, column: 1 },
				{ row: 6, column: 2 },
				{ row: 5, column: 0 },
				{ row: 5, column: 1 },
				{ row: 5, column: 2 },
				{ row: 4, column: 0 },
				{ row: 4, column: 1 },
				{ row: 4, column: 2 },
			],
		},
		{
			clickedPosition: { row: 5, column: 4 },
			positionsToRemove: tilesProps.map((tile) => tile.position),
		},
	])(
		"commans remove tiles after special tile removal",
		({ clickedPosition, positionsToRemove }) => {
			const { tileHandler, fieldQueries } = createTileHandler()
			const tile = fieldQueries.getTileByPosition(clickedPosition) as Tile

			const commands = tileHandler.onRemove(tile)
			const commandRemove = commands?.[0] as Command<CommandName.REMOVE>
			const tilesToRemove = commandRemove.payload.tiles
			const tilesToRemovePositions = [...tilesToRemove].map((tile) =>
				tile.getPosition()
			)

			expect(commands).toBeDefined()
			expect(commands?.length).toEqual(1)
			expect(commandRemove.name).toEqual(CommandName.REMOVE)
			expect(commandRemove.payload.removingFromPosition).toEqual(
				clickedPosition
			)
			expect(new Set(tilesToRemovePositions)).toEqual(
				new Set(positionsToRemove)
			)
		}
	)
})
