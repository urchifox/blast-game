import { Progress } from "../helpers/progress"

export type BoosterName = "bomb" | "teleport"

export type BoosterCommonProps = {
	updateCounter: (booster: BoosterName, currentValue: number) => void
	onActiveChange?: (boosterName: BoosterName, isActive: boolean) => void
}

export type BoosterCustomProps = {
	name: BoosterName
	initialValue: number
}

export type BoosterProps = BoosterCommonProps & BoosterCustomProps

export class Booster {
	readonly name: BoosterName
	private readonly initialValue: number
	private readonly progress: Progress
	private isActive = false
	private readonly onActiveChange?: BoosterCommonProps["onActiveChange"]

	constructor({
		name,
		initialValue,
		updateCounter,
		onActiveChange,
	}: BoosterProps) {
		this.name = name
		this.initialValue = initialValue
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

	setInitialValue() {
		this.setCurrentValue(this.initialValue)
	}

	setCurrentValue(value: number) {
		this.progress.setCurrentValue(value)
	}

	spend() {
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
