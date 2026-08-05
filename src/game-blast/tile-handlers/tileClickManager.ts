import { pickRandomItem, RandomizationFunction } from "../../helpers/random"
import { TILES_KINDS_NORMAL } from "../config"
import { Tile, TileKind, TilePosition } from "../tile"
import { TileHandlerNormal } from "./tileHandlerNormal"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileClickHandler } from "../types"
import { Presenter } from "../presenter"

export type TileClickManagerProps = {
	presenter: Pick<Presenter, "renderTile" | "addTile">
	randomizationFunction: RandomizationFunction
	tileHandlerNormal: TileHandlerNormal
	tileHandlersSpecial: Array<TileHandlerSpecial>
}

export class TileClickManager {
	private readonly presenter: TileClickManagerProps["presenter"]
	private readonly randomizationFunction: TileClickManagerProps["randomizationFunction"]

	private tileHandlersSpecialMapByComboSize: Record<
		number,
		Array<TileHandlerSpecial>
	>
	private tileClickHandlersMapByKind: Record<TileKind, TileClickHandler>
	private rewardableComboSizesSorted: Array<number>

	constructor(props: TileClickManagerProps) {
		this.presenter = props.presenter
		this.randomizationFunction = props.randomizationFunction

		this.tileHandlersSpecialMapByComboSize = props.tileHandlersSpecial.reduce<
			Record<number, Array<TileHandlerSpecial>>
		>((map, handler) => {
			if (map[handler.comboSize] === undefined) {
				map[handler.comboSize] = []
			}
			map[handler.comboSize].push(handler)
			return map
		}, {})

		this.tileClickHandlersMapByKind = props.tileHandlersSpecial.reduce<
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

		TILES_KINDS_NORMAL.forEach((kind) => {
			this.tileClickHandlersMapByKind[kind] = (tile: Tile) => {
				const result = props.tileHandlerNormal.onClick(tile)
				if (result === null) {
					return result
				}
				const newTile = this.getComboPrize(
					result.removedTiles.size,
					tile.getPosition()
				)
				if (newTile === undefined) {
					return result
				}
				return {
					...result,
					removingPromise: result.removingPromise.then(() =>
						this.presenter.renderTile(newTile)
					),
				}
			}
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

		const rewardHandler = pickRandomItem(
			rewardsHandlers,
			this.randomizationFunction
		)
		const newTile = this.presenter.addTile({
			kind: rewardHandler.kind,
			position,
		})

		return newTile
	}
}
