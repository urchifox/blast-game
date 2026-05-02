import { Progress } from "../helpers/progress"

export type BoosterName = "bomb" | "teleport"

export class Booster {
	readonly name: BoosterName
	private readonly progress: Progress
	private isActive = false
	private readonly onActiveChange?: (
		boosterName: BoosterName,
		isActive: boolean
	) => void

	constructor({
		name,
		updateCounter,
		onActiveChange,
	}: {
		name: BoosterName
		updateCounter: (booster: BoosterName, currentValue: number) => void
		onActiveChange?: (boosterName: BoosterName, isActive: boolean) => void
	}) {
		this.name = name
		this.progress = new Progress({
			updateCounter: ({ currentValue }) =>
				updateCounter(this.name, currentValue),
			isDirectionDown: true,
		})
		this.onActiveChange = onActiveChange
		this.progress.setTargetValue(0)
	}

	private setIsActive(isActive: boolean) {
		if (this.isActive === isActive) {
			return
		}
		this.isActive = isActive
		this.onActiveChange?.(this.name, isActive)
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
