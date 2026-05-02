import { Progress } from "../helpers/progress"

export class Booster {
	private readonly progress: Progress
	private isActive = false
	private readonly onActiveChange?: (isActive: boolean) => void

	constructor({
		updateCounter,
		onActiveChange,
	}: {
		updateCounter: (currentValue: number) => void
		onActiveChange?: (isActive: boolean) => void
	}) {
		this.progress = new Progress({
			updateCounter: ({ currentValue }) => updateCounter(currentValue),
			isDirectionDown: true,
		})
		this.onActiveChange = onActiveChange
		this.progress.setTargetValue(0)
	}

	private setIsActive(value: boolean) {
		if (this.isActive === value) {
			return
		}
		this.isActive = value
		this.onActiveChange?.(value)
	}

	setCurrentValue(value: number) {
		this.progress.setCurrentValue(value)
	}

	use() {
		this.progress.addCurrentValue(-1)
		this.setIsActive(false)
	}

	renderCounter() {
		this.progress.renderCounters()
	}

	clear() {
		this.progress.clear()
		this.setIsActive(false)
	}

	tryActivate() {
		if (this.progress.isTargetReached()) {
			return
		}
		this.setIsActive(true)
	}

	isActivated() {
		return this.isActive
	}
}
