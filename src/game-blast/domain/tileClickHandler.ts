import { pickRandomItem, RandomizationFunction } from "../../helpers/random"
import { Command, CommandName } from "./command"
import { FieldQueries } from "./fieldQueries"
import { GameRules } from "./gameRules"
import { isTileKindNormal, Tile, TileKind } from "./tile"

export type TileClickHandlerProps = {
	gameRules: GameRules
	fieldQueries: FieldQueries
	randomizationFunction: RandomizationFunction
}

export class TileClickHandler {
	private readonly gameRules: TileClickHandlerProps["gameRules"]
	private readonly fieldQueries: TileClickHandlerProps["fieldQueries"]
	private readonly randomizationFunction: TileClickHandlerProps["randomizationFunction"]

	private rewardableComboSizesSorted: Array<number>

	constructor(props: TileClickHandlerProps) {
		this.gameRules = props.gameRules
		this.fieldQueries = props.fieldQueries
		this.randomizationFunction = props.randomizationFunction

		this.rewardableComboSizesSorted = Object.keys(
			this.gameRules.REWARD_BY_COMBO_SIZE
		)
			.map((key) => parseInt(key))
			.sort((a, b) => a - b)
	}

	onClick(tile: Tile) {
		const connection = this.getConnections(tile)
		if (connection === null) {
			return null
		}

		const { tiles } = connection
		const minTilesCount = isTileKindNormal(tile.getKind())
			? this.gameRules.MIN_COMBO_SIZE
			: 1

		const tilesNumber = tiles.size
		if (tilesNumber < minTilesCount) {
			return null
		}

		const commands: Array<Command> = [
			{
				name: CommandName.REMOVE,
				payload: {
					tiles: tiles,
					removingFromPosition: tile.getPosition(),
				},
			},
		]

		const rewardType = this.getComboRewardType(tile.getKind(), tilesNumber)
		if (rewardType !== null) {
			commands.push({
				name: CommandName.ADD,
				payload: {
					kind: rewardType,
					position: tile.getPosition(),
				},
			})
		}

		return commands
	}

	private getConnections(tile: Tile) {
		if (isTileKindNormal(tile.getKind())) {
			return this.fieldQueries.getSameKindNeighbourTiles(tile)
		}

		const tilePosition = tile.getPosition()

		switch (tile.getKind()) {
			case "bomb": {
				return this.fieldQueries.getTilesInRadius(
					tilePosition,
					this.gameRules.TILE_BOMB_RADIUS
				)
			}
			case "dynamite": {
				return {
					tiles: new Set(this.fieldQueries.getTiles()),
					positions: new Set(this.fieldQueries.getPositions()),
				}
			}
			case "rockets-column": {
				return this.fieldQueries.getTilesInColumn(tilePosition.column)
			}
			case "rockets-row": {
				return this.fieldQueries.getTilesInRow(tilePosition.row)
			}
			default: {
				return null
			}
		}
	}

	private getComboRewardType(tileKind: TileKind, comboSize: number) {
		if (!isTileKindNormal(tileKind)) {
			return null
		}

		const closestRewardableComboSize = this.rewardableComboSizesSorted.find(
			(value, index) =>
				this.isClosestRewardableComboSize({ comboSize, value, index })
		)
		if (closestRewardableComboSize === undefined) {
			return null
		}

		const rewardsTypes =
			this.gameRules.REWARD_BY_COMBO_SIZE[closestRewardableComboSize]
		if (rewardsTypes === undefined) {
			return null
		}

		const rewardType = pickRandomItem(rewardsTypes, this.randomizationFunction)
		return rewardType
	}

	private isClosestRewardableComboSize({
		comboSize,
		value,
		index,
	}: {
		comboSize: number
		value: number
		index: number
	}) {
		if (value > comboSize) {
			return false
		}

		const isLastValue = index === this.rewardableComboSizesSorted.length - 1
		if (isLastValue) {
			return true
		}

		const nextValue = this.rewardableComboSizesSorted[index + 1]
		return nextValue > comboSize
	}
}
