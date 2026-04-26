import { TILES_KINDS_NORMAL } from "./config"
import { postitionSeparatorString } from "./helpers"

export type TileKind = (typeof TILES_KINDS_NORMAL)[number]
export type TilePosition = {
	row: number
	column: number
}
export type TilePositionString =
	`number${typeof postitionSeparatorString}number`

export class Tile {
	private readonly kind: TileKind
	private readonly position: TilePosition

	constructor({ kind, position }: { kind: TileKind; position: TilePosition }) {
		this.kind = kind
		this.position = position
	}

	getKind(): TileKind {
		return this.kind
	}

	getPosition(): TilePosition {
		return this.position
	}

	setPosition(position: TilePosition) {
		this.position.row = position.row
		this.position.column = position.column
	}
}
