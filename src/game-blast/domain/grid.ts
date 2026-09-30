import { TilePosition } from "./tile"

export type GridSnapshot = {
	readonly rows: number
	readonly columns: number
}

export class Grid {
	private rows?: number
	private columns?: number

	private get range(): {
		minRow: number
		maxRow: number
		minColumn: number
		maxColumn: number
	} {
		const minRow = 0
		const minColumn = 0
		const maxRow = Math.max(minRow, (this.rows ?? 0) - 1)
		const maxColumn = Math.max(minColumn, (this.columns ?? 0) - 1)

		return {
			minRow,
			maxRow,
			minColumn,
			maxColumn,
		}
	}

	private isColumnInRange(column: number): boolean {
		const { minColumn, maxColumn } = this.range
		return column >= minColumn && column <= maxColumn
	}

	private isRowInRange(row: number): boolean {
		const { minRow, maxRow } = this.range
		return row >= minRow && row <= maxRow
	}

	getSnapshot(): GridSnapshot {
		return {
			rows: this.rows ?? 0,
			columns: this.columns ?? 0,
		}
	}

	createGrid({ columns, rows }: { columns: number; rows: number }) {
		this.rows = Math.max(0, rows)
		this.columns = Math.max(0, columns)
	}

	getNeighbourPositions(position: TilePosition): TilePosition[] {
		const { minRow, maxRow, minColumn, maxColumn } = this.range
		const { row, column } = position
		const isPositionColumnInRange = this.isColumnInRange(column)
		const isPositionRowInRange = this.isRowInRange(row)
		const neighbourPositions: TilePosition[] = []

		if (row > minRow && isPositionColumnInRange) {
			const upperRow = row - 1
			if (this.isRowInRange(upperRow)) {
				neighbourPositions.push({ row: upperRow, column })
			}
		}

		if (row < maxRow && isPositionColumnInRange) {
			const lowerRow = row + 1
			if (this.isRowInRange(lowerRow)) {
				neighbourPositions.push({ row: lowerRow, column })
			}
		}

		if (column > minColumn && isPositionRowInRange) {
			const leftColumn = column - 1
			if (this.isColumnInRange(leftColumn)) {
				neighbourPositions.push({ row, column: leftColumn })
			}
		}

		if (column < maxColumn && isPositionRowInRange) {
			const rightColumn = column + 1
			if (this.isColumnInRange(rightColumn)) {
				neighbourPositions.push({ row, column: rightColumn })
			}
		}

		return neighbourPositions
	}
}
