import { BoosterUIContract } from "../types"

export type BoosterUIProps = {
	button: HTMLElement
	counter: HTMLElement
	toggleGameContainerRaised: (isRaised: boolean) => void
	onClick: () => void
}

export class BoosterUI implements BoosterUIContract {
	private button: BoosterUIProps["button"]
	private counter: BoosterUIProps["counter"]
	private toggleGameContainerRaised: BoosterUIProps["toggleGameContainerRaised"]

	constructor(props: BoosterUIProps) {
		this.button = props.button
		this.counter = props.counter
		this.toggleGameContainerRaised = props.toggleGameContainerRaised
		this.button.addEventListener("click", props.onClick)
	}

	updateBoosterCounter(currentValue: number) {
		this.counter.textContent = currentValue.toString()
	}

	toggleBoosterButtonActive(active: boolean) {
		this.button.classList.toggle("booster--active", active)
		this.button.parentElement?.classList.toggle(
			"boosters-container__item--raised",
			active
		)
		this.toggleGameContainerRaised(active)
	}
}
