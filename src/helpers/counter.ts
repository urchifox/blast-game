export type ProgressProps = {
	startValue: number
	currentValue?: number
	endValue: number
}

export class Counter {
	private startValue = 0
	private currentValue = 0
	private endValue = 0

	constructor(props: ProgressProps) {
		this.currentValue = props.currentValue ?? props.startValue
		this.setInitialValues({
			startValue: props.startValue,
			targetValue: props.endValue,
		})
	}

	clear() {
		this.startValue = 0
		this.currentValue = 0
		this.endValue = 0
	}

	reset() {
		this.setCurrentValue(this.startValue)
	}

	setCurrentValue(value: number) {
		this.currentValue = value
	}

	getCurrentValue() {
		return this.currentValue
	}

	setInitialValues({
		startValue,
		targetValue,
	}: {
		startValue: number
		targetValue: number
	}) {
		this.startValue = startValue
		this.endValue = targetValue
	}

	getValues() {
		return {
			startValue: this.startValue,
			currentValue: this.currentValue,
			endValue: this.endValue,
		}
	}

	updateCurrentValue(delta = 1) {
		this.currentValue += delta
	}

	private isDirectionDown() {
		return this.endValue < this.startValue
	}

	isTargetReached() {
		return this.isDirectionDown()
			? this.currentValue <= this.endValue
			: this.currentValue >= this.endValue
	}

	getRemainingValue() {
		return this.isDirectionDown()
			? this.startValue - this.currentValue
			: this.currentValue - this.endValue
	}
}
