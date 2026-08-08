import { TileClickHandler, TileClickHandlerProps } from "./tileClickHandler"
import { TileClickManager, TileClickManagerProps } from "./tileClickManager"

type TileClickManagerFactoryProps = TileClickHandlerProps &
	Omit<TileClickManagerProps, "tileClickHandler">

export function tileClickManagerFactory(props: TileClickManagerFactoryProps) {
	const { fieldQueries, presenter, gameRules, randomizationFunction } = props

	const tileClickHandler = new TileClickHandler({
		fieldQueries: fieldQueries,
		gameRules: gameRules,
		randomizationFunction: randomizationFunction,
	})

	return new TileClickManager({
		presenter: presenter,
		tileClickHandler: tileClickHandler,
	})
}
