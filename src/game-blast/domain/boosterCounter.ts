import { Counter } from "../../helpers/counter"

export class BoosterCounter extends Counter {
	spend() {
		this.updateCurrentValue(-1)
	}

	get canBeUsed() {
		return !this.isTargetReached()
	}
}
