import { pickRandomItem } from "../helpers/random"
import { TILES_KINDS_NORMAL } from "./config"
import { Tile, TileKind, TilePosition } from "./tile"
import { TileHandlerBomb } from "./tileHandlerBomb"
import { TileHandlerDynamite } from "./tileHandlerDynamite"
import { TileHandlerNormal } from "./tileHandlerNormal"
import { TileHandlerRocketColumn } from "./tileHandlerRocketColumn"
import { TileHandlerRocketRow } from "./tileHandlerRocketRow"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileClickHandler } from "./types"

export type TileClickManagerProps = {
	getTiles: () => Array<Tile>
	getTilesInRadius: (
		position: TilePosition,
		radius: number
	) => {
		tiles: Set<Tile>
		positions: Set<TilePosition>
	}
	getTilesInRow: (row: number) => {
		tiles: Set<Tile>
		positions: Set<TilePosition>
	}
	getTilesInColumn: (column: number) => {
		tiles: Set<Tile>
		positions: Set<TilePosition>
	}
	getSameKindNeighbourTiles: (tile: Tile) => {
		tilesToRemove: Set<Tile>
		positionsToRemove: Set<TilePosition>
	}
	renderTile: (tile: Tile) => Promise<void>
	addTile: ({
		kind,
		position,
	}: {
		kind: TileKind
		position: TilePosition
	}) => Tile
	removeTiles: (tiles: Set<Tile>) => Promise<void>
	removeTilesFromCenter: (
		tiles: Set<Tile>,
		centerPosition: TilePosition
	) => Promise<void>
	getPositions: () => Array<TilePosition>
}

export class TileClickManager {
	private tileHandlersSpecialMapByComboSize: Record<
		number,
		Array<TileHandlerSpecial>
	>
	private tileClickHandlersMapByKind: Record<TileKind, TileClickHandler>
	private rewardableComboSizesSorted: Array<number>

	private addTile: TileClickManagerProps["addTile"]

	constructor({
		getTiles,
		getTilesInRadius,
		getTilesInRow,
		getTilesInColumn,
		getSameKindNeighbourTiles,
		renderTile,
		addTile,
		removeTiles,
		removeTilesFromCenter,
		getPositions,
	}: TileClickManagerProps) {
		this.addTile = addTile

		const tileHandlersSpecial: Array<TileHandlerSpecial> = [
			new TileHandlerBomb({
				getTilesInRadius,
				removeTilesFromCenter,
			}),
			new TileHandlerDynamite({
				removeTilesFromCenter,
				getTiles,
				getPositions,
			}),
			new TileHandlerRocketRow({
				getTilesInRow,
				removeTilesFromCenter,
				getTilesInRadius,
			}),
			new TileHandlerRocketColumn({
				getTilesInColumn,
				removeTilesFromCenter,
				getTilesInRadius,
			}),
		]

		this.tileHandlersSpecialMapByComboSize = tileHandlersSpecial.reduce<
			Record<number, Array<TileHandlerSpecial>>
		>((map, handler) => {
			if (map[handler.comboSize] === undefined) {
				map[handler.comboSize] = []
			}
			map[handler.comboSize].push(handler)
			return map
		}, {})

		this.tileClickHandlersMapByKind = tileHandlersSpecial.reduce<
			Record<TileKind, TileClickHandler>
		>(
			(map, handler) => {
				map[handler.kind] = handler.onClick.bind(handler)
				return map
			},
			{} as Record<TileKind, TileClickHandler>
		)

		this.rewardableComboSizesSorted = Object.keys(
			this.tileHandlersSpecialMapByComboSize
		)
			.map((key) => parseInt(key))
			.sort((a, b) => a - b)

		const tileHandlerNormal = new TileHandlerNormal({
			getSameKindNeighbourTiles,
			removeTiles,
			getComboPrize: this.getComboPrize.bind(this),
			renderTile,
		})

		TILES_KINDS_NORMAL.forEach((kind) => {
			this.tileClickHandlersMapByKind[kind] =
				tileHandlerNormal.onClick.bind(tileHandlerNormal)
		})
	}

	onClick(tile: Tile) {
		const kind = tile.getKind()
		const handler = this.tileClickHandlersMapByKind[kind]
		return handler(tile)
	}

	private getComboPrize(comboSize: number, position: TilePosition) {
		const closestRewardableComboSize = this.rewardableComboSizesSorted.find(
			(value, index, array) => {
				const currentValue = value
				const isCurrentValueLess = currentValue <= comboSize
				if (!isCurrentValueLess) {
					return false
				}
				const isLastValue = index === array.length - 1
				if (isLastValue) {
					return true
				}
				const nextValue = array[index + 1]
				const isNextValueGreater = nextValue > comboSize
				return isNextValueGreater
			}
		)
		if (closestRewardableComboSize === undefined) {
			return
		}

		const rewardsHandlers =
			this.tileHandlersSpecialMapByComboSize[closestRewardableComboSize]
		if (rewardsHandlers === undefined) {
			return
		}

		const rewardHandler = pickRandomItem(rewardsHandlers)
		const newTile = this.addTile({
			kind: rewardHandler.kind,
			position,
		})

		return newTile
	}
}
