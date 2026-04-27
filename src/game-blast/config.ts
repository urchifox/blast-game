/** k in power scale formula */
export const BASE_SCORE = 5
/** p in power scale formula */
export const GROWTH_EXPONENT = 1.5

export const DEFAULT_COLUMNS = 9
export const DEFAULT_ROWS = 9

export const MIN_GOAL_SCORE = 500
export const MAX_GOAL_SCORE = 1000

export const MIN_AVG_COMBO = 2
export const MAX_AVG_COMBO = 4

export const GAP_X = 0
export const GAP_Y = -0.1

export const TILE_RATIO = 100 / 112
export const MAX_TILE_WIDTH = 70
export const MAX_TILE_HEIGHT = MAX_TILE_WIDTH * TILE_RATIO

export const TILES_KINDS_NORMAL = [
	"blue",
	"green",
	"purpure",
	"red",
	"yellow",
] as const

export const TILES_KINDS_SPECIAL = [
	"bomb",
	"dynamite",
	"rockets-column",
	"rockets-row",
] as const
