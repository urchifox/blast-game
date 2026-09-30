import { Counter } from "./counter"

describe("counter", () => {
	it.each([
		{ startValue: 0, endValue: 2, step: 1, direction: "up" },
		{ startValue: 2, endValue: 0, step: -1, direction: "down" },
	])(
		"determines the achievement of the goal in a $direction direction",
		({ startValue, endValue, step }) => {
			const counter = new Counter({
				startValue,
				endValue,
			})
			expect(counter.isTargetReached()).toBe(false)
			counter.updateCurrentValue(step)
			expect(counter.isTargetReached()).toBe(false)
			counter.updateCurrentValue(step)
			expect(counter.isTargetReached()).toBe(true)
		}
	)
})
