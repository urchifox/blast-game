import { isTileKindSpecial, Tile, TilePosition } from "./tile"
import { GameRules } from "./gameRules"

export type CompletionManagerProps = {
	gameRules: GameRules
	openWinModal: () => void
	openLossModal: () => void
	shuffleField: () => Promise<void>
	getTiles: () => Array<Tile>
	getSameKindNeighbourTiles: (tile: Tile) => {
		tilesToRemove: Set<Tile>
		positionsToRemove: Set<TilePosition>
	}
	isScoreTargetReached: () => boolean
	isMovesTargetReached: () => boolean
	waitAllAnimations: () => Promise<void>
}

export class CompletionManager {
	private readonly gameRules: CompletionManagerProps["gameRules"]
	private readonly openWinModal: CompletionManagerProps["openWinModal"]
	private readonly openLossModal: CompletionManagerProps["openLossModal"]
	private readonly shuffleField: CompletionManagerProps["shuffleField"]
	private readonly getTiles: CompletionManagerProps["getTiles"]
	private readonly getSameKindNeighbourTiles: CompletionManagerProps["getSameKindNeighbourTiles"]
	private readonly isScoreTargetReached: CompletionManagerProps["isScoreTargetReached"]
	private readonly isMovesTargetReached: CompletionManagerProps["isMovesTargetReached"]
	private readonly waitAllAnimations: CompletionManagerProps["waitAllAnimations"]

	private isCompleted = false
	private shuffleAttempts = 0

	constructor({
		gameRules,
		openWinModal,
		openLossModal,
		shuffleField,
		getTiles,
		getSameKindNeighbourTiles,
		isScoreTargetReached,
		isMovesTargetReached,
		waitAllAnimations,
	}: CompletionManagerProps) {
		this.gameRules = gameRules
		this.openWinModal = openWinModal
		this.openLossModal = openLossModal
		this.shuffleField = shuffleField
		this.getTiles = getTiles
		this.getSameKindNeighbourTiles = getSameKindNeighbourTiles
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
			await this.shuffleField()
			attempts++
			// Prevent infinite loop
			if (attempts >= 100) {
				this.lose()
				return
			}
		}
	}

	private isPossibleToMakeMove() {
		const tiles = this.getTiles()
		return tiles.some((tile) => {
			if (isTileKindSpecial(tile.getKind())) {
				return true
			}
			const { tilesToRemove } = this.getSameKindNeighbourTiles(tile)
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
