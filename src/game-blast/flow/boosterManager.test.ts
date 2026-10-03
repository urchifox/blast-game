import { GameRules } from "../domain/gameRules"
import { createFieldComponentsStubbed } from "../domain/testHelpers"
import { Tile, TileProps } from "../domain/tile"
import { ActResult } from "./actionManager"
import { BoosterHandlerResult } from "./boosterHandler"
import {
	createActionManagerStubbed,
	createBoosterManagerStubbed,
} from "./testHelpers"

const tilesProps = [
	{
		id: "1",
		kind: "red",
		position: { row: 0, column: 0 },
	},
	{
		id: "2",
		kind: "red",
		position: { row: 1, column: 0 },
	},
	{
		id: "3",
		kind: "yellow",
		position: { row: 2, column: 0 },
	},
	{
		id: "4",
		kind: "red",
		position: { row: 0, column: 1 },
	},
	{
		id: "5",
		kind: "yellow",
		position: { row: 1, column: 1 },
	},
	{
		id: "6",
		kind: "blue",
		position: { row: 2, column: 1 },
	},
	{
		id: "7",
		kind: "yellow",
		position: { row: 0, column: 2 },
	},
	{
		id: "8",
		kind: "blue",
		position: { row: 1, column: 2 },
	},
	{
		id: "9",
		kind: "yellow",
		position: { row: 2, column: 2 },
	},
] satisfies Array<TileProps>

function createSUT() {
	const { fieldQueries } = createFieldComponentsStubbed({
		gridSize: { columns: 3, rows: 3 },
		tilesProps: new Set(tilesProps),
	})

	const actionManager = createActionManagerStubbed({})
	const gameRules = new GameRules()

	const boosterManager = createBoosterManagerStubbed({
		gameRules,
		fieldQueries,
		actionManager,
	})

	return { boosterManager, fieldQueries }
}

describe("booster manager", () => {
	it("does not use booster if no booster is activated", () => {
		const { boosterManager, fieldQueries } = createSUT()
		const tile = fieldQueries.getTileByPosition(tilesProps[0].position) as Tile

		const result = boosterManager.maybeUseBooster(tile)

		expect(result.isUsed).toBe(false)
		expect(result.actResult).toBeNull()
	})

	it.each([
		{
			name: "bomb",
			tilesPositions: [
				{ column: 0, row: 0 },
				{
					column: 1,
					row: 1,
				},
			],
			expectedResult: {
				addedPositions: new Set([]),
				removedPositions: new Set(tilesProps.map((props) => props.position)),
				selectedPositions: new Set([]),
				swappedPositions: new Set([]),
			},
		},
		{
			name: "teleport",
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
				{
					column: 1,
					row: 1,
				},
			],
			expectedResult: {
				addedPositions: new Set([]),
				removedPositions: new Set([]),
				selectedPositions: new Set([]),
				swappedPositions: new Set([
					{
						column: 0,
						row: 0,
					},
					{
						column: 0,
						row: 1,
					},
				]),
			},
		},
	] as const)(
		"correctly uses booster $name after activation",
		({ name, tilesPositions, expectedResult }) => {
			const { boosterManager, fieldQueries } = createSUT()
			const tiles = tilesPositions.map(
				(position) => fieldQueries.getTileByPosition(position) as Tile
			)
			const expectedIntermediateResults = Array.from(
				{ length: tiles.length - 2 },
				() => ({
					isUsed: true,
					actResult: null,
				})
			)

			boosterManager.onBoosterButtonClick(name)
			const results = tiles.map((tile) => boosterManager.maybeUseBooster(tile))
			const extraResult = results.pop() as BoosterHandlerResult
			const successfulResult = results.pop() as BoosterHandlerResult
			const intermediateResults = results

			const { addedTiles, removedTiles, selectedTiles, swappedTiles } =
				successfulResult.actResult as ActResult
			const addedPositions = [...addedTiles].map((tile) => tile.getPosition())
			const removedPositions = [...removedTiles].map((tile) =>
				tile.getPosition()
			)
			const selectedPositions = [...selectedTiles].map((tile) =>
				tile.getPosition()
			)
			const swappedPositions = [...swappedTiles]
				.flat()
				.map((tile) => tile.getPosition())

			expect(intermediateResults).toEqual(expectedIntermediateResults)
			expect(successfulResult.isUsed).toBe(true)
			expect(new Set(addedPositions)).toEqual(expectedResult.addedPositions)
			expect(new Set(removedPositions)).toEqual(expectedResult.removedPositions)
			expect(new Set(selectedPositions)).toEqual(
				expectedResult.selectedPositions
			)
			expect(new Set(swappedPositions)).toEqual(expectedResult.swappedPositions)
			expect(extraResult.isUsed).toBe(false)
			expect(extraResult.actResult).toBeNull()
		}
	)

	it.each([
		{
			name: "bomb",
			tilesPositionsForFirstTry: [],
			tilesPositionsForSecondTry: [{ column: 0, row: 0 }],
		},
		{
			name: "teleport",
			tilesPositionsForFirstTry: [{ column: 0, row: 0 }],
			tilesPositionsForSecondTry: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
			],
		},
	] as const)(
		"reset activated booster after clearing",
		({ name, tilesPositionsForFirstTry, tilesPositionsForSecondTry }) => {
			const { boosterManager, fieldQueries } = createSUT()
			const tilesForFirstTry = tilesPositionsForFirstTry.map(
				(position) => fieldQueries.getTileByPosition(position) as Tile
			)
			const tilesForSecondTry = tilesPositionsForSecondTry.map(
				(position) => fieldQueries.getTileByPosition(position) as Tile
			)
			const expectedIntermediateResults = Array.from(
				{ length: tilesForFirstTry.length },
				() => ({
					isUsed: false,
					actResult: null,
				})
			)

			boosterManager.onBoosterButtonClick(name)
			tilesForFirstTry.forEach((tile) => boosterManager.maybeUseBooster(tile))
			boosterManager.clear()
			const secondTryResults = tilesForSecondTry.map((tile) =>
				boosterManager.maybeUseBooster(tile)
			)
			const lastResult = secondTryResults.pop() as BoosterHandlerResult

			expect(secondTryResults).toEqual(expectedIntermediateResults)
			expect(lastResult.isUsed).toBe(false)
			expect(lastResult.actResult).toBeNull()
		}
	)
})
