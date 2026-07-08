import { getRandomNumber } from "../helpers/random"
import {
	DEFAULT_COLUMNS,
	DEFAULT_ROWS,
	MIN_GOAL_SCORE,
	MAX_GOAL_SCORE,
	MIN_AVG_COMBO,
	MAX_AVG_COMBO,
} from "./config"

export type LevelManagerProps = {
	getPoints(removedTilesNumber: number): number
}

export type LevelData = {
	columns: number
	rows: number
	goalScore: number
	movesLimit: number
}

export class LevelGenerator {
	private readonly getPoints: LevelManagerProps["getPoints"]

	constructor({ getPoints }: LevelManagerProps) {
		this.getPoints = getPoints
	}

	generateLevelData() {
		const levelData = {} as LevelData
		levelData.columns = DEFAULT_COLUMNS
		levelData.rows = DEFAULT_ROWS
		levelData.goalScore = getRandomNumber({
			min: MIN_GOAL_SCORE,
			max: MAX_GOAL_SCORE,
			step: 100,
		})
		levelData.movesLimit = this.estimateMoves(levelData.goalScore)
		return levelData
	}

	/** Based on average score per move */
	private estimateMoves(targetScore: number): number {
		if (targetScore <= 0) {
			return 0
		}

		const avgCombo = getRandomNumber({ min: MIN_AVG_COMBO, max: MAX_AVG_COMBO })
		const avgScorePerMove = this.getPoints(avgCombo)
		const moves = targetScore / avgScorePerMove

		return Math.ceil(moves)
	}
}
