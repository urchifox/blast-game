import { getShuffledArray } from "../../helpers/array"
import {
	IdGenerator,
	pickRandomItem,
	RandomizationFunction,
} from "../../helpers/random"
import { TILES_KINDS_NORMAL } from "./config"
import { GridSnapshot } from "./grid"
import { Tile, TileKind, TilePosition, TileSnapshot } from "./tile"
import { TilesCollector } from "./tilesCollector"

export type FieldProps = {
	getFieldSnapshot: () => GridSnapshot
	randomizationFunction: RandomizationFunction
	createId: IdGenerator
}

export class Field {
	private readonly getFieldSnapshot: FieldProps["getFieldSnapshot"]
	private readonly randomizationFunction: FieldProps["randomizationFunction"]
	private readonly createId: FieldProps["createId"]

	private tilesByColumns: Array<Array<Tile | undefined>> = []

	constructor(props: FieldProps) {
		this.getFieldSnapshot = props.getFieldSnapshot
		this.randomizationFunction = props.randomizationFunction
		this.createId = props.createId
	}

	generateTiles() {
		const { columns, rows } = this.getFieldSnapshot()

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

	getTiles(): Array<Tile> {
		return this.tilesByColumns.flat().filter((tile) => tile !== undefined)
	}

	getPositions(tiles?: Array<Tile>): Array<TilePosition> {
		return (tiles ?? this.getTiles()).map((tile) => tile.getPosition())
	}

	getTilesSnapshots(): Array<TileSnapshot> {
		return this.getTiles().map((tile) => tile.getSnapshot())
	}

	getTileById(id: string) {
		return this.getTiles().find((tile) => tile?.getId() === id)
	}

	clearTiles() {
		this.tilesByColumns = []
	}

	getTile(position: TilePosition) {
		return this.tilesByColumns[position.column][position.row]
	}

	removeTile(position: TilePosition) {
		this.tilesByColumns[position.column][position.row] = undefined
	}

	fillEmptyPositions(emptyPositions: Set<TilePosition>) {
		const columnsWithRemovedTiles = new Set<number>()
		for (const position of emptyPositions) {
			columnsWithRemovedTiles.add(position.column)
		}

		const { rows } = this.getFieldSnapshot()

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

	getTilesInColumn(column: number) {
		const tilesInColumn = this.tilesByColumns[column]

		const collector = new TilesCollector()

		for (const tile of tilesInColumn) {
			if (tile === undefined) {
				continue
			}
			collector.collect(tile)
		}

		return collector.getCollection()
	}

	getTilesInRow(row: number) {
		const collector = new TilesCollector()

		for (const tile of this.getTiles()) {
			if (tile === undefined || tile.getPosition().row !== row) {
				continue
			}
			collector.collect(tile)
		}

		return collector.getCollection()
	}

	getTilesInRadius(position: TilePosition, radius: number) {
		const { columns, rows } = this.getFieldSnapshot()
		const { column: centerColumn, row: centerRow } = position
		const minColumn = Math.max(0, centerColumn - radius)
		const maxColumn = Math.min(columns - 1, centerColumn + radius)
		const minRow = Math.max(0, centerRow - radius)
		const maxRow = Math.min(rows - 1, centerRow + radius)

		const collector = new TilesCollector()

		for (let column = minColumn; column <= maxColumn; column++) {
			for (let row = minRow; row <= maxRow; row++) {
				const tile = this.getTile({ column, row })
				if (tile === undefined) {
					continue
				}
				collector.collect(tile)
			}
		}

		return collector.getCollection()
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
		const { columns } = this.getFieldSnapshot()
		this.tilesByColumns = Array.from({ length: columns }, () => [])

		for (const tile of tiles) {
			const { column, row } = tile.getPosition()
			this.tilesByColumns[column][row] = tile
		}
	}
}
