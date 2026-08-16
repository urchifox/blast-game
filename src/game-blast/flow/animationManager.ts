import { Tile } from "../domain/tile"

export class AnimationsManager {
	readonly animations = new Map<Tile, Array<Promise<void>>>()

	clear() {
		this.animations.clear()
	}

	setAnimation({ tile, promise }: { tile: Tile; promise: Promise<void> }) {
		const promises = this.animations.get(tile) ?? []
		promises.push(promise)
		this.animations.set(tile, promises)

		promise.finally(() => this.onPromiseResolve({ tile, promise }))

		return promise
	}

	private onPromiseResolve({
		tile,
		promise,
	}: {
		tile: Tile
		promise: Promise<void>
	}) {
		const promises = this.animations.get(tile) ?? []
		promises.splice(promises.indexOf(promise), 1)
		if (promises.length === 0) {
			this.animations.delete(tile)
		} else {
			this.animations.set(tile, promises)
		}
	}

	async waitForTileAnimations(tile: Tile) {
		const animations = this.animations.get(tile)
		if (!animations) {
			return Promise.resolve()
		}
		await Promise.allSettled(animations)
	}
}
