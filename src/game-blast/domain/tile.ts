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

export enum TileAnimation {
	NONE = "none",
	APPEAR = "appear",
	MOVE = "move",
	REMOVE = "remove",
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

	private _current_animation: TileAnimation = TileAnimation.NONE
	private resolveRemoving: (() => void) | null = null

	removingPromise: Promise<void> | null = null

	constructor(props: TileProps) {
		this.kind = props.kind
		this.position = props.position
		this.id = props.id
	}
	
	get currentAnimation(): TileAnimation {
		return this._current_animation
	}

	set currentAnimation(animation: TileAnimation) {
		this._current_animation = animation
	}

	get isAnimationInProcess() {
		return this.currentAnimation !== TileAnimation.NONE
	}

	createRemovingPromise() {
		this.removingPromise = new Promise<void>((resolve) => {
			this.resolveRemoving = resolve
		})
	}

	resolveRemovingPromise() {
		if (this.resolveRemoving === null) {
			return
		}
		this.resolveRemoving()
		this.resolveRemoving = null
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
}

export function stringifyTilePosition(position: TilePosition): string {
	return `${position.row}:${position.column}`
}
