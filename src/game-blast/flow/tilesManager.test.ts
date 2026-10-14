import { RandomizationFunction } from "../../helpers/random"
import { GameRules } from "../domain/gameRules"
import { TileProps } from "../domain/tile"
import {
	createFieldComponentsStubbed,
	createRandomizationFunctionStub,
	createTilesProps,
	getTileByPosition,
} from "../domain/testHelpers"
import { ActionManager } from "./actionManager"
import { createPresenterStubbed } from "./testHelpers"
import { tilesManagerFactory } from "./tilesManagerFactory"

const GRID_SIZE = { columns: 2, rows: 1 }

function createSUT({
	tilesProps,
	randomizationFunction = createRandomizationFunctionStub(),
}: {
	tilesProps: Array<TileProps>
	randomizationFunction?: RandomizationFunction
}) {
	const gameRules = new GameRules()

	const { grid, field, fieldQueries } = createFieldComponentsStubbed({
		randomizationFunction,
		gridSize: GRID_SIZE,
		tilesProps: new Set(tilesProps),
	})

	const presenter = createPresenterStubbed({
		field,
		fieldQueries,
		grid,
	})

	const actionManager = new ActionManager({
		presenter: presenter,
	})

	const tilesManager = tilesManagerFactory({
		fieldQueries: fieldQueries,
		actionManager: actionManager,
		gameRules: gameRules,
		randomizationFunction: randomizationFunction,
	})

	return {
		tilesManager,
		actionManager,
		fieldQueries,
	}
}

describe("TilesManager", () => {
	it("returns null without doing commands when the tile handler produces none", () => {
		const { tilesManager, actionManager, fieldQueries } = createSUT({
			tilesProps: createTilesProps({
				...GRID_SIZE,
				kinds: ["blue", "green"],
			}),
		})
		const doCommands = vi.spyOn(actionManager, "doCommands")
		const tile = getTileByPosition(fieldQueries, { row: 0, column: 0 })

		expect(tilesManager.onClick(tile)).toBeNull()
		expect(tilesManager.onRemove(tile)).toBeNull()
		expect(doCommands).not.toHaveBeenCalled()
	})
})
