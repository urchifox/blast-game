// @vitest-environment happy-dom
import { ProgressUI } from "./progressUI"

function createSUT() {
	const scoreCounter = document.createElement("div")
	const movesCounter = document.createElement("div")
	const progressUI = new ProgressUI({ scoreCounter, movesCounter })
	return { progressUI, scoreCounter, movesCounter }
}

describe("ProgressUI", () => {
	it("sets moves counter text content", () => {
		const { progressUI, movesCounter } = createSUT()

		progressUI.updateMovesCounter({ movesLeft: 5 })

		expect(movesCounter.textContent).toBe("5")
	})

	it("overwrites previous moves counter value", () => {
		const { progressUI, movesCounter } = createSUT()

		progressUI.updateMovesCounter({ movesLeft: 5 })
		progressUI.updateMovesCounter({ movesLeft: 4 })

		expect(movesCounter.textContent).toBe("4")
	})

	it("sets score counter text content", () => {
		const { progressUI, scoreCounter } = createSUT()

		progressUI.updateScoreCounter({ score: 10, goalScore: 100 })

		expect(scoreCounter.textContent).toBe("10/100")
	})

	it("overwrites previous score counter value", () => {
		const { progressUI, scoreCounter } = createSUT()

		progressUI.updateScoreCounter({ score: 10, goalScore: 100 })
		progressUI.updateScoreCounter({ score: 25, goalScore: 100 })

		expect(scoreCounter.textContent).toBe("25/100")
	})

	it("updates counters independently", () => {
		const { progressUI, scoreCounter, movesCounter } = createSUT()

		progressUI.updateMovesCounter({ movesLeft: 7 })

		expect(movesCounter.textContent).toBe("7")
		expect(scoreCounter.textContent).toBe("")

		progressUI.updateScoreCounter({ score: 10, goalScore: 100 })
		expect(movesCounter.textContent).toBe("7")
		expect(scoreCounter.textContent).toBe("10/100")
	})
})
