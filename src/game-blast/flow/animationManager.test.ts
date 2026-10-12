import { Tile, TilePosition } from "../domain/tile"
import { AnimationsManager } from "./animationManager"
import { createDeferred, flushPromises, trackSettled } from "./testHelpers"

function createTile({
	id = "tile-1",
	position = { column: 0, row: 0 },
}: { id?: string; position?: TilePosition } = {}): Tile {
	return new Tile({ kind: "blue", id, position })
}

beforeEach(() => {
	vi.useFakeTimers()
})

afterEach(() => {
	vi.useRealTimers()
})

describe("animation manager", () => {
	it("resolves immediately when the tile has no pending animation", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()

		const waiting = trackSettled(animationsManager.waitForTileAnimations(tile))
		await flushPromises()

		expect(waiting.isSettled).toBe(true)
	})

	it("returns the same animation promise that it received", () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createDeferred()

		const result = animationsManager.setAnimation({
			tile,
			promise: animation.promise,
		})

		expect(result).toBe(animation.promise)
	})

	it("resolves when the tile's pending animation settles", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation.promise })

		const waiting = trackSettled(animationsManager.waitForTileAnimations(tile))
		await flushPromises()
		expect(waiting.isSettled).toBe(false)

		animation.resolve()
		await flushPromises()
		expect(waiting.isSettled).toBe(true)
	})

	it("resolves after all tile animations settle", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation1 = createDeferred()
		const animation2 = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation1.promise })
		animationsManager.setAnimation({ tile, promise: animation2.promise })

		const waiting = trackSettled(animationsManager.waitForTileAnimations(tile))
		await flushPromises()
		expect(waiting.isSettled).toBe(false)

		animation1.resolve()
		await flushPromises()
		expect(waiting.isSettled).toBe(false)

		animation2.resolve()
		await flushPromises()
		expect(waiting.isSettled).toBe(true)
	})

	it("ignores animations that were created after the wait was created", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()

		const animation1 = createDeferred()
		const animation2 = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation1.promise })
		const waiting1 = trackSettled(animationsManager.waitForTileAnimations(tile))
		animationsManager.setAnimation({ tile, promise: animation2.promise })

		animation1.resolve()
		await flushPromises()
		expect(waiting1.isSettled).toBe(true)

		const waiting2 = trackSettled(animationsManager.waitForTileAnimations(tile))
		await flushPromises()
		expect(waiting2.isSettled).toBe(false)

		animation2.resolve()
		await flushPromises()
		expect(waiting2.isSettled).toBe(true)
	})

	it("resolves when the tile's pending animation rejects", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation.promise })

		const wait = animationsManager.waitForTileAnimations(tile)
		const waiting = trackSettled(wait)
		await flushPromises()
		expect(waiting.isSettled).toBe(false)

		animation.reject()
		await flushPromises()

		await expect(wait).resolves.toBeUndefined()
	})

	it("resolves immediately if wait started after the animation settled", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation.promise })
		animation.resolve()
		await flushPromises()

		const waiting = trackSettled(animationsManager.waitForTileAnimations(tile))
		await flushPromises()

		expect(waiting.isSettled).toBe(true)
	})

	it("resolves the next wait immediately after clear", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation.promise })

		animationsManager.clear()

		const waiting = trackSettled(animationsManager.waitForTileAnimations(tile))
		await flushPromises()
		expect(waiting.isSettled).toBe(true)
	})

	it("keeps an animation registered after clear when the cleared one settles", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const cleared = createDeferred()
		const registered = createDeferred()
		animationsManager.setAnimation({ tile, promise: cleared.promise })
		animationsManager.clear()
		animationsManager.setAnimation({ tile, promise: registered.promise })

		cleared.resolve()
		await flushPromises()

		const waiting = trackSettled(animationsManager.waitForTileAnimations(tile))
		await flushPromises()
		expect(waiting.isSettled).toBe(false)

		registered.resolve()
		await flushPromises()
		expect(waiting.isSettled).toBe(true)
	})

	it("animations of different tiles settle independently", async () => {
		const animationsManager = new AnimationsManager()
		const tile1 = createTile({ id: "tile-1", position: { column: 0, row: 0 } })
		const tile2 = createTile({ id: "tile-2", position: { column: 1, row: 1 } })
		const animation1 = createDeferred()
		const animation2 = createDeferred()
		animationsManager.setAnimation({ tile: tile1, promise: animation1.promise })
		animationsManager.setAnimation({ tile: tile2, promise: animation2.promise })

		const waiting1 = trackSettled(
			animationsManager.waitForTileAnimations(tile1)
		)
		const waiting2 = trackSettled(
			animationsManager.waitForTileAnimations(tile2)
		)
		await flushPromises()
		expect(waiting1.isSettled).toBe(false)
		expect(waiting2.isSettled).toBe(false)

		animation1.resolve()
		await flushPromises()
		expect(waiting1.isSettled).toBe(true)
		expect(waiting2.isSettled).toBe(false)

		animation2.resolve()
		await flushPromises()
		expect(waiting2.isSettled).toBe(true)
	})
})
