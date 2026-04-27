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
		const column = this.tilesByColumns[position.column]
		const isPositionEmpty = column[position.row] === undefined
		if (isPositionEmpty) {
			column[position.row] = tile
		} else {
			column.unshift(tile)
		}
		return tile
	}
}
