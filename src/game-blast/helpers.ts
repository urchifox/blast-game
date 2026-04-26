import { TilePosition, TilePositionString } from "./tile"

export const postitionSeparatorString = "-" as const

export function stringifyTilePosition(position: TilePosition) {
	return `${position.row}${postitionSeparatorString}${position.column}` as TilePositionString
}

export function parseTilePosition(positionString: string): TilePosition {
	const [row, column] = positionString.split(postitionSeparatorString)
	return { row: parseInt(row), column: parseInt(column) }
}
