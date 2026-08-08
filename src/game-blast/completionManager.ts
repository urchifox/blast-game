import { isTileKindSpecial } from "./tile"
import { GameRules } from "./gameRules"
import { GameCompletionStatus } from "./types"
import { FieldQueries } from "./fieldQueries"

export type CompletionManagerProps = {
	fieldQueries: FieldQueries
	gameRules: GameRules
	isScoreTargetReached: () => boolean
	isMovesTargetReached: () => boolean
}

export class CompletionManager {
	private readonly fieldQueries: CompletionManagerProps["fieldQueries"]
	private readonly gameRules: CompletionManagerProps["gameRules"]
	private readonly isScoreTargetReached: CompletionManagerProps["isScoreTargetReached"]
	private readonly isMovesTargetReached: CompletionManagerProps["isMovesTargetReached"]

	private isCompleted = false
	private shuffleAttempts = 0
	private gameCompletionStatus: GameCompletionStatus =
		GameCompletionStatus.IN_PROGRESS

	constructor(props: CompletionManagerProps) {
		this.fieldQueries = props.fieldQueries
		this.gameRules = props.gameRules
		this.isScoreTargetReached = props.isScoreTargetReached
		this.isMovesTargetReached = props.isMovesTargetReached
	}

	isGameCompleted() {
		return this.isCompleted
	}

	checkGameCompletion(): GameCompletionStatus {
		if (this.isCompleted) {
			return this.gameCompletionStatus
		}

		if (this.isScoreTargetReached()) {
			this.win()
		} else if (this.isMovesTargetReached()) {
			this.lose()
		}

		return this.gameCompletionStatus
	}

	needToShuffle() {
		if (this.isCompleted) {
			return false
		}

		const isPossibleToMakeMove = this.isPossibleToMakeMove()
		if (isPossibleToMakeMove) {
			return false
		}

		const isPossibleToShuffle = this.isPossibleToShuffle(
			this.shuffleAttempts
		)
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
