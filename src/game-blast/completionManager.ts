import { isTileKindSpecial } from "./tile"
import { GameRules } from "./gameRules"
import { Presenter } from "./presenter"
import { GameCompletionStatus } from "./types"

export type CompletionManagerProps = {
	presenter: Pick<
		Presenter,
		"getTiles" | "getSameKindNeighbourTiles" | "shuffleField"
	>
	gameRules: GameRules
	isScoreTargetReached: () => boolean
	isMovesTargetReached: () => boolean
}

export class CompletionManager {
	private readonly presenter: CompletionManagerProps["presenter"]
	private readonly gameRules: CompletionManagerProps["gameRules"]
	private readonly isScoreTargetReached: CompletionManagerProps["isScoreTargetReached"]
	private readonly isMovesTargetReached: CompletionManagerProps["isMovesTargetReached"]

	private isCompleted = false
	private shuffleAttempts = 0
	private gameCompletionStatus: GameCompletionStatus =
		GameCompletionStatus.IN_PROGRESS

	constructor(props: CompletionManagerProps) {
		this.presenter = props.presenter
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
		const isNewMovePossible = await this.isNewMovePossible()
		if (!isNewMovePossible) {
			this.lose()
		}
	}

	private async isNewMovePossible(): Promise<boolean> {
		if (this.isCompleted) {
			return false
		}

		const isPossibleToMakeMove = this.isPossibleToMakeMove()
		if (isPossibleToMakeMove) {
			return true
		}

		if (this.shuffleAttempts >= this.gameRules.MAX_SHUFFLE_ATTEMPTS) {
			return false
		}

		const isNewMovePossible = await this.shuffleForNewMove()
		return isNewMovePossible
	}

	private async shuffleForNewMove() {
		this.shuffleAttempts++
		let attempts = 0
		while (!this.isPossibleToMakeMove()) {
			await this.presenter.shuffleField()
			attempts++
			// Prevent infinite loop
			if (attempts >= 100) {
				return false
			}
		}

		return true
	}

	private isPossibleToMakeMove() {
		const tiles = this.presenter.getTiles()
		return tiles.some((tile) => {
			if (isTileKindSpecial(tile.getKind())) {
				return true
			}
			const { tilesToRemove } = this.presenter.getSameKindNeighbourTiles(tile)
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
		this.gameCompletionStatus = GameCompletionStatus.IN_PROGRESS
	}
}
