import {
	TileHandler,
	TileHandlerProps,
} from "../domain/tileHandler"
import { TileClickManager, TileClickManagerProps } from "./tileClickManager"

type TileClickManagerFactoryProps = TileHandlerProps &
	Omit<TileClickManagerProps, "tileHandler">

export function tileClickManagerFactory(props: TileClickManagerFactoryProps) {
	const { fieldQueries, actionManager, gameRules, randomizationFunction } =
		props

	const tileHandler = new TileHandler({
		fieldQueries: fieldQueries,
		gameRules: gameRules,
		randomizationFunction: randomizationFunction,
	})

	return new TileClickManager({
		actionManager: actionManager,
		tileHandler: tileHandler,
	})
}
