export class Progress {
	private currentValue = 0
	private targetValue = 0
	private readonly updateCounter: (props: {
		currentValue: number
		targetValue: number
	}) => void

	constructor({
		updateCounter,
	}: {
		updateCounter: (props: {
			currentValue: number
			targetValue: number
		}) => void
	}) {
		this.updateCounter = updateCounter
	}

	clear() {
		this.currentValue = 0
		this.targetValue = 0
	}

	renderCounters() {
		this.updateCounter({
			currentValue: this.currentValue,
			targetValue: this.targetValue,
		})
	}

	setCurrentValue(value: number) {
		this.currentValue = value
	}

	setTargetValue(value: number) {
		this.targetValue = value
	}

	addCurrentValue(value = 1) {
		this.currentValue += value
		this.updateCounter({
			currentValue: this.currentValue,
			targetValue: this.targetValue,
		})
	}

	isTargetReached() {
		return this.currentValue >= this.targetValue
	}
}
