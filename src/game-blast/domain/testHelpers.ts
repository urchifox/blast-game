import { IdGenerator, RandomizationFunction } from "../../helpers/random"
import { Field } from "./field"
import { FieldQueries } from "./fieldQueries"
import { GameRules } from "./gameRules"
import { Grid } from "./grid"
import { LevelGenerator } from "./levelGenerator"
import { TileProps } from "./tile"

export function createFieldComponentsStubbed({
	gridSize,
	tilesProps,
	randomizationFunction = createRandomizationFunctionStub(),
	createId = createIdGeneratorStub(),
}: {
	gridSize?: { columns: number; rows: number }
	tilesProps?: Set<TileProps>
	randomizationFunction?: RandomizationFunction
	createId?: IdGenerator
} = {}) {
	const grid = new Grid()
	if (gridSize !== undefined) {
		grid.createGrid(gridSize)
	}
	const getGridSnapshot = grid.getSnapshot.bind(grid)

	const field = new Field({
		getGridSnapshot,
		randomizationFunction,
		createId,
	})
	if (tilesProps !== undefined) {
		field.createInitialTiles(tilesProps)
	}

	const fieldQueries = new FieldQueries({ field, grid })

	return { grid, field, fieldQueries }
}

export function createLevelGeneratorStubbed({
	randomizationFunction,
	createId,
}: {
	randomizationFunction?: RandomizationFunction
	createId?: IdGenerator
}) {
	return new LevelGenerator({
		gameRules: new GameRules(),
		randomizationFunction:
			randomizationFunction ?? createRandomizationFunctionStub(),
		createId: createId ?? createIdGeneratorStub(),
	})
}

export function createRandomizationFunctionStub(
	result = 0
): RandomizationFunction {
	return () => result
}

export function createIdGeneratorStub(startId = 1): IdGenerator {
	let nextId = startId
	return () => String(nextId++)
}
