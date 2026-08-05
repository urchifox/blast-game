import { FirstConstructorArg, UnionToIntersection } from "../../helpers/types"
import { TileClickManager, TileClickManagerProps } from "./tileClickManager"
import { TileHandlerBomb } from "./tileHandlerBomb"
import { TileHandlerDynamite } from "./tileHandlerDynamite"
import { TileHandlerNormal } from "./tileHandlerNormal"
import { TileHandlerRocketColumn } from "./tileHandlerRocketColumn"
import { TileHandlerRocketRow } from "./tileHandlerRocketRow"
import { TileHandlerSpecial } from "./tileHandlerSpecial"

type TileHandlers =
	| typeof TileHandlerBomb
	| typeof TileHandlerDynamite
	| typeof TileHandlerRocketRow
	| typeof TileHandlerRocketColumn
	| typeof TileHandlerNormal

type TileClickManagerFactoryProps = UnionToIntersection<
	FirstConstructorArg<TileHandlers>
> &
	Pick<TileClickManagerProps, "presenter" | "randomizationFunction">

export function tileClickManagerFactory(props: TileClickManagerFactoryProps) {
	const { fieldQueries, presenter, gameRules, randomizationFunction } = props

	const tileHandlersSpecial: Array<TileHandlerSpecial> = [
		new TileHandlerBomb({
			fieldQueries: fieldQueries,
			presenter: presenter,
			gameRules: gameRules,
		}),
		new TileHandlerDynamite({
			fieldQueries: fieldQueries,
			presenter: presenter,
			gameRules: gameRules,
		}),
		new TileHandlerRocketRow({
			fieldQueries: fieldQueries,
			presenter: presenter,
			gameRules: gameRules,
		}),
		new TileHandlerRocketColumn({
			fieldQueries: fieldQueries,
			presenter: presenter,
			gameRules: gameRules,
		}),
	]

	const tileHandlerNormal = new TileHandlerNormal({
		fieldQueries: fieldQueries,
		presenter: presenter,
		gameRules: gameRules,
	})

	return new TileClickManager({
		presenter: presenter,
		randomizationFunction: randomizationFunction,
		tileHandlerNormal: tileHandlerNormal,
		tileHandlersSpecial: tileHandlersSpecial,
	})
}
