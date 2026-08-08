import { Progress } from "../../helpers/progress"
import { BoosterName } from "../types"

export type BoosterCommonProps = {
	updateCounter: (booster: BoosterName, currentValue: number) => void
	onActiveChange?: (boosterName: BoosterName, isActive: boolean) => void
	progress: Progress
}

export type BoosterCustomProps = {
	name: BoosterName
	initialValue: number
}

export type BoosterProps = BoosterCommonProps & BoosterCustomProps

export class Booster {
	private readonly name: BoosterProps["name"]
	private readonly initialValue: BoosterProps["initialValue"]
	private readonly onActiveChange?: BoosterProps["onActiveChange"]
	private readonly progress: BoosterProps["progress"]

	private isActive = false

	constructor(props: BoosterProps) {
		this.name = props.name
		this.initialValue = props.initialValue
		this.progress = props.progress
		this.onActiveChange = props.onActiveChange
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
