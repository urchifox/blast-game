import { TileHandler } from "./tileHandler"
import { TileKindSpecial } from "./tile"

export abstract class TileHandlerSpecial extends TileHandler {
	abstract readonly comboSize: number
	abstract readonly kind: TileKindSpecial
}
