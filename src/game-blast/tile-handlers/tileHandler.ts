import { GameRules } from "../gameRules"
import { Tile } from "../tile"
import { TileRemovingInfo } from "../types"

export type TileHandlerProps = {
	gameRules: GameRules
}

export abstract class TileHandler {
	readonly gameRules: TileHandlerProps["gameRules"]

	constructor(props: TileHandlerProps) {
		this.gameRules = props.gameRules
	}

	abstract onClick(tile: Tile): TileRemovingInfo
}
