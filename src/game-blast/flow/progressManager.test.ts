import { Counter } from "../../helpers/counter"
import { GameRules } from "../domain/gameRules"
import { ProgressCounter } from "../domain/progressCounter"
import { ProgressManager } from "./progressManager"
import { createProgressUIStub } from "./testHelpers"

function createSUT() {
	const gameRules = new GameRules()

	const progressCounter = new ProgressCounter({
		scoreCounter: new Counter(),
		movesCounter: new Counter(),
		gameRules: gameRules,
	})

	const progressUI = createProgressUIStub()

	const progressManager = new ProgressManager({
		progressCounter: progressCounter,
		progressUI: progressUI,
	})
	return {
		progressManager,
		progressUI,
		gameRules,
	}
}

describe("ProgressManager", () => {
	describe("setInitialValues", () => {
		it("renders zero score with goal score and full moves limit", () => {
			const { progressManager, progressUI } = createSUT()
			const updateScoreCounter = vi.spyOn(progressUI, "updateScoreCounter")
			const updateMovesCounter = vi.spyOn(progressUI, "updateMovesCounter")

			progressManager.setInitialValues({ goalScore: 1500, movesLimit: 20 })

			expect(updateScoreCounter).toHaveBeenCalledOnce()
			expect(updateScoreCounter).toHaveBeenLastCalledWith({
				score: 0,
				goalScore: 1500,
			})
			expect(updateMovesCounter).toHaveBeenCalledOnce()
			expect(updateMovesCounter).toHaveBeenLastCalledWith({
				movesLeft: 20,
			})
		})
	})

	describe("processMove", () => {
		it("adds points for removed tiles and decrements moves left", () => {
			const { progressManager, progressUI, gameRules } = createSUT()
			const updateScoreCounter = vi.spyOn(progressUI, "updateScoreCounter")
			const updateMovesCounter = vi.spyOn(progressUI, "updateMovesCounter")

			progressManager.setInitialValues({ goalScore: 1500, movesLimit: 20 })
			progressManager.processMove(3)

			expect(updateScoreCounter).toHaveBeenCalledOnce()
			expect(updateScoreCounter).toHaveBeenLastCalledWith({
				score: gameRules.getPoints(3),
				goalScore: 1500,
			})
			expect(updateMovesCounter).toHaveBeenCalledOnce()
			expect(updateMovesCounter).toHaveBeenLastCalledWith({
				movesLeft: 19,
			})
		})

		it("accumulates score and moves across consecutive moves", () => {
			const { progressManager, progressUI, gameRules } = createSUT()
			const updateScoreCounter = vi.spyOn(progressUI, "updateScoreCounter")
			const updateMovesCounter = vi.spyOn(progressUI, "updateMovesCounter")

			progressManager.setInitialValues({ goalScore: 1500, movesLimit: 20 })
			progressManager.processMove(3)
			progressManager.processMove(5)

			expect(updateScoreCounter).toHaveBeenLastCalledWith({
				score: gameRules.getPoints(3) + gameRules.getPoints(5),
				goalScore: 1500,
			})
			expect(updateMovesCounter).toHaveBeenLastCalledWith({
				movesLeft: 18,
			})
		})
	})

	describe("clear", () => {
		it("renders zeroed score, goal score and moves left", () => {
			const { progressManager, progressUI } = createSUT()
			const updateScoreCounter = vi.spyOn(progressUI, "updateScoreCounter")
			const updateMovesCounter = vi.spyOn(progressUI, "updateMovesCounter")

			progressManager.setInitialValues({ goalScore: 1500, movesLimit: 20 })
			progressManager.processMove(3)
			progressManager.clear()

			expect(updateScoreCounter).toHaveBeenCalledOnce()
			expect(updateScoreCounter).toHaveBeenLastCalledWith({
				score: 0,
				goalScore: 0,
			})
			expect(updateMovesCounter).toHaveBeenCalledOnce()
			expect(updateMovesCounter).toHaveBeenLastCalledWith({
				movesLeft: 0,
			})
		})
	})
})
