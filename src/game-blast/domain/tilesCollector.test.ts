import { Tile } from "./tile"
import { TilesCollector } from "./tilesCollector"

describe("TilesCollector", () => {
	it("collects only unique tiles with unique positions", () => {
		const tilesCollector = new TilesCollector()
		const tile1 = new Tile({
			id: "1",
			kind: "blue",
			position: { row: 0, column: 0 },
		})
		const tile2 = new Tile({
			id: "2",
			kind: "red",
			position: { row: 0, column: 0 },
		})
		const tile3 = new Tile({
			id: "3",
			kind: "yellow",
			position: { row: 0, column: 1 },
		})

		tilesCollector.collect(tile1)
		tilesCollector.collect(tile2)
		tilesCollector.collect(tile1)
		tilesCollector.collect(tile3)

		const collection = tilesCollector.getCollection()
		expect(collection.tiles).toEqual(new Set([tile1, tile3]))
		expect(collection.positions).toEqual(
			new Set([
				{ row: 0, column: 0 },
				{ row: 0, column: 1 },
			])
		)
	})

	it("checks if a tile is collected", () => {
		const tilesCollector = new TilesCollector()
		const tile = new Tile({
			id: "1",
			kind: "blue",
			position: { row: 0, column: 0 },
		})

		tilesCollector.collect(tile)

		expect(tilesCollector.isCollected(tile)).toBe(true)
		expect(tilesCollector.isCollected({ row: 0, column: 0 })).toBe(true)
	})
})
