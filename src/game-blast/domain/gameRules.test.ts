import { GameRules } from "./gameRules"

describe("scrore", () => {
	it.each([-1, 0, 1])(
		"ignores values under minimum combo size: %i",
		(invalidTilesNumber) => {
			const rules = new GameRules()
			expect(rules.getPoints(invalidTilesNumber)).toBe(0)
		}
	)

	it.each([
		{ removedTilesNumber: 2, points: 14 },
		{ removedTilesNumber: 3, points: 26 },
		{ removedTilesNumber: 4, points: 40 },
		{ removedTilesNumber: 10, points: 158 },
	])(
		"awards $points points for $removedTilesNumber removed tiles",
		({ removedTilesNumber, points }) => {
			const rules = new GameRules()
			expect(rules.getPoints(removedTilesNumber)).toBe(points)
		}
	)
})
