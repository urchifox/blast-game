import { getShuffledArray } from "../../helpers/array"
import {
	IdGenerator,
	pickRandomItem,
	RandomizationFunction,
} from "../../helpers/random"
import { TILES_KINDS_NORMAL } from "./config"
import { GridSnapshot } from "./grid"
import { Tile, TileKind, TilePosition } from "./tile"

export type FieldProps = {
	getGridSnapshot: () => GridSnapshot
	randomizationFunction: RandomizationFunction
	createId: IdGenerator
}

export class Field {
	private readonly getGridSnapshot: FieldProps["getGridSnapshot"]
	private readonly randomizationFunction: FieldProps["randomizationFunction"]
	private readonly createId: FieldProps["createId"]

	private tilesByColumns: Array<Array<Tile | undefined>> = []

	constructor(props: FieldProps) {
		this.getGridSnapshot = props.getGridSnapshot
		this.randomizationFunction = props.randomizationFunction
		this.createId = props.createId
	}

	getTiles(): Array<Tile> {
		return this.tilesByColumns.flat().filter((tile) => tile !== undefined)
	}

	getPositions(tiles?: Array<Tile>): Array<TilePosition> {
		return (tiles ?? this.getTiles()).map((tile) => tile.getPosition())
	}

	generateTiles() {
		const { columns, rows } = this.getGridSnapshot()

		for (let column = 0; column < columns; column++) {
			this.tilesByColumns[column] = []
			for (let row = 0; row < rows; row++) {
				const kind = pickRandomItem(
					TILES_KINDS_NORMAL,
					this.randomizationFunction
				)
				const position = { row, column }
				const tile = new Tile({ kind, position, id: this.createId() })
				this.tilesByColumns[column].push(tile)
			}
		}
	}

	clearTiles() {
		this.tilesByColumns = []
	}

	removeTile(position: TilePosition) {
		this.tilesByColumns[position.column][position.row] = undefined
	}

	fillEmptyPositions(emptyPositions: Set<TilePosition>) {
		const columnsWithRemovedTiles = new Set<number>()
		for (const position of emptyPositions) {
			columnsWithRemovedTiles.add(position.column)
		}

		const { rows } = this.getGridSnapshot()

		const movedTiles = new Set<Tile>()
		const newTiles = new Set<Tile>()

		for (const column of columnsWithRemovedTiles) {
			this.tilesByColumns[column] = this.tilesByColumns[column].filter(
				(tile) => tile !== undefined
			)

			while (this.tilesByColumns[column].length < rows) {
				const kind = pickRandomItem(
					TILES_KINDS_NORMAL,
					this.randomizationFunction
				)
				const row = rows - this.tilesByColumns[column].length - 1
				const position = { row, column }
				const tile = new Tile({ kind, position, id: this.createId() })
				this.tilesByColumns[column].unshift(tile)
				newTiles.add(tile)
			}

			this.tilesByColumns[column].forEach((tile, row) => {
				if (tile === undefined) {
					return
				}
				if (tile.getPosition().row === row) {
					return
				}
				tile.setPosition({ row, column })
				movedTiles.add(tile)
			})
		}

		return { movedTiles, newTiles }
	}

	addTile({ kind, position }: { kind: TileKind; position: TilePosition }) {
		const tile = new Tile({ kind, position, id: this.createId() })
		return this.placeTile(tile)
	}

	placeTile(tile: Tile) {
		const position = tile.getPosition()
		const column = this.tilesByColumns[position.column]
		const isPositionEmpty = column[position.row] === undefined
		if (isPositionEmpty) {
			column[position.row] = tile
		} else {
			column.unshift(tile)
		}
		return tile
	}

	swapTiles(tile1: Tile, tile2: Tile) {
		const position1 = tile1.getPosition()
		const position2 = tile2.getPosition()
		this.removeTile(position1)
		this.removeTile(position2)
		tile1.setPosition(position2)
		tile2.setPosition(position1)
		this.placeTile(tile1)
		this.placeTile(tile2)
	}

	shuffle() {
		const tiles = this.getTiles()
		const positions = this.getPositions(tiles)
		const shuffledPositions = getShuffledArray(positions, {
			randomizationFunction: this.randomizationFunction,
		})
		for (const [index, tile] of tiles.entries()) {
			const position = shuffledPositions[index]
			tile.setPosition(position)
		}
		const { columns } = this.getGridSnapshot()
		this.tilesByColumns = Array.from({ length: columns }, () => [])

		for (const tile of tiles) {
			const { column, row } = tile.getPosition()
			this.tilesByColumns[column][row] = tile
		}
	}
}
