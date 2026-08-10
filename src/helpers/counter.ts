export type CounterProps = {
	startValue: number
	currentValue?: number
	endValue: number
}

export class Counter {
	private startValue = 0
	private currentValue = 0
	private endValue = 0

	constructor(props?: CounterProps) {
		if (props === undefined) {
			return
		}
		this.setInitialValues({
			startValue: props.startValue,
			targetValue: props.endValue,
			currentValue: props.currentValue,
		})
	}

	clear() {
		this.startValue = 0
		this.currentValue = 0
		this.endValue = 0
	}

	reset() {
		this.setInitialValues({
			startValue: this.startValue,
			targetValue: this.endValue,
		})
	}

	getCurrentValue() {
		return this.currentValue
	}

	setInitialValues({
		startValue,
		targetValue,
		currentValue,
	}: {
		startValue: number
		targetValue: number
		currentValue?: number
	}) {
		this.startValue = startValue
		this.currentValue = currentValue ?? startValue
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
