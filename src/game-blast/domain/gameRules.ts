import { TileKindSpecial,  } from "./tile"
import { BoosterName } from "./types"

export class GameRules {
	readonly MIN_GOAL_SCORE = 1000
	readonly MAX_GOAL_SCORE = 5000

	readonly MIN_AVG_COMBO = 5
	readonly MAX_AVG_COMBO = 10
	readonly MIN_COMBO_SIZE = 2

	readonly REWARD_BY_COMBO_SIZE: Record<number, Array<TileKindSpecial>> = {
		4: ["rockets-column", "rockets-row"],
		6: ["bomb"],
		8: ["dynamite"],
	}

	readonly MAX_SHUFFLE_ATTEMPTS = 3

	readonly DEFAULT_COLUMNS = 9
	readonly DEFAULT_ROWS = 9

	readonly BOOSTER_INITIAL_VALUE: Record<BoosterName, number> = {
		bomb: 3,
		teleport: 5,
	}

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
