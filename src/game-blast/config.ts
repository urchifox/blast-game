export const GAP_X = 0
export const GAP_Y = -0.1

export const TILE_RATIO = 100 / 112
export const MAX_TILE_WIDTH = 70
export const MAX_TILE_HEIGHT = MAX_TILE_WIDTH * TILE_RATIO

export const TILES_KINDS_NORMAL = [
	"blue",
	"green",
	"purple",
	"red",
	"yellow",
] as const

export const TILES_KINDS_SPECIAL = [
	"bomb",
	"dynamite",
	"rockets-column",
	"rockets-row",
] as const

export const BOOSTER_NAMES = ["bomb", "teleport"] as const

/** tile heights per second */
export const TILE_FALL_SPEED = 10
export const MIN_TILE_FALL_DURATION_MS = 10
export const TILE_BOUNCE_DURATION_MS = 150
export const TILE_BOUNCE_HEIGHT_RATIO = 0.05
export const TILE_APPEAR_DURATION_MS = 150
export const TILE_REMOVE_DURATION_MS = 150
export const TILE_DELAY_BETWEEN_REMOVALS_MS = TILE_REMOVE_DURATION_MS / 4
export const TILE_SHUFFLE_DURATION_MS = 900
