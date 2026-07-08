import { Tile } from "../tile"
import { TileClickHandlerResult } from "../types"

export abstract class TileHandler {
	abstract onClick(tile: Tile): TileClickHandlerResult
}
