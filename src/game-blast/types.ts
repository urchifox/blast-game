import { GridSnapshot } from "./domain/grid"

export type LayoutSnapshot = {
	readonly gridWidth: number
	readonly gridHeight: number
	readonly tileWidth: number
	readonly tileHeight: number
	readonly tileGapX: number
	readonly tileGapY: number
}

export type LayoutUIContract = {
	getSnapshot: () => LayoutSnapshot
	updateSizes: (gridSnapshot: GridSnapshot) => LayoutSnapshot
	getGameContainerOffset: () => { offsetX: number; offsetY: number }
	setGameContainerSize: (
		sizes: { width: number; height: number } | null
	) => void
}

export type ProgressUIContract = {
	updateMovesCounter: (props: { movesLeft: number }) => void
	updateScoreCounter: (props: { score: number; goalScore: number }) => void
}

export type ModalUIContract = {
	open: () => void
}
