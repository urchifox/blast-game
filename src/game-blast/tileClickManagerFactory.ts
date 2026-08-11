import {
	TileClickHandler,
	TileClickHandlerProps,
} from "./domain/tileClickHandler"
import { TileClickManager, TileClickManagerProps } from "./tileClickManager"

type TileClickManagerFactoryProps = TileClickHandlerProps &
	Omit<TileClickManagerProps, "tileClickHandler">

export function tileClickManagerFactory(props: TileClickManagerFactoryProps) {
	const { fieldQueries, actionManager, gameRules, randomizationFunction } =
		props

	const tileClickHandler = new TileClickHandler({
		fieldQueries: fieldQueries,
		gameRules: gameRules,
		randomizationFunction: randomizationFunction,
	})

	return new TileClickManager({
		actionManager: actionManager,
		tileClickHandler: tileClickHandler,
	})
}
