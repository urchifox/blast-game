import { getRandomNumber, RandomizationFunction } from "../helpers/random"
import { GameRules } from "./gameRules"

export type LevelGeneratorProps = {
	gameRules: GameRules
	randomizationFunction: RandomizationFunction
}

export type LevelData = {
	columns: number
	rows: number
	goalScore: number
	movesLimit: number
}

export class LevelGenerator {
	private readonly gameRules: LevelGeneratorProps["gameRules"]
	private readonly randomizationFunction: LevelGeneratorProps["randomizationFunction"]

	constructor(props: LevelGeneratorProps) {
		this.gameRules = props.gameRules
		this.randomizationFunction = props.randomizationFunction
	}

	generateLevelData() {
		const levelData = {} as LevelData
		levelData.columns = this.gameRules.DEFAULT_COLUMNS
		levelData.rows = this.gameRules.DEFAULT_ROWS
		levelData.goalScore = getRandomNumber(
			{
				min: this.gameRules.MIN_GOAL_SCORE,
				max: this.gameRules.MAX_GOAL_SCORE,
				step: 100,
			},
			this.randomizationFunction
		)
		levelData.movesLimit = this.estimateMoves(levelData.goalScore)
		return levelData
	}

	/** Based on average score per move */
	private estimateMoves(targetScore: number): number {
		if (targetScore <= 0) {
			return 0
		}

		const avgCombo = getRandomNumber(
			{
				min: this.gameRules.MIN_AVG_COMBO,
				max: this.gameRules.MAX_AVG_COMBO,
			},
			this.randomizationFunction
		)
		const avgScorePerMove = this.gameRules.getPoints(avgCombo)
		const moves = targetScore / avgScorePerMove

		return Math.ceil(moves)
	}
}
