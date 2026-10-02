import { BoosterUseHandler } from "../domain/boosterUseHandler"
import { GameRules } from "../domain/gameRules"
import { createField } from "../domain/testHelpers"
import { Tile, TileProps } from "../domain/tile"
import { BoosterName } from "../domain/types"
import { ActResult } from "./actionManager"
import {
	createActionManagerStubbed,
	createBoosterHandlerStubbed,
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
	const { fieldQueries } = createField({
		columns: 3,
		rows: 3,
		tilesProps: new Set(tilesProps),
	})

	const actionManager = createActionManagerStubbed({})
	const gameRules = new GameRules()
	const boosterUseHandler = new BoosterUseHandler({
		gameRules,
		fieldQueries,
	})

	const boosterHandler = createBoosterHandlerStubbed({
		boosterUseHandler,
		gameRules,
		actionManager,
		name,
	})

	return { boosterHandler, fieldQueries }
}

describe("booster handling", () => {
	it.each([
		{
			name: "bomb",
			useCount: 0,
			expectedCanBeActivatedAfterUse: true,
			tilesPositions: [{ column: 0, row: 0 }],
		},
		{
			name: "bomb",
			useCount: 2,
			expectedCanBeActivatedAfterUse: true,
			tilesPositions: [{ column: 0, row: 0 }],
		},
		{
			name: "bomb",
			useCount: 3,
			expectedCanBeActivatedAfterUse: true,
			tilesPositions: [],
		},
		{
			name: "bomb",
			useCount: 3,
			expectedCanBeActivatedAfterUse: false,
			tilesPositions: [{ column: 0, row: 0 }],
		},
		{
			name: "teleport",
			useCount: 0,
			expectedCanBeActivatedAfterUse: true,
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
			],
		},
		{
			name: "teleport",
			useCount: 2,
			expectedCanBeActivatedAfterUse: true,
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
			],
		},
		{
			name: "teleport",
			useCount: 5,
			expectedCanBeActivatedAfterUse: true,
			tilesPositions: [{ column: 0, row: 0 }],
		},
		{
			name: "teleport",
			useCount: 5,
			expectedCanBeActivatedAfterUse: false,
			tilesPositions: [
				{ column: 0, row: 0 },
				{ column: 0, row: 1 },
			],
		},
	] as const)(
		"activation of booster $name returns $expectedCanBeActivatedAfterUse after $useCount uses with $tilesPositions.length tiles",
		({ name, useCount, expectedCanBeActivatedAfterUse, tilesPositions }) => {
			const { boosterHandler, fieldQueries } = createSUT(name)

			for (let i = 0; i < useCount; i++) {
				const isActivated = boosterHandler.tryActivate()
				if (!isActivated) {
					break
				}
				const tiles = tilesPositions.map((position) =>
					fieldQueries.getTileByPosition(position)
				) as Array<Tile>
				boosterHandler.maybeUse(tiles)
			}
			const canBeActivatedAfterUse = boosterHandler.tryActivate()
			boosterHandler.reset()
			const canBeActivatedAfterReset = boosterHandler.tryActivate()

			expect(canBeActivatedAfterUse).toBe(expectedCanBeActivatedAfterUse)
			expect(canBeActivatedAfterReset).toBe(true)
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
		"attemp of $name use with $tilesPositions.length tiles returns action result with expected positions",
		({ name, tilesPositions, expectedResult }) => {
			const { boosterHandler, fieldQueries } = createSUT(name)

			boosterHandler.tryActivate()
			const tiles = tilesPositions.map((position) =>
				fieldQueries.getTileByPosition(position)
			) as Array<Tile>
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
		"attempt of $name use without activation returns null",
		({ name, tilesPositions }) => {
			const { boosterHandler, fieldQueries } = createSUT(name)

			const tiles = tilesPositions.map((position) =>
				fieldQueries.getTileByPosition(position)
			) as Array<Tile>
			const result = boosterHandler.maybeUse(tiles)

			expect(result).toBeNull()
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
		"attemp of $name second use without activation returns null",
		({ name, tilesPositions }) => {
			const { boosterHandler, fieldQueries } = createSUT(name)

			boosterHandler.tryActivate()
			const tiles = tilesPositions.map((position) =>
				fieldQueries.getTileByPosition(position)
			) as Array<Tile>
			boosterHandler.maybeUse(tiles)
			const result = boosterHandler.maybeUse(tiles)

			expect(result).toBeNull()
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
		"attemp of $name use with $tilesPositions.length tiles returns null",
		({ name, tilesPositions }) => {
			const { boosterHandler, fieldQueries } = createSUT(name)

			boosterHandler.tryActivate()
			const tiles = tilesPositions.map((position) =>
				fieldQueries.getTileByPosition(position)
			) as Array<Tile>
			const result = boosterHandler.maybeUse(tiles)

			expect(result).toBeNull()
		}
	)
})
