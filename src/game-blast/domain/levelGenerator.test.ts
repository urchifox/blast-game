import { GameRules } from "./gameRules"
import { LevelGenerator } from "./levelGenerator"

const levelGenerator = new LevelGenerator({
	gameRules: new GameRules(),
	randomizationFunction: () => 0,
})

describe("level generator", () => {
	it("generate level data", () => {
		const levelData = levelGenerator.generateLevelData()
		expect(levelData).toEqual({
			columns: 9,
			rows: 9,
			goalScore: 1000,
			movesLimit: 18,
		})
	})
})
