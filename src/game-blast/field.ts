import { pickRandomItem } from "../helpers/random"
import { TILES_KINDS_NORMAL } from "./config"
import { GridSnapshot } from "./grid"
import { Tile } from "./tile"

export class Field {
	private tiles: Array<Tile> = []

	private readonly getFieldSnapshot: () => GridSnapshot
	constructor({ getFieldSnapshot }: { getFieldSnapshot: () => GridSnapshot }) {
		this.getFieldSnapshot = getFieldSnapshot
	}

	generateTiles() {
		const { columns, rows } = this.getFieldSnapshot()

		for (let row = 0; row < rows; row++) {
			for (let column = 0; column < columns; column++) {
				const kind = pickRandomItem(TILES_KINDS_NORMAL)
				const position = { row, column }
				this.tiles.push(new Tile({ kind, position }))
			}
		}
	}

	getTiles(): Array<Tile> {
		return this.tiles
	}

	clearTiles() {
		this.tiles = []
	}
}
