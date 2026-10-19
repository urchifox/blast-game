// @vitest-environment happy-dom

import { BoosterUI } from "./boosterUI"

function createSUT() {
	const buttonParent = document.createElement("div")
	const button = document.createElement("button")
	buttonParent.appendChild(button)
	const counter = document.createElement("div")
	const toggleGameContainerRaised = vi.fn()
	const onClick = vi.fn()
	const boosterUI = new BoosterUI({
		button,
		counter,
		toggleGameContainerRaised,
		onClick,
	})
	return {
		boosterUI,
		button,
		buttonParent,
		counter,
		toggleGameContainerRaised,
		onClick,
	}
}

describe("BoosterUI", () => {
	it("sets button click listener", () => {
		const { button, onClick } = createSUT()

		button.click()

		expect(onClick).toHaveBeenCalled()
	})

	it("sets counter text content", () => {
		const { boosterUI, counter } = createSUT()

		boosterUI.updateBoosterCounter(10)

		expect(counter.textContent).toBe("10")
	})

	it("overwrites previous counter text content", () => {
		const { boosterUI, counter } = createSUT()

		boosterUI.updateBoosterCounter(10)
		boosterUI.updateBoosterCounter(9)

		expect(counter.textContent).toBe("9")
	})

	it.each([true, false])(
		"toggles button class and its parent class when changes active state to %s",
		(active) => {
			const { boosterUI, button, buttonParent } = createSUT()

			boosterUI.toggleBoosterButtonActive(active)

			expect(button.classList.contains("booster--active")).toBe(active)
			expect(
				buttonParent.classList.contains("boosters-container__item--raised")
			).toBe(active)
		}
	)

	it.each([true, false])(
		"calls toggleGameContainerRaised when changes active state to %s",
		(active) => {
			const { boosterUI, toggleGameContainerRaised } = createSUT()

			boosterUI.toggleBoosterButtonActive(active)

			expect(toggleGameContainerRaised).toHaveBeenCalledWith(active)
		}
	)
})
