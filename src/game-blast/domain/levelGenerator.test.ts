import { GameRules } from "./gameRules"
import { LevelGenerator } from "./levelGenerator"

const levelGenerator = new LevelGenerator({
	gameRules: new GameRules(),
	randomizationFunction: () => 0,
	createId: () => "1",
})

describe("level generator", () => {
	it("generate level data", () => {
		const levelData = levelGenerator.generateLevelData()
		const { columns, rows, goalScore, movesLimit, tilesProps } = levelData

		expect(columns).toBe(9)
		expect(rows).toBe(9)
		expect(goalScore).toBe(1000)
		expect(movesLimit).toBe(18)
		expect(tilesProps.size).toBe(81)
	})
})
