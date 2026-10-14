import { IdGenerator, RandomizationFunction } from "../../helpers/random"
import { Field } from "./field"
import { fieldComponentsFactory } from "./fieldComponentsFactory"
import { FieldQueries } from "./fieldQueries"
import { GameRules } from "./gameRules"
import { Grid } from "./grid"
import { LevelGenerator } from "./levelGenerator"
import {
	stringifyTilePosition,
	Tile,
	TileKind,
	TilePosition,
	TileProps,
} from "./tile"

type CreateFieldComponentsStubbedProps = {
	gridSize?: { columns: number; rows: number }
	tilesProps?: Set<TileProps>
	randomizationFunction?: RandomizationFunction
	createId: IdGenerator
}
type FieldComponents = {
	grid: Grid
	field: Field
	fieldQueries: FieldQueries
}

export function createFieldComponentsStubbed(
	props?: CreateFieldComponentsStubbedProps
): FieldComponents & { firstNewTileId: undefined }
export function createFieldComponentsStubbed(
	// only calls without a generator can get firstNewTileId: number
	props?: Omit<CreateFieldComponentsStubbedProps, "createId"> & {
		createId?: undefined
	}
): FieldComponents & { firstNewTileId: number }
export function createFieldComponentsStubbed(
	props?: Partial<CreateFieldComponentsStubbedProps>
): FieldComponents & { firstNewTileId: number | undefined } {
	const {
		gridSize,
		tilesProps,
		randomizationFunction = createRandomizationFunctionStub(),
		createId,
	} = props ?? {}
	const firstNewTileId =
		createId === undefined ? getNextTileId(tilesProps) : undefined
	const { grid, field, fieldQueries } = fieldComponentsFactory({
		randomizationFunction,
		createId:
			createId === undefined ? createIdGeneratorStub(firstNewTileId) : createId,
	})

	if (gridSize !== undefined) {
		grid.createGrid(gridSize)
	}

	if (tilesProps !== undefined) {
		field.createInitialTiles(tilesProps)
	}

	return { grid, field, fieldQueries, firstNewTileId }
}

export function getNextTileId(tilesProps?: Set<TileProps>): number {
	const ids = [...(tilesProps ?? [])].map(({ id }) => Number(id))
	return Math.max(0, ...ids.filter(Number.isFinite)) + 1
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

export function getTilesByPositions(
	fieldQueries: FieldQueries,
	positions: ReadonlyArray<TilePosition>
): Array<Tile> {
	return positions.map((position) => getTileByPosition(fieldQueries, position))
}

export function getTileById(fieldQueries: FieldQueries, id: string): Tile {
	const tile = fieldQueries.getTileById(id)
	if (tile === undefined) {
		throw new Error(`No tile with id ${id}`)
	}
	return tile
}
