import { isTileKindSpecial } from "./tile"
import { GameRules } from "./gameRules"
import { FieldManipulator } from "./fieldManipulator"

export type CompletionManagerProps = {
	fieldManipulator: Pick<
		FieldManipulator,
		"getTiles" | "getSameKindNeighbourTiles" | "shuffleField"
	>
	gameRules: GameRules
	openWinModal: () => void
	openLossModal: () => void
	isScoreTargetReached: () => boolean
	isMovesTargetReached: () => boolean
	waitAllAnimations: () => Promise<void>
}

export class CompletionManager {
	private readonly fieldManipulator: CompletionManagerProps["fieldManipulator"]
	private readonly gameRules: CompletionManagerProps["gameRules"]
	private readonly openWinModal: CompletionManagerProps["openWinModal"]
	private readonly openLossModal: CompletionManagerProps["openLossModal"]
	private readonly isScoreTargetReached: CompletionManagerProps["isScoreTargetReached"]
	private readonly isMovesTargetReached: CompletionManagerProps["isMovesTargetReached"]
	private readonly waitAllAnimations: CompletionManagerProps["waitAllAnimations"]

	private isCompleted = false
	private shuffleAttempts = 0

	constructor(props: CompletionManagerProps) {
		this.fieldManipulator = props.fieldManipulator
		this.gameRules = props.gameRules
		this.openWinModal = props.openWinModal
		this.openLossModal = props.openLossModal
		this.isScoreTargetReached = props.isScoreTargetReached
		this.isMovesTargetReached = props.isMovesTargetReached
		this.waitAllAnimations = props.waitAllAnimations
	}

	isGameCompleted() {
		return this.isCompleted
	}

	checkGameCompletion() {
		if (this.isCompleted) {
			return
		}

		if (this.isScoreTargetReached()) {
			this.win()
		} else if (this.isMovesTargetReached()) {
			this.lose()
		}
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
		if (this.isCompleted) {
			return
		}

		this.isCompleted = true
		this.waitAllAnimations().then(() => this.openWinModal())
	}

	private lose() {
		if (this.isCompleted) {
			return
		}

		this.isCompleted = true
		this.waitAllAnimations().then(() => this.openLossModal())
	}

	clear() {
		this.isCompleted = false
		this.shuffleAttempts = 0
	}
}
