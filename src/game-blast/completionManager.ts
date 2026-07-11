import { isTileKindSpecial } from "./tile"
import { GameRules } from "./gameRules"
import { FieldManipulator } from "./fieldManipulator"
import { GameCompletionStatus } from "./types"

export type CompletionManagerProps = {
	fieldManipulator: Pick<
		FieldManipulator,
		"getTiles" | "getSameKindNeighbourTiles" | "shuffleField"
	>
	gameRules: GameRules
	isScoreTargetReached: () => boolean
	isMovesTargetReached: () => boolean
}

export class CompletionManager {
	private readonly fieldManipulator: CompletionManagerProps["fieldManipulator"]
	private readonly gameRules: CompletionManagerProps["gameRules"]
	private readonly isScoreTargetReached: CompletionManagerProps["isScoreTargetReached"]
	private readonly isMovesTargetReached: CompletionManagerProps["isMovesTargetReached"]

	private isCompleted = false
	private shuffleAttempts = 0
	private gameCompletionStatus: GameCompletionStatus =
		GameCompletionStatus.IN_PROGRESS

	constructor(props: CompletionManagerProps) {
		this.fieldManipulator = props.fieldManipulator
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

	async checkForMove() {
		if (this.isCompleted) {
			return
		}

		const isPossibleToMakeMove = this.isPossibleToMakeMove()
		if (isPossibleToMakeMove) {
			return
		}

		if (this.shuffleAttempts >= this.gameRules.MAX_SHUFFLE_ATTEMPTS) {
			this.lose()
			return
		}

		this.shuffleAttempts++
		let attempts = 0
		while (!this.isPossibleToMakeMove()) {
			await this.fieldManipulator.shuffleField()
			attempts++
			// Prevent infinite loop
			if (attempts >= 100) {
				this.lose()
				return
			}
		}
	}

	private isPossibleToMakeMove() {
		const tiles = this.fieldManipulator.getTiles()
		return tiles.some((tile) => {
			if (isTileKindSpecial(tile.getKind())) {
				return true
			}
			const { tilesToRemove } =
				this.fieldManipulator.getSameKindNeighbourTiles(tile)
			return tilesToRemove.size > 1
		})
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
	}
}
