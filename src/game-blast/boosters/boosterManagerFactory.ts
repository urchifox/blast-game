import { Progress } from "../../helpers/progress"
import { FirstConstructorArg, UnionToIntersection } from "../../helpers/types"
import { BoosterName } from "../types"
import { Booster } from "./booster"
import { BoosterHandlerBomb } from "./boosterHandlerBomb"
import { BoosterHandlerTeleport } from "./boosterHandlerTeleport"
import { BoosterManager } from "./boosterManager"

type Boosters = typeof BoosterHandlerBomb | typeof BoosterHandlerTeleport

export type BoosterManagerFactoryProps = Omit<
	UnionToIntersection<FirstConstructorArg<Boosters>>,
	"booster"
> & {
	boosterProps: Omit<
		FirstConstructorArg<typeof Booster>,
		"name" | "initialValue" | "progress"
	>
}

export function boosterManagerFactory(props: BoosterManagerFactoryProps) {
	const { gameRules, boosterProps, fieldQueries, presenter } = props

	const getBoosterProps = (name: BoosterName) => {
		const initialValue = gameRules.BOOSTER_INITIAL_VALUE[name]
		const progress = new Progress({
			updateCounter: ({ currentValue }) =>
				props.boosterProps.updateCounter(name, currentValue),
			isDirectionDown: true,
		})
		return {
			...boosterProps,
			name: name,
			initialValue: initialValue,
			progress: progress,
		}
	}

	const boostersHandlersMap = {
		bomb: new BoosterHandlerBomb({
			booster: new Booster({
				...getBoosterProps("bomb"),
			}),
			fieldQueries: fieldQueries,
			presenter: presenter,
			gameRules: gameRules,
		}),
		teleport: new BoosterHandlerTeleport({
			booster: new Booster({
				...getBoosterProps("teleport"),
			}),
			presenter: presenter,
			gameRules: gameRules,
		}),
	}

	return new BoosterManager({
		boostersHandlersMap: boostersHandlersMap,
	})
}
