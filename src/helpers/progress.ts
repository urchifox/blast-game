export class Progress {
	private currentValue = 0
	private targetValue = 0
	private readonly isDirectionDown: boolean
	private readonly updateCounter: (props: {
		currentValue: number
		targetValue: number
	}) => void

	constructor({
		updateCounter,
		isDirectionDown = false,
	}: {
		updateCounter: (props: {
			currentValue: number
			targetValue: number
		}) => void
		isDirectionDown?: boolean
	}) {
		this.updateCounter = updateCounter
		this.isDirectionDown = isDirectionDown
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
		return this.isDirectionDown
			? this.currentValue <= this.targetValue
			: this.currentValue >= this.targetValue
	}
}
