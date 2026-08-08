import { TilePosition } from "./tile"

export type GridSnapshot = {
	readonly rows: number
	readonly columns: number
}

export class Grid {
	private rows?: number
	private columns?: number

	getSnapshot(): GridSnapshot {
		return {
			rows: this.rows ?? 0,
			columns: this.columns ?? 0,
		}
	}

	createGrid({ columns, rows }: { columns: number; rows: number }) {
		this.rows = rows
		this.columns = columns
	}

	getNeighbourPositions(position: TilePosition): TilePosition[] {
		const { row, column } = position
		const neighbourPositions: TilePosition[] = []

		// upper
		if (row > 0) {
			neighbourPositions.push({ row: row - 1, column })
		}
		// lower
		if (row < (this.rows ?? 0) - 1) {
			neighbourPositions.push({ row: row + 1, column })
		}
		// left
		if (column > 0) {
			neighbourPositions.push({ row, column: column - 1 })
		}
		// right
		if (column < (this.columns ?? 0) - 1) {
			neighbourPositions.push({ row, column: column + 1 })
		}

		return neighbourPositions
	}
}
