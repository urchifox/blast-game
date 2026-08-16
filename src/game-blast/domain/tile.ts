import { TILES_KINDS_NORMAL, TILES_KINDS_SPECIAL } from "./config"

export type TileSnapshot = {
	id: string
	kind: TileKind
	row: number
	column: number
}

export type TileKindNormal = (typeof TILES_KINDS_NORMAL)[number]
export type TileKindSpecial = (typeof TILES_KINDS_SPECIAL)[number]
export type TileKind = TileKindNormal | TileKindSpecial

const TILES_KINDS_NORMAL_SET = new Set<TileKindNormal>(TILES_KINDS_NORMAL)
const TILES_KINDS_SPECIAL_SET = new Set<TileKindSpecial>(TILES_KINDS_SPECIAL)

export function isTileKindNormal(kind: TileKind): kind is TileKindNormal {
	return TILES_KINDS_NORMAL_SET.has(kind as TileKindNormal)
}

export function isTileKindSpecial(kind: TileKind): kind is TileKindSpecial {
	return TILES_KINDS_SPECIAL_SET.has(kind as TileKindSpecial)
}

export type TilePosition = {
	row: number
	column: number
}

export type TileProps = {
	kind: TileKind
	position: TilePosition
	id: string
}

export class Tile {
	private readonly kind: TileProps["kind"]
	private readonly position: TileProps["position"]

	private readonly id: string
	private _isLocked = false

	constructor(props: TileProps) {
		this.kind = props.kind
		this.position = props.position
		this.id = props.id
	}

	getId(): string {
		return this.id
	}

	getKind(): TileKind {
		return this.kind
	}

	getPosition(): TilePosition {
		return { ...this.position }
	}

	isLocked(): boolean {
		return this._isLocked
	}

	getSnapshot(): TileSnapshot {
		return {
			id: this.id,
			kind: this.kind,
			row: this.position.row,
			column: this.position.column,
		}
	}

	setPosition(position: TilePosition) {
		this.position.row = position.row
		this.position.column = position.column
	}

	lock() {
		this._isLocked = true
	}

	unlock() {
		this._isLocked = false
	}
}

export function stringifyTilePosition(position: TilePosition): string {
	return `${position.row}:${position.column}`
}
