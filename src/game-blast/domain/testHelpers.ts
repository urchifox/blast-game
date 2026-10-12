import { IdGenerator, RandomizationFunction } from "../../helpers/random"
import { fieldComponentsFactory } from "./fieldComponentsFactory"
import { FieldQueries } from "./fieldQueries"
import { GameRules } from "./gameRules"
import { LevelGenerator } from "./levelGenerator"
import {
	stringifyTilePosition,
	Tile,
	TileKind,
	TilePosition,
	TileProps,
} from "./tile"

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
	const { grid, field, fieldQueries } = fieldComponentsFactory({
		randomizationFunction,
		createId,
	})

	if (gridSize !== undefined) {
		grid.createGrid(gridSize)
	}

	if (tilesProps !== undefined) {
		field.createInitialTiles(tilesProps)
	}

	return { grid, field, fieldQueries }
}

export function createLevelGeneratorStubbed({
	randomizationFunction,
	createId,
}: {
	randomizationFunction?: RandomizationFunction
	createId?: IdGenerator
} = {}) {
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

export function createTilesProps({
	columns,
	rows,
	kinds,
}: {
	columns: number
	rows: number
	kinds?: Array<TileKind>
}): Array<TileProps> {
	return Array.from({ length: columns * rows }, (_, index) => ({
		id: String(index + 1),
		kind: kinds?.[index] ?? "blue",
		position: { row: Math.floor(index / columns), column: index % columns },
	}))
}

export function getTileByPosition(
	fieldQueries: FieldQueries,
	position: TilePosition
): Tile {
	const tile = fieldQueries.getTileByPosition(position)
	if (tile === undefined) {
		throw new Error(`No tile at ${stringifyTilePosition(position)}`)
	}
	return tile
}

export function getTileById(fieldQueries: FieldQueries, id: string): Tile {
	const tile = fieldQueries.getTileById(id)
	if (tile === undefined) {
		throw new Error(`No tile with id ${id}`)
	}
	return tile
}
