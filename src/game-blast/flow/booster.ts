import { BoosterCounter } from "../domain/boosterCounter"
import { BoosterUIContract } from "../types"

export type BoosterCommonProps = {
	boosterUI: BoosterUIContract
}

export type BoosterCustomProps = {
	boosterCounter: BoosterCounter
}

export type BoosterProps = BoosterCommonProps & BoosterCustomProps

export class Booster {
	private readonly boosterCounter: BoosterProps["boosterCounter"]
	private readonly boosterUI: BoosterProps["boosterUI"]

	private _isActivated = false

	constructor(props: BoosterProps) {
		this.boosterCounter = props.boosterCounter
		this.boosterUI = props.boosterUI
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
		this.boosterUI.updateBoosterCounter(this.boosterCounter.getCurrentValue())
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
		this.boosterUI.toggleBoosterButtonActive(flag)
	}
}
