import { BoosterName } from "../domain/types"
import { BoosterCounter } from "../domain/boosterCounter"

export type BoosterCommonProps = {
	updateCounter: (currentValue: number) => void
	onActivationChange?: (boosterName: BoosterName, isActivated: boolean) => void
}

export type BoosterCustomProps = {
	name: BoosterName
	boosterCounter: BoosterCounter
}

export type BoosterProps = BoosterCommonProps & BoosterCustomProps

export class Booster {
	private readonly name: BoosterProps["name"]
	private readonly boosterCounter: BoosterProps["boosterCounter"]
	private readonly onActivationChange?: BoosterProps["onActivationChange"]
	private readonly updateCounter: BoosterProps["updateCounter"]

	private _isActivated = false

	constructor(props: BoosterProps) {
		this.name = props.name
		this.boosterCounter = props.boosterCounter
		this.onActivationChange = props.onActivationChange
		this.updateCounter = props.updateCounter
	}

	reset() {
		this.boosterCounter.reset()
		this.renderCounter()
	}

	spend() {
		this.boosterCounter.spend()
		this.renderCounter()
		this.setIsActivated(false)
	}

	private renderCounter() {
		this.updateCounter(this.boosterCounter.getCurrentValue())
	}

	clear() {
		this.boosterCounter.reset()
		this.setIsActivated(false)
	}

	tryActivate() {
		if (this.boosterCounter.canBeUsed) {
			this.setIsActivated(true)
		}
		return this.isActivated()
	}

	isActivated() {
		return this._isActivated
	}

	private setIsActivated(flag: boolean) {
		if (this._isActivated === flag) {
			return
		}
		this._isActivated = flag
		this.onActivationChange?.(this.name, flag)
	}
}
