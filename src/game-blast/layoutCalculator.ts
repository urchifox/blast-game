import {
	GAP_X,
	MAX_TILE_WIDTH,
	TILE_RATIO,
	GAP_Y,
	MAX_TILE_HEIGHT,
} from "./renderingRules"

export class LayoutCalculator {
	getSizes({
		columns,
		rows,
		containerWidth,
		containerHeight,
	}: {
		columns: number
		rows: number
		containerWidth: number
		containerHeight: number
	}) {
		let tileWidth = containerWidth / (columns + GAP_X * (columns - 1))
		tileWidth = Math.min(MAX_TILE_WIDTH, tileWidth)
		let tileHeight = tileWidth / TILE_RATIO

		let gridHeight = this.getHeight({ tileHeight, rows })

		if (gridHeight > containerHeight) {
			tileHeight = containerHeight / (rows + GAP_Y * (rows - 1))
			tileHeight = Math.min(MAX_TILE_HEIGHT, tileHeight)

			tileWidth = tileHeight * TILE_RATIO
			gridHeight = this.getHeight({ tileHeight, rows })
		}

		const gridWidth = this.getWidth({ tileWidth, columns })
		const tileGapX = GAP_X * tileWidth
		const tileGapY = GAP_Y * tileHeight

		return {
			gridWidth,
			gridHeight,
			tileWidth,
			tileHeight,
			tileGapX,
			tileGapY,
		}
	}

	private getWidth({
		tileWidth,
		columns,
	}: {
		tileWidth: number
		columns: number
	}) {
		return tileWidth * (columns + GAP_X * (columns - 1))
	}

	private getHeight({
		tileHeight,
		rows,
	}: {
		tileHeight: number
		rows: number
	}) {
		return tileHeight * (rows + GAP_Y * (rows - 1))
	}
}
