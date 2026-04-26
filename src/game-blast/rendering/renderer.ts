import { GridSnapshot } from "../grid"
import { Tile } from "../tile"

export type Renderer = {
	// new (props: {
	// 	container: HTMLElement
	// 	getFieldSnapshot: () => GridSnapshot
	// }): Renderer

	init(): Promise<void>
	destroy(): void
	renderTiles({
		tiles,
		gridSnapshot,
	}: {
		tiles: ReadonlyArray<Tile>
		gridSnapshot: GridSnapshot
	}): void
	resize(gridSnapshot: GridSnapshot): void
	clearTiles(): void
}
