import { pickRandomItem } from "../../helpers/random"
import { TILES_KINDS_NORMAL } from "../config"
import { Tile, TileKind, TilePosition } from "../tile"
import { TileHandlerBomb } from "./tileHandlerBomb"
import { TileHandlerDynamite } from "./tileHandlerDynamite"
import { TileHandlerNormal } from "./tileHandlerNormal"
import { TileHandlerRocketColumn } from "./tileHandlerRocketColumn"
import { TileHandlerRocketRow } from "./tileHandlerRocketRow"
import { TileHandlerSpecial } from "./tileHandlerSpecial"
import { TileClickHandler } from "../types"
import { GameRules } from "../gameRules"
import { Presenter } from "../presenter"
import { FieldQueries } from "../fieldQueries"

export type TileClickManagerProps = {
	fieldQueries: FieldQueries
	presenter: Pick<
		Presenter,
		| "getSameKindNeighbourTiles"
		| "renderTile"
		| "addTile"
		| "removeTiles"
		| "removeTilesFromCenter"
	>
	gameRules: GameRules
}

export class TileClickManager {
	private readonly presenter: TileClickManagerProps["presenter"]

	private tileHandlersSpecialMapByComboSize: Record<
		number,
		Array<TileHandlerSpecial>
	>
	private tileClickHandlersMapByKind: Record<TileKind, TileClickHandler>
	private rewardableComboSizesSorted: Array<number>

	constructor(props: TileClickManagerProps) {
		this.presenter = props.presenter
		const tileHandlersSpecial: Array<TileHandlerSpecial> = [
			new TileHandlerBomb({
				fieldQueries: props.fieldQueries,
				presenter: props.presenter,
				gameRules: props.gameRules,
			}),
			new TileHandlerDynamite({
				fieldQueries: props.fieldQueries,
				presenter: props.presenter,
				gameRules: props.gameRules,
			}),
			new TileHandlerRocketRow({
				fieldQueries: props.fieldQueries,
				presenter: props.presenter,
				gameRules: props.gameRules,
			}),
			new TileHandlerRocketColumn({
				fieldQueries: props.fieldQueries,
				presenter: props.presenter,
				gameRules: props.gameRules,
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
			presenter: props.presenter,
			getComboPrize: this.getComboPrize.bind(this),
			gameRules: props.gameRules,
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
		const newTile = this.presenter.addTile({
			kind: rewardHandler.kind,
			position,
		})

		return newTile
	}
}
