import { TILES_KINDS_NORMAL } from "./config"

export type TileKind = (typeof TILES_KINDS_NORMAL)[number]
export type TilePosition = {
	row: number
	column: number
}

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
}
