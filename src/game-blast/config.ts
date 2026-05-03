/** k in power scale formula */
export const BASE_SCORE = 5
/** p in power scale formula */
export const GROWTH_EXPONENT = 1.5

export const DEFAULT_COLUMNS = 9
export const DEFAULT_ROWS = 9

export const MIN_GOAL_SCORE = 1000
export const MAX_GOAL_SCORE = 5000

export const MIN_AVG_COMBO = 5
export const MAX_AVG_COMBO = 10

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

export const MIN_COMBO_SIZE = 2

export const TILE_BOMB_RADIUS = 2

/** tile heights per second */
export const TILE_FALL_SPEED = 10
export const MIN_TILE_FALL_DURATION_MS = 10
export const TILE_BOUNCE_DURATION_MS = 150
export const TILE_BOUNCE_HEIGHT_RATIO = 0.05
export const TILE_APPEAR_DURATION_MS = 150
export const TILE_REMOVE_DURATION_MS = 150
export const TILE_DELAY_BETWEEN_REMOVALS_MS = TILE_REMOVE_DURATION_MS / 4
export const TILE_SHUFFLE_DURATION_MS = 900

export const MAX_SHUFFLE_ATTEMPTS = 3

export const BOOSTER_BOMBS_COUNT = 3
export const BOOSTER_TELEPORT_COUNT = 5
export const BOOSTER_BOMB_RADIUS = 2
