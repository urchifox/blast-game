import { Tile } from "../domain/tile"
import { AnimationsManager } from "./animationManager"

function createTile(): Tile {
	return new Tile({
		kind: "blue",
		id: "tile-1",
		position: { column: 0, row: 0 },
	})
}

function createDeferred(): { promise: Promise<void>; resolve: () => void } {
	let resolvePromise: () => void = () => undefined
	const promise = new Promise<void>((resolve) => {
		resolvePromise = resolve
	})
	return { promise, resolve: resolvePromise }
}

function flushMicrotasks(): Promise<void> {
	return Promise.resolve()
		.then(() => undefined)
		.then(() => undefined)
		.then(() => undefined)
}

describe("animation manager", () => {
	it("resolves immediately when the tile has no pending animation", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()

		await expect(
			animationsManager.waitForTileAnimations(tile)
		).resolves.toBeUndefined()
	})

	it("resolves when the tile's pending animation settles", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createDeferred()
		animationsManager.setAnimation({ tile, promise: animation.promise })

		let didSettle = false
		const wait = animationsManager.waitForTileAnimations(tile).then(() => {
			didSettle = true
		})

		await flushMicrotasks()
		expect(didSettle).toBe(false)

		animation.resolve()
		await wait
		expect(didSettle).toBe(true)
	})

	it("does not see an animation that has already settled", async () => {
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

		let didSettle = false
		const wait = animationsManager.waitForTileAnimations(tile).then(() => {
			didSettle = true
		})

		await flushMicrotasks()
		expect(didSettle).toBe(false)

		registered.resolve()
		await wait
		expect(didSettle).toBe(true)
	})
})
