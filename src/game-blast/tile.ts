import { nanoid } from "nanoid"
import { TILES_KINDS_NORMAL } from "./config"

export type TileSnapshot = {
	id: string
	image: string
	row: number
	column: number
}
export type TileKind = (typeof TILES_KINDS_NORMAL)[number]
export type TilePosition = {
	row: number
	column: number
}

export class Tile {
	private readonly id: string = nanoid()
	private readonly kind: TileKind
	private position: TilePosition
	private readonly image: string

	constructor({ kind, position }: { kind: TileKind; position: TilePosition }) {
		this.kind = kind
		this.position = position
		this.image = `tile-${kind}`
	}
	getId(): string {
		return this.id
	}

	getKind(): TileKind {
		return this.kind
	}

	getImage(): string {
		return this.image
	}

	getPosition(): TilePosition {
		return { ...this.position }
	}

	getSnapshot(): TileSnapshot {
		return {
			id: this.id,
			image: this.image,
			row: this.position.row,
			column: this.position.column,
		}
	}

	setPosition(position: TilePosition) {
		this.position.row = position.row
		this.position.column = position.column
	}
}
