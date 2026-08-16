import {
	TileHandler,
	TileHandlerProps,
} from "../domain/tileHandler"
import { TilesManager, TilesManagerProps } from "./tilesManager"

type TilesManagerFactoryProps = TileHandlerProps &
	Omit<TilesManagerProps, "tileHandler">

export function tilesManagerFactory(props: TilesManagerFactoryProps) {
	const { fieldQueries, actionManager, gameRules, randomizationFunction } =
		props

	const tileHandler = new TileHandler({
		fieldQueries: fieldQueries,
		gameRules: gameRules,
		randomizationFunction: randomizationFunction,
	})

	return new TilesManager({
		actionManager: actionManager,
		tileHandler: tileHandler,
	})
}
