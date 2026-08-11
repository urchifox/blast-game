export type ProgressUIContract = {
	updateMovesCounter: (props: { movesLeft: number }) => void
	updateScoreCounter: (props: { score: number; goalScore: number }) => void
}
