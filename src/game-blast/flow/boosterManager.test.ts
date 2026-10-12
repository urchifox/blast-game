import { GameRules } from "../domain/gameRules"
import {
	createFieldComponentsStubbed,
	createTilesProps,
} from "../domain/testHelpers"
import { Tile } from "../domain/tile"
import { ActionName, ActResult } from "./actionManager"
import { BoosterHandlerResult } from "./boosterHandler"
import {
	createActionManagerStubbed,
	createBoosterManagerStubbed,
} from "./testHelpers"

const tilesProps = createTilesProps({
	columns: 3,
	rows: 3,
	kinds: [
		"red",
		"red",
		"yellow",

		"red",
		"yellow",
		"blue",

		"yellow",
		"blue",
		"yellow",
	],
})

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

	return { boosterManager, fieldQueries, actionManager, gameRules }
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
			tilesPositions: [{ column: 0, row: 0 }],
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
		"resturs correct action result when uses booster $name after activation",
		({ name, tilesPositions, expectedResult }) => {
			const { boosterManager, fieldQueries } = createSUT()
			const tiles = tilesPositions.map(
				(position) => fieldQueries.getTileByPosition(position) as Tile
			)
			const expectedIntermediateResults = Array.from(
				{ length: tiles.length - 1 },
				() => ({
					isUsed: true,
					actResult: null,
				})
			)

			boosterManager.onBoosterButtonClick(name)
			const results = tiles.map((tile) => boosterManager.maybeUseBooster(tile))
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
		}
	)

	it.each([
		{
			name: "bomb",
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
			],
		},
		{
			name: "teleport",
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
				{ column: 1, row: 1 },
			],
		},
	] as const)(
		"deactivates booster after successful use",
		({ name, tilesPositions }) => {
			const { boosterManager, fieldQueries } = createSUT()
			const tiles = tilesPositions.map(
				(position) => fieldQueries.getTileByPosition(position) as Tile
			)

			boosterManager.onBoosterButtonClick(name)
			const results = tiles.map((tile) => boosterManager.maybeUseBooster(tile))
			const extraResult = results.pop() as BoosterHandlerResult

			expect(extraResult).toEqual({ isUsed: false, actResult: null })
		}
	)

	it.each([
		{
			names: ["bomb", "teleport"],
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
			],
			expectedActions: ["select", "swap"],
		},
		{
			names: ["teleport", "bomb"],
			tilesPositions: [{ column: 0, row: 0 }],
			expectedActions: ["remove"],
		},
	] as const)(
		"sequential activation activates only last booster",
		({ names, tilesPositions, expectedActions }) => {
			const { boosterManager, fieldQueries, actionManager } = createSUT()
			const tiles = tilesPositions.map(
				(position) => fieldQueries.getTileByPosition(position) as Tile
			)
			const doActionsSpy = vi.spyOn(actionManager, "doActions")

			names.forEach((name) => boosterManager.onBoosterButtonClick(name))
			tiles.forEach((tile) => boosterManager.maybeUseBooster(tile))

			const actualActions = doActionsSpy.mock.calls.map(
				(call) => call[0][0].name
			)
			expect(actualActions).toEqual(expectedActions)
		}
	)

	it("unselects tiles after switching to another booster", () => {
		const { boosterManager, fieldQueries, actionManager } = createSUT()
		const doActionsSpy = vi.spyOn(actionManager, "doActions")
		const doActionCalls = doActionsSpy.mock.calls
		const tile = fieldQueries.getTileByPosition({ column: 0, row: 0 }) as Tile

		boosterManager.onBoosterButtonClick("teleport")
		boosterManager.maybeUseBooster(tile)
		boosterManager.onBoosterButtonClick("bomb")

		const action1Names = doActionCalls[0][0].map((action) => action.name)
		const action2Names = doActionCalls[1][0].map((action) => action.name)
		expect(action1Names).toEqual([ActionName.SELECT])
		expect(action2Names).toEqual([ActionName.UNSELECT])
	})

	it("unselects tiles after second click on same booster", () => {
		const { boosterManager, fieldQueries, actionManager } = createSUT()
		const doActionsSpy = vi.spyOn(actionManager, "doActions")
		const doActionCalls = doActionsSpy.mock.calls
		const tile1 = fieldQueries.getTileByPosition({ column: 0, row: 0 }) as Tile
		const tile2 = fieldQueries.getTileByPosition({ column: 0, row: 1 }) as Tile

		boosterManager.onBoosterButtonClick("teleport")
		boosterManager.maybeUseBooster(tile1)
		boosterManager.onBoosterButtonClick("teleport")
		const result2 = boosterManager.maybeUseBooster(tile2)

		const action1Names = doActionCalls[0][0].map((action) => action.name)
		const action2Names = doActionCalls[1][0].map((action) => action.name)
		expect(action1Names).toEqual([ActionName.SELECT])
		expect(action2Names).toEqual([ActionName.UNSELECT])
		expect(result2).toEqual({ isUsed: false, actResult: null })
	})

	it("unselects tile after second click", () => {
		const { boosterManager, fieldQueries, actionManager } = createSUT()
		const doActionsSpy = vi.spyOn(actionManager, "doActions")
		const doActionCalls = doActionsSpy.mock.calls
		const tile = fieldQueries.getTileByPosition({ column: 0, row: 0 }) as Tile

		boosterManager.onBoosterButtonClick("teleport")
		boosterManager.maybeUseBooster(tile)
		const secondResult = boosterManager.maybeUseBooster(tile)

		const action1Names = doActionCalls[0][0].map((action) => action.name)
		const action2Names = doActionCalls[1][0].map((action) => action.name)
		expect(action1Names).toEqual([ActionName.SELECT])
		expect(action2Names).toEqual([ActionName.UNSELECT])
		expect(secondResult).toEqual({ isUsed: true, actResult: null })
	})

	it.each([
		{
			name: "bomb",
			tilesPositions: [{ column: 0, row: 0 }],
		},
		{
			name: "teleport",
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
			],
		},
	] as const)(
		"recharges booster $name after clear",
		({ name, tilesPositions }) => {
			const { boosterManager, fieldQueries, gameRules } = createSUT()
			const useCount = gameRules.BOOSTER_INITIAL_VALUE[name]
			const collectBoosterResults = () => {
				const results = []
				for (let i = 0; i < useCount; i++) {
					results.push(tryUseBooster() as BoosterHandlerResult)
				}
				return results
			}
			const tryUseBooster = () => {
				boosterManager.onBoosterButtonClick(name)
				const tiles = tilesPositions.map(
					(position) => fieldQueries.getTileByPosition(position) as Tile
				)
				const results = tiles.map((tile) =>
					boosterManager.maybeUseBooster(tile)
				)
				return results.pop()
			}

			const successfulResultsBeforeClean = collectBoosterResults()
			const unsuccessfulResultBeforeClean = tryUseBooster()
			boosterManager.clear()
			const successfulResultsAfterClean = collectBoosterResults()
			const unsuccessfulResultAfterClean = tryUseBooster()

			const expectedSuccessfulResults = Array.from({ length: useCount }, () =>
				expect.toSatisfy((result) => result.actResult !== null && result.isUsed)
			)
			const expectedUnsuccessfulResult = {
				isUsed: false,
				actResult: null,
			}
			expect(successfulResultsBeforeClean).toEqual(expectedSuccessfulResults)
			expect(unsuccessfulResultBeforeClean).toEqual(expectedUnsuccessfulResult)
			expect(successfulResultsAfterClean).toEqual(expectedSuccessfulResults)
			expect(unsuccessfulResultAfterClean).toEqual(expectedUnsuccessfulResult)
		}
	)

	it("deactivates the activated booster after clear", () => {
		const { boosterManager, fieldQueries } = createSUT()
		const tile1 = fieldQueries.getTileByPosition({ column: 0, row: 0 }) as Tile
		const tile2 = fieldQueries.getTileByPosition({ column: 1, row: 0 }) as Tile

		boosterManager.onBoosterButtonClick("teleport")
		boosterManager.maybeUseBooster(tile1)
		boosterManager.clear()
		const result = boosterManager.maybeUseBooster(tile2)

		expect(result).toEqual({ isUsed: false, actResult: null })
	})

	it.each([
		{
			name: "bomb",
			tilesPositions: [{ column: 0, row: 0 }],
		},
		{
			name: "teleport",
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
			],
		},
	] as const)("dont activate empty booster", ({ name, tilesPositions }) => {
		const { boosterManager, fieldQueries, gameRules } = createSUT()
		const useCount = gameRules.BOOSTER_INITIAL_VALUE[name]
		const tryUseBooster = () => {
			boosterManager.onBoosterButtonClick(name)
			const tiles = tilesPositions.map(
				(position) => fieldQueries.getTileByPosition(position) as Tile
			)
			const results = tiles.map((tile) => boosterManager.maybeUseBooster(tile))
			return results.pop()
		}

		for (let i = 0; i < useCount; i++) {
			tryUseBooster()
		}
		boosterManager.onBoosterButtonClick(name)
		const result = tryUseBooster()

		expect(result).toEqual({ isUsed: false, actResult: null })
	})

	it("forgets selected tiles for the activated booster after clear", () => {
		const { boosterManager, fieldQueries } = createSUT()
		const tile1 = fieldQueries.getTileByPosition({ column: 0, row: 0 }) as Tile
		const tile2 = fieldQueries.getTileByPosition({ column: 0, row: 1 }) as Tile
		const tile3 = fieldQueries.getTileByPosition({ column: 1, row: 1 }) as Tile

		boosterManager.onBoosterButtonClick("teleport")
		boosterManager.maybeUseBooster(tile1)
		boosterManager.clear()
		boosterManager.onBoosterButtonClick("teleport")
		const result2 = boosterManager.maybeUseBooster(tile2)
		const result3 = boosterManager.maybeUseBooster(tile3)
		const swappedPositions = [...(result3.actResult?.swappedTiles ?? [])]
			.flat()
			.map((tile) => tile.getPosition())

		expect(result2).toEqual({ isUsed: true, actResult: null })
		expect(result3.isUsed).toBe(true)
		expect(new Set(swappedPositions)).toEqual(
			new Set([tile2.getPosition(), tile3.getPosition()])
		)
	})
})
