import { FirstConstructorArg, UnionToIntersection } from "../../helpers/types"
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
		"name" | "initialValue"
	>
}

export function boosterManagerFactory(props: BoosterManagerFactoryProps) {
	const { gameRules, boosterProps, fieldQueries, presenter } = props

	const boostersHandlersMap = {
		bomb: new BoosterHandlerBomb({
			booster: new Booster({
				name: "bomb",
				initialValue: gameRules.BOOSTER_BOMBS_COUNT,
				...boosterProps,
			}),
			fieldQueries: fieldQueries,
			presenter: presenter,
			gameRules: gameRules,
		}),
		teleport: new BoosterHandlerTeleport({
			booster: new Booster({
				name: "teleport",
				initialValue: gameRules.BOOSTER_TELEPORT_COUNT,
				...boosterProps,
			}),
			presenter: presenter,
			gameRules: gameRules,
		}),
	}

	return new BoosterManager({
		boostersHandlersMap: boostersHandlersMap,
	})
}
