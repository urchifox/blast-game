import { Tile, TilePosition, stringifyTilePosition } from "./tile"

export class TilesCollector {
	private readonly tiles = new Set<Tile>()
	private readonly stringifiedPositions = new Set<string>()
	private readonly positions = new Set<TilePosition>()

	private isPositionCollected(position: TilePosition) {
		const stringifiedPosition = stringifyTilePosition(position)
		return (
			this.stringifiedPositions.has(stringifiedPosition) ||
			this.positions.has(position)
		)
	}

	private isTileCollected(tile: Tile) {
		return this.tiles.has(tile) || this.isPositionCollected(tile.getPosition())
	}

	isCollected(tileOrPosition: Tile | TilePosition) {
		return tileOrPosition instanceof Tile
			? this.isTileCollected(tileOrPosition)
			: this.isPositionCollected(tileOrPosition)
	}

	collect(tile: Tile) {
		if (this.isTileCollected(tile)) {
			return
		}

		const position = tile.getPosition()
		const stringifiedPosition = stringifyTilePosition(position)

		this.tiles.add(tile)
		this.positions.add(position)
		this.stringifiedPositions.add(stringifiedPosition)
	}

	getCollection() {
		return {
			tiles: this.tiles,
			positions: this.positions,
		}
	}
}
