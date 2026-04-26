import { pickRandomItem } from "../helpers/random"
import { TILES_KINDS_NORMAL } from "./config"
import { GridSnapshot } from "./grid"
import { stringifyTilePosition } from "./helpers"
import { Tile, TilePosition, TilePositionString } from "./tile"

export class Field {
	private tilesMap = new Map<TilePositionString, Tile>()

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
				const tile = new Tile({ kind, position })
				const positionString = stringifyTilePosition(position)
				this.tilesMap.set(positionString, tile)
			}
		}
	}

	getTiles(): Array<Tile> {
		return Array.from(this.tilesMap.values())
	}

	clearTiles() {
		this.tilesMap.clear()
	}

	getTile(position: TilePosition) {
		const positionString = stringifyTilePosition(position)
		return this.tilesMap.get(positionString)
	}

	removeTile(position: TilePosition) {
		const positionString = stringifyTilePosition(position)
		this.tilesMap.delete(positionString)
	}
}
