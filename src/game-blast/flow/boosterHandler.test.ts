import { BoosterUseHandler } from "../domain/boosterUseHandler"
import { GameRules } from "../domain/gameRules"
import { createFieldComponentsStubbed } from "../domain/testHelpers"
import { Tile, TileProps } from "../domain/tile"
import { BoosterName } from "../domain/types"
import { ActResult } from "./actionManager"
import {
	createActionManagerStubbed,
	createBoosterHandlerStubbed,
	createBoosterUIStub,
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

function createSUT(name: BoosterName) {
	const { fieldQueries } = createFieldComponentsStubbed({
		gridSize: { columns: 3, rows: 3 },
		tilesProps: new Set(tilesProps),
	})

	const actionManager = createActionManagerStubbed({})
	const gameRules = new GameRules()
	const boosterUseHandler = new BoosterUseHandler({
		gameRules,
		fieldQueries,
	})
	const boosterUI = createBoosterUIStub()

	const boosterHandler = createBoosterHandlerStubbed({
		boosterUseHandler,
		gameRules,
		actionManager,
		name,
		boosterUI,
	})

	return { boosterHandler, fieldQueries, boosterUI }
}

describe("booster handling", () => {
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
		"updates counter and button state after use $name booster",
		({ name, tilesPositions }) => {
			const { boosterHandler, fieldQueries, boosterUI } = createSUT(name)
			const tiles = tilesPositions.map((position) =>
				fieldQueries.getTileByPosition(position)
			) as Array<Tile>
			const updateBoosterCounterSpy = vi.spyOn(
				boosterUI,
				"updateBoosterCounter"
			)
			const toggleBoosterButtonActiveSpy = vi.spyOn(
				boosterUI,
				"toggleBoosterButtonActive"
			)

			boosterHandler.tryActivate()
			boosterHandler.maybeUse(tiles)

			expect(updateBoosterCounterSpy).toHaveBeenCalledOnce()
			expect(toggleBoosterButtonActiveSpy).toHaveBeenCalledTimes(2)
		}
	)

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
		"returns expected action result when uses $name booster",
		({ name, tilesPositions, expectedResult }) => {
			const { boosterHandler, fieldQueries } = createSUT(name)
			const tiles = tilesPositions.map((position) =>
				fieldQueries.getTileByPosition(position)
			) as Array<Tile>

			boosterHandler.tryActivate()
			const result = boosterHandler.maybeUse(tiles) as ActResult
			const { addedTiles, removedTiles, selectedTiles, swappedTiles } = result
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
			expectedUseCount: 3,
			tilesPositions: [{ column: 0, row: 0 }],
		},
		{
			name: "teleport",
			expectedUseCount: 5,
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
			],
		},
	] as const)(
		"booster $name can be used $expectedUseCount times, after that doesn't activate",
		({ name, expectedUseCount, tilesPositions }) => {
			const { boosterHandler, fieldQueries, boosterUI } = createSUT(name)
			const updateBoosterCounterSpy = vi.spyOn(
				boosterUI,
				"updateBoosterCounter"
			)
			const toggleBoosterButtonActiveSpy = vi.spyOn(
				boosterUI,
				"toggleBoosterButtonActive"
			)
			const tryUseBooster = () => {
				const isActivated = boosterHandler.tryActivate()
				const tiles = tilesPositions.map((position) =>
					fieldQueries.getTileByPosition(position)
				) as Array<Tile>
				const result = boosterHandler.maybeUse(tiles)
				return { isActivated, result }
			}

			for (let i = 0; i < expectedUseCount; i++) {
				tryUseBooster()
			}
			const { isActivated, result } = tryUseBooster()

			expect(isActivated).toBe(false)
			expect(result).toBeNull()
			expect(updateBoosterCounterSpy).toHaveBeenCalledTimes(expectedUseCount)
			expect(toggleBoosterButtonActiveSpy).toHaveBeenCalledTimes(
				expectedUseCount * 2
			)
		}
	)

	it.each([
		{
			name: "bomb",
			useCount: 3,
			tilesPositions: [{ column: 0, row: 0 }],
		},
		{
			name: "teleport",
			useCount: 5,
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
			],
		},
	] as const)(
		"restores counter and deactivates after reset of booster $name",
		({ name, tilesPositions, useCount }) => {
			const { boosterHandler, fieldQueries, boosterUI } = createSUT(name)
			const updateBoosterCounterSpy = vi.spyOn(
				boosterUI,
				"updateBoosterCounter"
			)
			const toggleBoosterButtonActiveSpy = vi.spyOn(
				boosterUI,
				"toggleBoosterButtonActive"
			)

			let canBeActivated = true
			while (canBeActivated) {
				canBeActivated = boosterHandler.tryActivate()
				const tiles = tilesPositions.map((position) =>
					fieldQueries.getTileByPosition(position)
				) as Array<Tile>
				boosterHandler.maybeUse(tiles)
			}
			boosterHandler.reset()

			expect(updateBoosterCounterSpy).lastCalledWith(useCount)
			expect(toggleBoosterButtonActiveSpy).toHaveBeenCalledTimes(useCount * 2)
			expect(toggleBoosterButtonActiveSpy).toHaveBeenLastCalledWith(false)
			expect(boosterHandler.tryActivate()).toBe(true)
		}
	)

	it.each([
		{
			name: "bomb",
			useCount: 3,
			tilesPositions: [{ column: 0, row: 0 }],
		},
		{
			name: "teleport",
			useCount: 5,
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
			],
		},
	] as const)(
		"restores counter and deactivates after clear of booster $name",
		({ name, tilesPositions, useCount }) => {
			const { boosterHandler, fieldQueries, boosterUI } = createSUT(name)
			const updateBoosterCounterSpy = vi.spyOn(
				boosterUI,
				"updateBoosterCounter"
			)
			const toggleBoosterButtonActiveSpy = vi.spyOn(
				boosterUI,
				"toggleBoosterButtonActive"
			)

			let canBeActivated = true
			while (canBeActivated) {
				canBeActivated = boosterHandler.tryActivate()
				const tiles = tilesPositions.map((position) =>
					fieldQueries.getTileByPosition(position)
				) as Array<Tile>
				boosterHandler.maybeUse(tiles)
			}
			boosterHandler.clear()

			expect(updateBoosterCounterSpy).lastCalledWith(useCount)
			expect(toggleBoosterButtonActiveSpy).toHaveBeenCalledTimes(useCount * 2)
			expect(toggleBoosterButtonActiveSpy).toHaveBeenLastCalledWith(false)
			expect(boosterHandler.tryActivate()).toBe(true)
		}
	)

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
		"dont use booster $name second time without activation",
		({ name, tilesPositions }) => {
			const { boosterHandler, fieldQueries, boosterUI } = createSUT(name)
			const updateBoosterCounterSpy = vi.spyOn(
				boosterUI,
				"updateBoosterCounter"
			)
			const toggleBoosterButtonActiveSpy = vi.spyOn(
				boosterUI,
				"toggleBoosterButtonActive"
			)

			boosterHandler.tryActivate()
			const tiles = tilesPositions.map((position) =>
				fieldQueries.getTileByPosition(position)
			) as Array<Tile>
			boosterHandler.maybeUse(tiles)
			const result = boosterHandler.maybeUse(tiles)

			expect(result).toBeNull()
			expect(updateBoosterCounterSpy).toHaveBeenCalledOnce()
			expect(toggleBoosterButtonActiveSpy).toHaveBeenCalledTimes(2)
			expect(toggleBoosterButtonActiveSpy.mock.calls[0][0]).toBe(true)
			expect(toggleBoosterButtonActiveSpy.mock.calls[1][0]).toBe(false)
		}
	)

	it.each([
		{
			name: "bomb",
			tilesPositions: [],
		},
		{
			name: "teleport",
			tilesPositions: [],
		},
		{
			name: "teleport",
			tilesPositions: [{ column: 0, row: 1 }],
		},
	] as const)(
		"dont use booster $name with wrong tiles number",
		({ name, tilesPositions }) => {
			const { boosterHandler, fieldQueries, boosterUI } = createSUT(name)
			const updateBoosterCounterSpy = vi.spyOn(
				boosterUI,
				"updateBoosterCounter"
			)
			const toggleBoosterButtonActiveSpy = vi.spyOn(
				boosterUI,
				"toggleBoosterButtonActive"
			)

			boosterHandler.tryActivate()
			const tiles = tilesPositions.map((position) =>
				fieldQueries.getTileByPosition(position)
			) as Array<Tile>
			const result = boosterHandler.maybeUse(tiles)

			expect(result).toBeNull()
			expect(updateBoosterCounterSpy).not.toHaveBeenCalled()
			expect(toggleBoosterButtonActiveSpy).toHaveBeenCalledOnce()
			expect(toggleBoosterButtonActiveSpy.mock.calls[0][0]).toBe(true)
		}
	)
})
