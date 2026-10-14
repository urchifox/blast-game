import { RandomizationFunction } from "../../helpers/random"
import {
	createFieldComponentsStubbed,
	createRandomizationFunctionStub,
	createTilesProps,
	getTileById,
	getTileByPosition,
	getTilesByPositions,
} from "../domain/testHelpers"
import { AnimationsManager } from "./animationManager"
import { TILE_DELAY_BETWEEN_REMOVALS_MS } from "./animationRules"
import {
	createDeferredCalls,
	createPresenterStubbed,
	createRendererStub,
	flushPromises,
	trackSettled,
} from "./testHelpers"

const GRID_SIZE = { columns: 3, rows: 3 }
const tilesProps = createTilesProps({ ...GRID_SIZE })

function createSUT({
	randomizationFunction = createRandomizationFunctionStub(),
}: {
	randomizationFunction?: RandomizationFunction
} = {}) {
	const { grid, field, fieldQueries, firstNewTileId } =
		createFieldComponentsStubbed({
			randomizationFunction,
			gridSize: GRID_SIZE,
			tilesProps: new Set(tilesProps),
		})

	const renderer = createRendererStub()
	const animationsManager = new AnimationsManager()

	const presenter = createPresenterStubbed({
		field,
		fieldQueries,
		grid,
		renderer,
		animationsManager,
	})

	return {
		presenter,
		renderer,
		animationsManager,
		field,
		fieldQueries,
		firstNewTileId,
	}
}

describe("Presenter", () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	describe("removeTilesFromCenter", () => {
		it("locks tiles and removes them from the field immediately", () => {
			const { presenter, renderer, fieldQueries } = createSUT()
			const removeTileSpy = vi
				.spyOn(renderer, "removeTile")
				.mockImplementation(createDeferredCalls().next)
			const positions = [
				{ row: 0, column: 0 },
				{ row: 1, column: 1 },
			]
			const tiles = getTilesByPositions(fieldQueries, positions)

			void presenter.removeTilesFromCenter(new Set(tiles), positions[0])

			for (const tile of tiles) {
				expect(tile.isLocked()).toBe(true)
			}
			for (const position of positions) {
				expect(fieldQueries.getTileByPosition(position)).toBeUndefined()
			}
			expect(removeTileSpy).not.toHaveBeenCalled()
		})

		it("removes tiles in order of distance from the center with fixed delay between removals", async () => {
			const { presenter, renderer, fieldQueries } = createSUT()
			const removeTileSpy = vi.spyOn(renderer, "removeTile")
			const tiles = getTilesByPositions(fieldQueries, [
				{ row: 2, column: 2 },
				{ row: 0, column: 2 },
				{ row: 1, column: 1 },
				{ row: 0, column: 0 },
			])
			const getRemovedIds = () => removeTileSpy.mock.calls.map(([id]) => id)

			void presenter.removeTilesFromCenter(new Set(tiles), {
				row: 0,
				column: 0,
			})

			await flushPromises()
			expect(getRemovedIds()).toEqual(["1"])

			await vi.advanceTimersByTimeAsync(TILE_DELAY_BETWEEN_REMOVALS_MS - 1)
			expect(getRemovedIds()).toEqual(["1"])

			await vi.advanceTimersByTimeAsync(1)
			expect(getRemovedIds()).toEqual(["1", "5"])

			await vi.advanceTimersByTimeAsync(TILE_DELAY_BETWEEN_REMOVALS_MS - 1)
			expect(getRemovedIds()).toEqual(["1", "5"])

			await vi.advanceTimersByTimeAsync(1)
			expect(getRemovedIds()).toEqual(["1", "5", "9", "3"])
		})

		it("unlocks each tile after its own removal animation and resolves after all of them", async () => {
			const { presenter, renderer, fieldQueries } = createSUT()
			const removals = createDeferredCalls()
			vi.spyOn(renderer, "removeTile").mockImplementation(removals.next)
			const centerTile = getTileByPosition(fieldQueries, { row: 0, column: 0 })
			const farTile = getTileByPosition(fieldQueries, { row: 1, column: 1 })

			const removing = trackSettled(
				presenter.removeTilesFromCenter(
					new Set([centerTile, farTile]),
					centerTile.getPosition()
				)
			)
			await vi.advanceTimersByTimeAsync(TILE_DELAY_BETWEEN_REMOVALS_MS)
			expect(removals.calls).toHaveLength(2)
			expect(centerTile.isLocked()).toBe(true)
			expect(farTile.isLocked()).toBe(true)

			removals.calls[1].resolve()
			await flushPromises()
			expect(farTile.isLocked()).toBe(false)
			expect(centerTile.isLocked()).toBe(true)
			expect(removing.isSettled).toBe(false)

			removals.calls[0].resolve()
			await flushPromises()
			expect(centerTile.isLocked()).toBe(false)
			expect(removing.isSettled).toBe(true)
		})
	})

	describe("processRemovedTiles", () => {
		it("locks moved and new tiles immediately", () => {
			const { presenter, renderer, fieldQueries } = createSUT()
			vi.spyOn(renderer, "fallTilesToCurrentPositions").mockImplementation(
				createDeferredCalls().next
			)
			const removedTile = getTileByPosition(fieldQueries, { row: 2, column: 1 })
			void presenter.removeTilesFromCenter(
				new Set([removedTile]),
				removedTile.getPosition()
			)

			void presenter.processRemovedTiles(new Set([removedTile]))

			for (const row of [0, 1, 2]) {
				expect(
					getTileByPosition(fieldQueries, { row, column: 1 }).isLocked()
				).toBe(true)
			}
		})

		it("starts the fall of a column only after the removal animations in that column finish", async () => {
			const { presenter, renderer, fieldQueries } = createSUT()
			const removals = createDeferredCalls()
			vi.spyOn(renderer, "removeTile").mockImplementation(removals.next)
			const fallSpy = vi.spyOn(renderer, "fallTilesToCurrentPositions")
			const column0Tile = getTileByPosition(fieldQueries, { row: 2, column: 0 })
			const column2Tile = getTileByPosition(fieldQueries, { row: 2, column: 2 })
			const removedTiles = new Set([column0Tile, column2Tile])
			const getFallenIds = (callIndex: number) =>
				fallSpy.mock.calls[callIndex][0].tilesSnapshots.map(({ id }) => id)

			void presenter.removeTilesFromCenter(
				removedTiles,
				column0Tile.getPosition()
			)
			await vi.advanceTimersByTimeAsync(2 * TILE_DELAY_BETWEEN_REMOVALS_MS)
			expect(removals.calls).toHaveLength(2)

			void presenter.processRemovedTiles(removedTiles)
			await flushPromises()
			expect(fallSpy).not.toHaveBeenCalled()

			removals.calls[1].resolve()
			await flushPromises()
			expect(fallSpy).toHaveBeenCalledTimes(1)
			expect(getFallenIds(0)).toEqual(["6", "3"])

			removals.calls[0].resolve()
			await flushPromises()
			expect(fallSpy).toHaveBeenCalledTimes(2)
			expect(getFallenIds(1)).toEqual(["4", "1"])
		})

		it("renders new tiles after the fall finishes and unlocks each group after its own animation", async () => {
			const { presenter, renderer, fieldQueries, firstNewTileId } = createSUT()
			const falls = createDeferredCalls()
			const renders = createDeferredCalls()
			vi.spyOn(renderer, "fallTilesToCurrentPositions").mockImplementation(
				falls.next
			)
			const renderTilesSpy = vi
				.spyOn(renderer, "renderTiles")
				.mockImplementation(renders.next)
			const removedTile = getTileByPosition(fieldQueries, { row: 2, column: 1 })
			const movedTiles = [
				getTileByPosition(fieldQueries, { row: 0, column: 1 }),
				getTileByPosition(fieldQueries, { row: 1, column: 1 }),
			]

			const removing = presenter.removeTilesFromCenter(
				new Set([removedTile]),
				removedTile.getPosition()
			)
			await flushPromises()
			await removing

			const processing = trackSettled(
				presenter.processRemovedTiles(new Set([removedTile]))
			)
			await flushPromises()
			const newTile = getTileById(fieldQueries, String(firstNewTileId))
			expect(falls.calls).toHaveLength(1)
			expect(renderTilesSpy).not.toHaveBeenCalled()

			falls.calls[0].resolve()
			await flushPromises()
			for (const tile of movedTiles) {
				expect(tile.isLocked()).toBe(false)
			}
			expect(newTile.isLocked()).toBe(true)
			expect(renderTilesSpy).toHaveBeenCalledOnce()
			expect(renderTilesSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					tilesSnapshots: [
						expect.objectContaining({
							id: String(firstNewTileId),
							row: 0,
							column: 1,
						}),
					],
					isAppearOnDefaultPosition: true,
				})
			)
			expect(processing.isSettled).toBe(false)

			renders.calls[0].resolve()
			await flushPromises()
			expect(newTile.isLocked()).toBe(false)
			expect(processing.isSettled).toBe(true)
		})
	})

	describe("swapTiles", () => {
		it("locks both tiles and swaps them in the field immediately", () => {
			const { presenter, renderer, fieldQueries } = createSUT()
			const selectTileSpy = vi
				.spyOn(renderer, "selectTile")
				.mockImplementation(createDeferredCalls().next)
			const tile1 = getTileByPosition(fieldQueries, { row: 0, column: 0 })
			const tile2 = getTileByPosition(fieldQueries, { row: 0, column: 1 })

			void presenter.swapTiles(tile1, tile2)

			expect(tile1.isLocked()).toBe(true)
			expect(tile2.isLocked()).toBe(true)
			expect(getTileByPosition(fieldQueries, { row: 0, column: 0 })).toBe(tile2)
			expect(getTileByPosition(fieldQueries, { row: 0, column: 1 })).toBe(tile1)
			expect(selectTileSpy).toHaveBeenCalledWith(
				expect.objectContaining({ tileSnapshot: tile2.getSnapshot() })
			)
		})

		it("unlocks both tiles only after the select, swap and unselect chain finishes", async () => {
			const { presenter, renderer, fieldQueries } = createSUT()
			const selects = createDeferredCalls()
			const swaps = createDeferredCalls()
			const unselects = createDeferredCalls()
			vi.spyOn(renderer, "selectTile").mockImplementation(selects.next)
			const swapTilesSpy = vi
				.spyOn(renderer, "swapTiles")
				.mockImplementation(swaps.next)
			const unselectTileSpy = vi
				.spyOn(renderer, "unselectTile")
				.mockImplementation(unselects.next)
			const tile1 = getTileByPosition(fieldQueries, { row: 0, column: 0 })
			const tile2 = getTileByPosition(fieldQueries, { row: 0, column: 1 })
			const expectLocked = (isLocked: boolean) => {
				expect(tile1.isLocked()).toBe(isLocked)
				expect(tile2.isLocked()).toBe(isLocked)
			}

			const swapping = trackSettled(presenter.swapTiles(tile1, tile2))
			await flushPromises()
			expect(swapTilesSpy).not.toHaveBeenCalled()
			expectLocked(true)

			selects.calls[0].resolve()
			await flushPromises()
			expect(swapTilesSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					tilesSnapshots: [tile1.getSnapshot(), tile2.getSnapshot()],
				})
			)
			expect(unselectTileSpy).not.toHaveBeenCalled()
			expectLocked(true)

			swaps.calls[0].resolve()
			await flushPromises()
			expect(unselectTileSpy).toHaveBeenCalledTimes(2)
			expectLocked(true)

			unselects.calls[0].resolve()
			await flushPromises()
			expectLocked(true)
			expect(swapping.isSettled).toBe(false)

			unselects.calls[1].resolve()
			await flushPromises()
			expectLocked(false)
			expect(swapping.isSettled).toBe(true)
		})
	})

	describe("shuffleField", () => {
		it("locks all tiles until the shuffle animation finishes", async () => {
			const { presenter, renderer, fieldQueries } = createSUT()
			const shuffles = createDeferredCalls()
			const shuffleTilesSpy = vi
				.spyOn(renderer, "shuffleTiles")
				.mockImplementation(shuffles.next)
			const tiles = fieldQueries.getTiles()

			const shuffling = trackSettled(presenter.shuffleField())

			for (const tile of tiles) {
				expect(tile.isLocked()).toBe(true)
			}
			expect(shuffleTilesSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					tilesSnapshots: expect.arrayContaining(
						tiles.map((tile) => tile.getSnapshot())
					),
				})
			)

			await flushPromises()
			for (const tile of tiles) {
				expect(tile.isLocked()).toBe(true)
			}

			shuffles.calls[0].resolve()
			await flushPromises()
			for (const tile of tiles) {
				expect(tile.isLocked()).toBe(false)
			}
			expect(shuffling.isSettled).toBe(true)
		})
	})

	describe("when a renderer animation rejects", () => {
		const error = new Error("animation failed")

		it("removeTilesFromCenter still unlocks the tiles and resolves", async () => {
			const { presenter, renderer, fieldQueries } = createSUT()
			vi.spyOn(renderer, "removeTile").mockRejectedValue(error)
			const tile = getTileByPosition(fieldQueries, { row: 0, column: 0 })

			const removing = presenter.removeTilesFromCenter(
				new Set([tile]),
				tile.getPosition()
			)
			await flushPromises()

			await expect(removing).resolves.toBeUndefined()
			expect(tile.isLocked()).toBe(false)
		})

		it("processRemovedTiles still unlocks moved tiles and renders new tiles when the fall rejects", async () => {
			const { presenter, renderer, fieldQueries, firstNewTileId } = createSUT()
			vi.spyOn(renderer, "fallTilesToCurrentPositions").mockRejectedValue(error)
			const renderTilesSpy = vi.spyOn(renderer, "renderTiles")
			const removedTile = getTileByPosition(fieldQueries, { row: 2, column: 1 })
			const movedTiles = [
				getTileByPosition(fieldQueries, { row: 0, column: 1 }),
				getTileByPosition(fieldQueries, { row: 1, column: 1 }),
			]
			const removing = presenter.removeTilesFromCenter(
				new Set([removedTile]),
				removedTile.getPosition()
			)
			await flushPromises()
			await removing

			const processing = presenter.processRemovedTiles(new Set([removedTile]))
			await flushPromises()

			await expect(processing).resolves.toBeUndefined()
			for (const tile of movedTiles) {
				expect(tile.isLocked()).toBe(false)
			}
			expect(renderTilesSpy).toHaveBeenCalledOnce()
			expect(getTileById(fieldQueries, String(firstNewTileId)).isLocked()).toBe(
				false
			)
		})

		it("processRemovedTiles still unlocks new tiles when their render rejects", async () => {
			const { presenter, renderer, fieldQueries, firstNewTileId } = createSUT()
			vi.spyOn(renderer, "renderTiles").mockRejectedValue(error)
			const removedTile = getTileByPosition(fieldQueries, { row: 2, column: 1 })
			const removing = presenter.removeTilesFromCenter(
				new Set([removedTile]),
				removedTile.getPosition()
			)
			await flushPromises()
			await removing

			const processing = presenter.processRemovedTiles(new Set([removedTile]))
			await flushPromises()

			await expect(processing).resolves.toBeUndefined()
			expect(getTileById(fieldQueries, String(firstNewTileId)).isLocked()).toBe(
				false
			)
		})

		it("swapTiles still unlocks both tiles and skips the rest of the chain", async () => {
			const { presenter, renderer, fieldQueries } = createSUT()
			vi.spyOn(renderer, "selectTile").mockRejectedValue(error)
			const swapTilesSpy = vi.spyOn(renderer, "swapTiles")
			const tile1 = getTileByPosition(fieldQueries, { row: 0, column: 0 })
			const tile2 = getTileByPosition(fieldQueries, { row: 0, column: 1 })

			const swapping = presenter.swapTiles(tile1, tile2)
			await flushPromises()

			await expect(swapping).resolves.toBeUndefined()
			expect(tile1.isLocked()).toBe(false)
			expect(tile2.isLocked()).toBe(false)
			expect(swapTilesSpy).not.toHaveBeenCalled()
		})

		it("shuffleField still unlocks all tiles", async () => {
			const { presenter, renderer, fieldQueries } = createSUT()
			vi.spyOn(renderer, "shuffleTiles").mockRejectedValue(error)
			const tiles = fieldQueries.getTiles()

			const shuffling = presenter.shuffleField()
			await flushPromises()

			await expect(shuffling).resolves.toBeUndefined()
			for (const tile of tiles) {
				expect(tile.isLocked()).toBe(false)
			}
		})
	})

	describe("clear", () => {
		it("empties the animations manager", async () => {
			const { presenter, renderer, animationsManager, fieldQueries } =
				createSUT()
			vi.spyOn(renderer, "removeTile").mockImplementation(
				createDeferredCalls().next
			)
			const clearSpy = vi.spyOn(animationsManager, "clear")
			const tile = getTileByPosition(fieldQueries, { row: 0, column: 0 })
			void presenter.removeTilesFromCenter(new Set([tile]), tile.getPosition())
			await flushPromises()
			expect(animationsManager.animations.has(tile)).toBe(true)

			await presenter.clear()

			expect(clearSpy).toHaveBeenCalledOnce()
			expect(animationsManager.animations.size).toBe(0)
			const waiting = trackSettled(
				animationsManager.waitForTileAnimations(tile)
			)
			await flushPromises()
			expect(waiting.isSettled).toBe(true)
			expect(fieldQueries.getTiles()).toHaveLength(0)
		})
	})
})
