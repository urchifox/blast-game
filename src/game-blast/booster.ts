import { Progress } from "./progress"

export class Booster {
	private readonly progress: Progress
	private isActive = false

	constructor({
		updateCounter,
	}: {
		updateCounter: (currentValue: number) => void
	}) {
		this.progress = new Progress({
			updateCounter: ({ currentValue }) => updateCounter(currentValue),
		})
		this.progress.setTargetValue(0)
	}

	setCurrentValue(value: number) {
		this.progress.setCurrentValue(value)
	}

	use() {
		this.progress.addCurrentValue(-1)
		this.isActive = false
	}

	renderCounter() {
		this.progress.renderCounters()
	}

	clear() {
		this.progress.clear()
		this.isActive = false
	}

	tryActivate() {
		if (this.progress.isTargetReached()) {
			this.isActive = false
		}
		this.isActive = true
	}

	isActivated() {
		return this.isActive
	}
}
