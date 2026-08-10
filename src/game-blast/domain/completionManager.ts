import { isTileKindSpecial } from "./tile"
import { GameRules } from "./gameRules"
import { GameCompletionStatus } from "./types"
import { FieldQueries } from "./fieldQueries"
import { ProgressCounter } from "./progressCounter"

export type CompletionManagerProps = {
	fieldQueries: FieldQueries
	gameRules: GameRules
	progressCounter: ProgressCounter
}

export class CompletionManager {
	private readonly fieldQueries: CompletionManagerProps["fieldQueries"]
	private readonly gameRules: CompletionManagerProps["gameRules"]
	private readonly progressCounter: CompletionManagerProps["progressCounter"]

	private isCompleted = false
	private shuffleAttempts = 0
	private gameCompletionStatus: GameCompletionStatus =
		GameCompletionStatus.IN_PROGRESS

	constructor(props: CompletionManagerProps) {
		this.fieldQueries = props.fieldQueries
		this.gameRules = props.gameRules
		this.progressCounter = props.progressCounter
	}

	isGameCompleted() {
		return this.isCompleted
	}

	checkGameCompletion(): GameCompletionStatus {
		if (this.isCompleted) {
			return this.gameCompletionStatus
		}

		const gameCompletionStatus = this.progressCounter.getCompletionStatus()
		if (gameCompletionStatus === GameCompletionStatus.WIN) {
			this.win()
		} 
		return this.gameCompletionStatus
	}

	isShuffleNeeded() {
		if (this.isCompleted) {
			return false
		}

		const isPossibleToMakeMove = this.isPossibleToMakeMove()
		if (isPossibleToMakeMove) {
			return false
		}

		const isPossibleToShuffle = this.isPossibleToShuffle(this.shuffleAttempts)
		if (!isPossibleToShuffle) {
			this.lose()
			return false
		}

		return true
	}

	private isPossibleToMakeMove() {
		const tiles = this.fieldQueries.getTiles()
		return tiles.some((tile) => {
			if (isTileKindSpecial(tile.getKind())) {
				return true
			}
			const { tiles } = this.fieldQueries.getSameKindNeighbourTiles(tile)
			return tiles.size > 1
		})
	}

	private isPossibleToShuffle(shuffleAttempts: number) {
		return shuffleAttempts < this.gameRules.MAX_SHUFFLE_ATTEMPTS
	}

	updateShuffleAttempts() {
		this.shuffleAttempts++
		const isPossibleToMakeMove = this.isPossibleToMakeMove()
		if (!isPossibleToMakeMove) {
			this.lose()
		}
	}

	private win() {
		this.isCompleted = true
		this.gameCompletionStatus = GameCompletionStatus.WIN
	}

	private lose() {
		this.isCompleted = true
		this.gameCompletionStatus = GameCompletionStatus.LOSS
	}

	clear() {
		this.isCompleted = false
		this.shuffleAttempts = 0
		this.gameCompletionStatus = GameCompletionStatus.IN_PROGRESS
	}
}
