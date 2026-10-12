import { Tile } from "../domain/tile"
import { AnimationsManager } from "./animationManager"
import { createDeferred } from "./testHelpers"

function createTile(): Tile {
	return new Tile({
		kind: "blue",
		id: "tile-1",
		position: { column: 0, row: 0 },
	})
}

async function isPending(promise: Promise<unknown>): Promise<boolean> {
	const pending = Symbol("pending")
	const result = await Promise.race([promise, Promise.resolve(pending)])
	return result === pending
}

describe("animation manager", () => {
	it("resolves immediately when the tile has no pending animation", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()

		await expect(
			animationsManager.waitForTileAnimations(tile)
		).resolves.toBeUndefined()
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

		const wait = animationsManager.waitForTileAnimations(tile)
		expect(await isPending(wait)).toBe(true)

		animation.resolve()
		await expect(wait).resolves.toBeUndefined()
	})

	it("resolves after all tile animations settle", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation1 = createDeferred()
		const animation2 = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation1.promise })
		animationsManager.setAnimation({ tile, promise: animation2.promise })

		const wait = animationsManager.waitForTileAnimations(tile)
		expect(await isPending(wait)).toBe(true)

		animation1.resolve()
		expect(await isPending(wait)).toBe(true)

		animation2.resolve()
		await expect(wait).resolves.toBeUndefined()
	})

	it("ignores animations that were created after the wait was created", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()

		const animation1 = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation1.promise })
		const wait1 = animationsManager.waitForTileAnimations(tile)
		expect(await isPending(wait1)).toBe(true)

		const animation2 = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation2.promise })

		animation1.resolve()
		await expect(wait1).resolves.toBeUndefined()

		const wait2 = animationsManager.waitForTileAnimations(tile)
		expect(await isPending(wait2)).toBe(true)
		animation2.resolve()
		await expect(wait2).resolves.toBeUndefined()
	})

	it("resolves when the tile's pending animation rejects", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation.promise })

		const wait = animationsManager.waitForTileAnimations(tile)
		expect(await isPending(wait)).toBe(true)

		animation.reject()
		await expect(wait).resolves.toBeUndefined()
	})

	it("resolves immediately if wait started after the animation settled", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation.promise })

		animation.resolve()
		await animation.promise

		await expect(
			animationsManager.waitForTileAnimations(tile)
		).resolves.toBeUndefined()
	})

	it("resolves the next wait immediately after clear", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation.promise })

		animationsManager.clear()

		await expect(
			animationsManager.waitForTileAnimations(tile)
		).resolves.toBeUndefined()
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
		await cleared.promise

		const wait = animationsManager.waitForTileAnimations(tile)
		expect(await isPending(wait)).toBe(true)

		registered.resolve()
		await expect(wait).resolves.toBeUndefined()
	})

	it("animations of different tiles settle independently", async () => {
		const animationsManager = new AnimationsManager()
		const tile1 = new Tile({
			kind: "blue",
			id: "tile-1",
			position: { column: 0, row: 0 },
		})
		const tile2 = new Tile({
			kind: "blue",
			id: "tile-2",
			position: { column: 1, row: 1 },
		})
		const animation1 = createDeferred()
		const animation2 = createDeferred()
		animationsManager.setAnimation({ tile: tile1, promise: animation1.promise })
		animationsManager.setAnimation({ tile: tile2, promise: animation2.promise })

		const wait1 = animationsManager.waitForTileAnimations(tile1)
		const wait2 = animationsManager.waitForTileAnimations(tile2)
		expect(await isPending(wait1)).toBe(true)
		expect(await isPending(wait2)).toBe(true)

		animation1.resolve()
		await expect(wait1).resolves.toBeUndefined()
		expect(await isPending(wait2)).toBe(true)
		animation2.resolve()
		await expect(wait2).resolves.toBeUndefined()
	})
})
