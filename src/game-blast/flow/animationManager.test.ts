import { Tile } from "../domain/tile"
import { AnimationsManager } from "./animationManager"

function createTile(): Tile {
	return new Tile({
		kind: "blue",
		id: "tile-1",
		position: { column: 0, row: 0 },
	})
}

function createAnimation() {
	let resolvePromise: () => void = () => undefined
	let rejectePromise: () => void = () => undefined
	const promise = new Promise<void>((resolve, reject) => {
		resolvePromise = resolve
		rejectePromise = reject
	})
	return { promise, resolve: resolvePromise, reject: rejectePromise }
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

	it("resolves when the tile's pending animation settles", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createAnimation()
		animationsManager.setAnimation({ tile, promise: animation.promise })

		const wait = animationsManager.waitForTileAnimations(tile)
		expect(await isPending(wait)).toBe(true)

		animation.resolve()
		await expect(wait).resolves.toBeUndefined()
	})

	it("resolves when the tile's pending animation rejects", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createAnimation()
		animationsManager.setAnimation({ tile, promise: animation.promise })

		const wait = animationsManager.waitForTileAnimations(tile)
		expect(await isPending(wait)).toBe(true)

		animation.reject()
		await expect(wait).resolves.toBeUndefined()
	})

	it("does not see an animation that has already settled", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const animation = createAnimation()
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
		const animation = createAnimation()
		animationsManager.setAnimation({ tile, promise: animation.promise })

		animationsManager.clear()

		await expect(
			animationsManager.waitForTileAnimations(tile)
		).resolves.toBeUndefined()
	})

	it("keeps an animation registered after clear when the cleared one settles", async () => {
		const animationsManager = new AnimationsManager()
		const tile = createTile()
		const cleared = createAnimation()
		const registered = createAnimation()

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
})
