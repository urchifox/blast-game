import { GameRules } from "./gameRules"
import { LevelGenerator } from "./levelGenerator"

describe("level generator", () => {
	it.each([
		{
			randomizationFunction: () => 0,
			expectedColumns: 9,
			expectedRows: 9,
			expectedGoalScore: 1000,
			expectedMovesLimit: 18,
			expectedTilesNumber: 81,
		},
		{
			randomizationFunction: () => 1 - Number.EPSILON,
			expectedColumns: 9,
			expectedRows: 9,
			expectedGoalScore: 5000,
			expectedMovesLimit: 32,
			expectedTilesNumber: 81,
		},
	])(
		"generate level data",
		({
			randomizationFunction,
			expectedColumns,
			expectedRows,
			expectedGoalScore,
			expectedMovesLimit,
			expectedTilesNumber,
		}) => {
			const levelGenerator = new LevelGenerator({
				gameRules: new GameRules(),
				randomizationFunction,
				createId: () => "1",
			})
			const levelData = levelGenerator.generateLevelData()
			const { columns, rows, goalScore, movesLimit, tilesProps } = levelData

			expect(columns).toBe(expectedColumns)
			expect(rows).toBe(expectedRows)
			expect(goalScore).toBe(expectedGoalScore)
			expect(movesLimit).toBe(expectedMovesLimit)
			expect(tilesProps.size).toBe(expectedTilesNumber)
		}
	)
})
