export type ProgressProps = {
	updateCounter: (props: { currentValue: number; targetValue: number }) => void
	isDirectionDown?: boolean
}

export class Progress {
	private readonly isDirectionDown: NonNullable<
		ProgressProps["isDirectionDown"]
	>
	private readonly updateCounter: ProgressProps["updateCounter"]

	private currentValue = 0
	private targetValue = 0

	constructor(props: ProgressProps) {
		this.updateCounter = props.updateCounter
		this.isDirectionDown = props.isDirectionDown ?? false
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
