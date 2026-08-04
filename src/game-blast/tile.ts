import { TILES_KINDS_NORMAL, TILES_KINDS_SPECIAL } from "./config"
import { getRandomId } from "../helpers/random"

export type TileSnapshot = {
	id: string
	image: string
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
}

export class Tile {
	private readonly kind: TileProps["kind"]
	private readonly position: TileProps["position"]

	private readonly id: string = getRandomId()
	private readonly image: string
	private isBlocked = false

	constructor(props: TileProps) {
		this.kind = props.kind
		this.position = props.position
		this.image = `tile-${props.kind}`
	}

	getIsBlocked(): boolean {
		return this.isBlocked
	}

	setIsBlocked(isBlocked: boolean) {
		this.isBlocked = isBlocked
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
