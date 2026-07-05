import { Booster, BoosterProps } from "./booster"
import { Tile } from "./tile"

export abstract class BoosterHandler {
	readonly booster: Booster

	constructor(props: BoosterProps) {
		this.booster = new Booster(props)
	}

	abstract use(tile: Tile): void
	abstract clear(): void
}
