export class GameRules {
	readonly MIN_GOAL_SCORE = 1000
	readonly MAX_GOAL_SCORE = 5000

	readonly MIN_AVG_COMBO = 5
	readonly MAX_AVG_COMBO = 10
	readonly MIN_COMBO_SIZE = 2

	readonly ROCKET_COLUMN_COMBO_SIZE = 4
	readonly ROCKET_ROW_COMBO_SIZE = 4
	readonly BOMB_COMBO_SIZE = 6
	readonly DYNAMITE_COMBO_SIZE = 8

	readonly MAX_SHUFFLE_ATTEMPTS = 3

	readonly DEFAULT_COLUMNS = 9
	readonly DEFAULT_ROWS = 9

	readonly BOOSTER_BOMBS_COUNT = 3
	readonly BOOSTER_TELEPORT_COUNT = 5

	readonly BOOSTER_BOMB_RADIUS = 2
	readonly TILE_BOMB_RADIUS = 2

	/** k in power scale formula */
	private readonly BASE_SCORE = 5
	/** p in power scale formula */
	private readonly GROWTH_EXPONENT = 1.5
	/** Uses power scale formula */
	getPoints(removedTilesNumber: number) {
		return Math.round(
			this.BASE_SCORE * Math.pow(removedTilesNumber, this.GROWTH_EXPONENT)
		)
	}
}
