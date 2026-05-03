export class AnimationsManager {
	private animationPromises = new Set<Promise<void>>()

	clear() {
		this.animationPromises.clear()
	}

	async animate(promise: Promise<void>) {
		this.animationPromises.add(promise)
		try {
			await promise
		} finally {
			this.animationPromises.delete(promise)
		}
	}

	async waitAllAnimations(): Promise<void> {
		await Promise.allSettled(Array.from(this.animationPromises))
	}
}
