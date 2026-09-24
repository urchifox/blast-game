import { BoosterCounter } from "./boosterCounter"

describe("boosterCounter", () => {
	it("determines if the booster can be used", () => {
		const boosterCounter = new BoosterCounter({ startValue: 2, endValue: 0 })
		expect(boosterCounter.canBeUsed).toBe(true)
		boosterCounter.spend()
		expect(boosterCounter.canBeUsed).toBe(true)
		boosterCounter.spend()
		expect(boosterCounter.canBeUsed).toBe(false)
	})
})
