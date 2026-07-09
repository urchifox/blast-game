import { isTileKindSpecial } from "./tile"
import { GameRules } from "./gameRules"
import { FieldManipulator } from "./fieldManipulator"

type InnerFieldManipulator = Pick<
	FieldManipulator,
	"getTiles" | "getSameKindNeighbourTiles" | "shuffleField"
>

export type CompletionManagerProps = {
	innerFieldManipulator: InnerFieldManipulator
	gameRules: GameRules
	openWinModal: () => void
	openLossModal: () => void
	isScoreTargetReached: () => boolean
	isMovesTargetReached: () => boolean
	waitAllAnimations: () => Promise<void>
}

export class CompletionManager {
	private readonly innerFieldManipulator: CompletionManagerProps["innerFieldManipulator"]
	private readonly gameRules: CompletionManagerProps["gameRules"]
	private readonly openWinModal: CompletionManagerProps["openWinModal"]
	private readonly openLossModal: CompletionManagerProps["openLossModal"]
	private readonly isScoreTargetReached: CompletionManagerProps["isScoreTargetReached"]
	private readonly isMovesTargetReached: CompletionManagerProps["isMovesTargetReached"]
	private readonly waitAllAnimations: CompletionManagerProps["waitAllAnimations"]

	private isCompleted = false
	private shuffleAttempts = 0

	constructor({
		innerFieldManipulator,
		gameRules,
		openWinModal,
		openLossModal,
		isScoreTargetReached,
		isMovesTargetReached,
		waitAllAnimations,
	}: CompletionManagerProps) {
		this.innerFieldManipulator = innerFieldManipulator
		this.gameRules = gameRules
		this.openWinModal = openWinModal
		this.openLossModal = openLossModal
		this.isScoreTargetReached = isScoreTargetReached
		this.isMovesTargetReached = isMovesTargetReached
		this.waitAllAnimations = waitAllAnimations
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
			await this.innerFieldManipulator.shuffleField()
			attempts++
			// Prevent infinite loop
			if (attempts >= 100) {
				this.lose()
				return
			}
		}
	}

	private isPossibleToMakeMove() {
		const tiles = this.innerFieldManipulator.getTiles()
		return tiles.some((tile) => {
			if (isTileKindSpecial(tile.getKind())) {
				return true
			}
			const { tilesToRemove } =
				this.innerFieldManipulator.getSameKindNeighbourTiles(tile)
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
