import { ActionManager } from "./actionManager"
import { BoosterCounter } from "../domain/boosterCounter"
import { BoosterUseHandler } from "../domain/boosterUseHandler"
import { BOOSTER_NAMES } from "../domain/config"
import { FieldQueries } from "../domain/fieldQueries"
import { GameRules } from "../domain/gameRules"
import { BoosterName } from "../domain/types"
import { Booster } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { BoosterManager } from "./boosterManager"
import { BoosterUIContract, BoosterUIMap } from "../types"

export type BoosterManagerFactoryProps = {
	boosterUIMap: BoosterUIMap
	gameRules: GameRules
	fieldQueries: FieldQueries
	actionManager: ActionManager
}

export function boosterManagerFactory(props: BoosterManagerFactoryProps) {
	const { gameRules, fieldQueries, actionManager, boosterUIMap } = props

	const boosterUseHandler = new BoosterUseHandler({
		gameRules: gameRules,
		fieldQueries: fieldQueries,
	})

	const boostersHandlersMap = BOOSTER_NAMES.reduce(
		(acc, name) => {
			const boosterUI = boosterUIMap[name]
			const boosterHandler = createBoosterHandler({
				boosterUseHandler,
				gameRules,
				actionManager,
				name,
				boosterUI,
			})
			acc[name] = boosterHandler
			return acc
		},
		{} as Record<BoosterName, BoosterHandler>
	)

	const boosterManager = new BoosterManager({
		boostersHandlersMap: boostersHandlersMap,
		actionManager: actionManager,
		fieldQueries: fieldQueries,
	})

	return boosterManager
}

export function createBoosterHandler({
	boosterUseHandler,
	gameRules,
	actionManager,
	name,
	boosterUI,
}: {
	boosterUseHandler: BoosterUseHandler
	gameRules: GameRules
	actionManager: ActionManager
	name: BoosterName
	boosterUI: BoosterUIContract
}) {
	const boosterCounter = new BoosterCounter({
		startValue: gameRules.BOOSTER_INITIAL_VALUE[name],
		endValue: 0,
	})

	const booster = new Booster({
		boosterCounter: boosterCounter,
		boosterUI: boosterUI,
	})

	const boosterHandler = new BoosterHandler({
		name,
		boosterUseHandler,
		booster,
		actionManager,
	})

	return boosterHandler
}
