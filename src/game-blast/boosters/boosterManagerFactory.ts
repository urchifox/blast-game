import { FirstConstructorArg, UnionToIntersection } from "../../helpers/types"
import { BoosterHandlerBomb } from "./boosterHandlerBomb"
import { BoosterHandlerTeleport } from "./boosterHandlerTeleport"
import { BoosterManager } from "./boosterManager"

type Boosters = typeof BoosterHandlerBomb | typeof BoosterHandlerTeleport

export type BoosterManagerFactoryProps = UnionToIntersection<
	FirstConstructorArg<Boosters>
>

export function boosterManagerFactory(props: BoosterManagerFactoryProps) {
	const boostersHandlersMap = {
		bomb: new BoosterHandlerBomb({
			fieldQueries: props.fieldQueries,
			presenter: props.presenter,
			boosterProps: props.boosterProps,
			gameRules: props.gameRules,
		}),
		teleport: new BoosterHandlerTeleport({
			presenter: props.presenter,
			boosterProps: props.boosterProps,
			gameRules: props.gameRules,
		}),
	}

	return new BoosterManager({
		boostersHandlersMap: boostersHandlersMap,
	})
}
