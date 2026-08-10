import { ActionManager } from "../actionManager"
import { BoosterCounter } from "../domain/boosterCounter"
import { BoosterUseHandler } from "../domain/boosterUseHandler"
import { BOOSTER_NAMES } from "../domain/config"
import { FieldQueries } from "../domain/fieldQueries"
import { GameRules } from "../domain/gameRules"
import { BoosterName } from "../domain/types"
import { Booster } from "./booster"
import { BoosterHandler } from "./boosterHandler"
import { BoosterManager } from "./boosterManager"

export type BoosterManagerFactoryProps = {
	updateCounter: (boosterName: BoosterName, currentValue: number) => void
	onActivationChange: (boosterName: BoosterName, isActivated: boolean) => void
	gameRules: GameRules
	fieldQueries: FieldQueries
	actionManager: ActionManager
}

export function boosterManagerFactory(props: BoosterManagerFactoryProps) {
	const { gameRules, fieldQueries, actionManager, ...boosterProps } = props

	const boosterUseHandler = new BoosterUseHandler({
		gameRules: gameRules,
		fieldQueries: fieldQueries,
	})

	const boostersHandlersMap = BOOSTER_NAMES.reduce(
		(acc, name) => {
			const updateCounter = (currentValue: number) =>
				boosterProps.updateCounter(name, currentValue)
			const boosterCounter = new BoosterCounter({
				startValue: gameRules.BOOSTER_INITIAL_VALUE[name],
				endValue: 0,
			})
			const booster = new Booster({
				...boosterProps,
				name: name,
				boosterCounter: boosterCounter,
				updateCounter: updateCounter,
			})

			acc[name] = new BoosterHandler({
				name: name,
				boosterUseHandler: boosterUseHandler,
				booster: booster,
				actionManager: actionManager,
			})
			return acc
		},
		{} as Record<BoosterName, BoosterHandler>
	)

	return new BoosterManager({
		boostersHandlersMap: boostersHandlersMap,
	})
}
