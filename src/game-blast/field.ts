import { shuffle } from "../helpers/array"
import { pickRandomItem } from "../helpers/random"
import { TILES_KINDS_NORMAL } from "./config"
import { GridSnapshot } from "./grid"
import { Tile, TileKind, TilePosition, TileSnapshot } from "./tile"

export class Field {
	private tilesByColumns: Array<Array<Tile | undefined>> = []

	private readonly getFieldSnapshot: () => GridSnapshot
	constructor({ getFieldSnapshot }: { getFieldSnapshot: () => GridSnapshot }) {
		this.getFieldSnapshot = getFieldSnapshot
	}

	generateTiles() {
		const { columns, rows } = this.getFieldSnapshot()

		for (let column = 0; column < columns; column++) {
			this.tilesByColumns[column] = []
			for (let row = 0; row < rows; row++) {
				const kind = pickRandomItem(TILES_KINDS_NORMAL)
				const position = { row, column }
				const tile = new Tile({ kind, position })
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
				const kind = pickRandomItem(TILES_KINDS_NORMAL)
				const row = rows - this.tilesByColumns[column].length - 1
				const position = { row, column }
				const tile = new Tile({ kind, position })
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
		const tile = new Tile({ kind, position })
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
		const tiles = new Set<Tile>()
		const positions = new Set<TilePosition>()

		for (const tile of tilesInColumn) {
			if (tile === undefined) {
				continue
			}
			tiles.add(tile)
			positions.add(tile.getPosition())
		}

		return { tiles, positions }
	}

	getTilesInRow(row: number) {
		const tiles = new Set<Tile>()
		const positions = new Set<TilePosition>()

		for (const tile of this.getTiles()) {
			if (tile === undefined || tile.getPosition().row !== row) {
				continue
			}
			tiles.add(tile)
			positions.add(tile.getPosition())
		}

		return { tiles, positions }
	}

	getTilesInRadius(position: TilePosition, radius: number) {
		const { columns, rows } = this.getFieldSnapshot()
		const { column: centerColumn, row: centerRow } = position
		const minColumn = Math.max(0, centerColumn - radius)
		const maxColumn = Math.min(columns - 1, centerColumn + radius)
		const minRow = Math.max(0, centerRow - radius)
		const maxRow = Math.min(rows - 1, centerRow + radius)

		const tiles = new Set<Tile>()
		const positions = new Set<TilePosition>()

		for (let column = minColumn; column <= maxColumn; column++) {
			for (let row = minRow; row <= maxRow; row++) {
				const tile = this.getTile({ column, row })
				if (tile === undefined) {
					continue
				}
				tiles.add(tile)
				positions.add({ column, row })
			}
		}

		return { tiles, positions }
	}

	shuffle() {
		const tiles = this.getTiles()
		const positions = this.getPositions(tiles)
		const shuffledPositions = shuffle(positions)
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
