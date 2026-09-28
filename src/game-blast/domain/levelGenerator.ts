import {
	getRandomNumber,
	IdGenerator,
	pickRandomItem,
	RandomizationFunction,
} from "../../helpers/random"
import { TILES_KINDS_NORMAL } from "./config"
import { GameRules } from "./gameRules"
import { TileProps } from "./tile"

export type LevelGeneratorProps = {
	gameRules: GameRules
	randomizationFunction: RandomizationFunction
	createId: IdGenerator
}

export type LevelData = {
	tilesProps: Set<TileProps>
	columns: number
	rows: number
	goalScore: number
	movesLimit: number
}

export class LevelGenerator {
	private readonly gameRules: LevelGeneratorProps["gameRules"]
	private readonly randomizationFunction: LevelGeneratorProps["randomizationFunction"]
	private readonly createId: LevelGeneratorProps["createId"]

	constructor(props: LevelGeneratorProps) {
		this.gameRules = props.gameRules
		this.randomizationFunction = props.randomizationFunction
		this.createId = props.createId
	}

	generateLevelData() {
		const columns = this.gameRules.DEFAULT_COLUMNS
		const rows = this.gameRules.DEFAULT_ROWS
		const tilesProps = this.getTilesProps({ columns, rows })
		const goalScore = getRandomNumber(
			{
				min: this.gameRules.MIN_GOAL_SCORE,
				max: this.gameRules.MAX_GOAL_SCORE,
				step: 100,
			},
			this.randomizationFunction
		)
		const movesLimit = this.estimateMoves(goalScore)
		const levelData: LevelData = {
			tilesProps,
			columns,
			rows,
			goalScore,
			movesLimit,
		}
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

	private getTilesProps({ columns, rows }: { columns: number; rows: number }) {
		const tilesProps = new Set<TileProps>()
		for (let column = 0; column < columns; column++) {
			for (let row = 0; row < rows; row++) {
				const kind = pickRandomItem(
					TILES_KINDS_NORMAL,
					this.randomizationFunction
				)
				const position = { row, column }
				const id = this.createId()
				tilesProps.add({ kind, position, id })
			}
		}
		return tilesProps
	}
}
