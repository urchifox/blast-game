import { Command, CommandName } from "./command"
import { GameRules } from "./gameRules"
import { createField } from "./testHelpers"
import { Tile, TileProps } from "./tile"
import { TileHandler } from "./tileHandler"

function createTileHandler() {
	const { fieldQueries } = createField({
		columns: 7,
		rows: 7,
		tilesProps: new Set(tilesProps),
	})
	const tileHandler = new TileHandler({
		gameRules: new GameRules(),
		fieldQueries: fieldQueries,
		randomizationFunction: () => 0,
	})
	return {
		tileHandler,
		fieldQueries,
	}
}

const tilesProps = [
	{
		kind: "green",
		position: {
			row: 0,
			column: 0,
		},
		id: "mpdtppZLdhmA8UgVB2Ftj",
	},
	{
		kind: "yellow",
		position: {
			row: 1,
			column: 0,
		},
		id: "AalR8vxWVB1zNItuNwpMO",
	},
	{
		kind: "purple",
		position: {
			row: 2,
			column: 0,
		},
		id: "UKXcqShPB9GCWYSFxRC1s",
	},
	{
		kind: "purple",
		position: {
			row: 3,
			column: 0,
		},
		id: "hVCUOn_vqjOlsXFlRNIjP",
	},
	{
		kind: "purple",
		position: {
			row: 4,
			column: 0,
		},
		id: "A2bGsklBCfLDNkqp8zsAx",
	},
	{
		kind: "purple",
		position: {
			row: 5,
			column: 0,
		},
		id: "TXoSwJ_ZdjfZp_Ii5Vbpu",
	},
	{
		kind: "bomb",
		position: {
			row: 6,
			column: 0,
		},
		id: "IeWlopBGZTJTHmBOaSTb9",
	},
	{
		kind: "rockets-column",
		position: {
			row: 0,
			column: 1,
		},
		id: "0s8EGBE6xUbd1aOD429pt",
	},
	{
		kind: "yellow",
		position: {
			row: 1,
			column: 1,
		},
		id: "ZM8U9Is2pQdFqBrefl6YV",
	},
	{
		kind: "purple",
		position: {
			row: 2,
			column: 1,
		},
		id: "38xEVwYHxgV05c65mteSK",
	},
	{
		kind: "yellow",
		position: {
			row: 3,
			column: 1,
		},
		id: "mIuMp9dDlEB3JzKV2_58-",
	},
	{
		kind: "green",
		position: {
			row: 4,
			column: 1,
		},
		id: "wLY2bqEwJHGkW5abfgHo1",
	},
	{
		kind: "yellow",
		position: {
			row: 5,
			column: 1,
		},
		id: "DltUO4tlfqQO1gH8ByLIQ",
	},
	{
		kind: "yellow",
		position: {
			row: 6,
			column: 1,
		},
		id: "bIQbGyXbEyfe2ORXttpNQ",
	},
	{
		kind: "rockets-row",
		position: {
			row: 0,
			column: 2,
		},
		id: "7cX4NEgHt0lukEz6tp4bI",
	},
	{
		kind: "purple",
		position: {
			row: 1,
			column: 2,
		},
		id: "W9_vTccul6w74J0CLK4cT",
	},
	{
		kind: "purple",
		position: {
			row: 2,
			column: 2,
		},
		id: "U3AkJlTnmotu8ArUZc0zS",
	},
	{
		kind: "yellow",
		position: {
			row: 3,
			column: 2,
		},
		id: "jKIHoCCMs8vLPZ8ghl0n1",
	},
	{
		kind: "green",
		position: {
			row: 4,
			column: 2,
		},
		id: "ALwYfW92A1s3_7xAFQuFB",
	},
	{
		kind: "yellow",
		position: {
			row: 5,
			column: 2,
		},
		id: "osBu_Uz0ESxi-VZ6AgZ0Z",
	},
	{
		kind: "yellow",
		position: {
			row: 6,
			column: 2,
		},
		id: "maFiBh6Ir5uxVJooYfUPt",
	},
	{
		kind: "red",
		position: {
			row: 0,
			column: 3,
		},
		id: "7ZVItpkLYRonE_efq0l6g",
	},
	{
		kind: "purple",
		position: {
			row: 1,
			column: 3,
		},
		id: "pnV7CT3U_PJIdBdAvetVL",
	},
	{
		kind: "yellow",
		position: {
			row: 2,
			column: 3,
		},
		id: "LTeFSLsUYC2IM4GrgW9xf",
	},
	{
		kind: "yellow",
		position: {
			row: 3,
			column: 3,
		},
		id: "XcsGn4LgIDcuXo-ek6AMU",
	},
	{
		kind: "green",
		position: {
			row: 4,
			column: 3,
		},
		id: "zW5Y_2tuQY_CC6ll6GSaQ",
	},
	{
		kind: "yellow",
		position: {
			row: 5,
			column: 3,
		},
		id: "j1opsfdAU531G7r-Aw58N",
	},
	{
		kind: "yellow",
		position: {
			row: 6,
			column: 3,
		},
		id: "D7wgIcqaB8L83Rwh7HKCt",
	},
	{
		kind: "red",
		position: {
			row: 0,
			column: 4,
		},
		id: "_v_Pu5do60KuYwN4hZ99E",
	},
	{
		kind: "red",
		position: {
			row: 1,
			column: 4,
		},
		id: "vWlD0DG0hSM1vABw_MYTz",
	},
	{
		kind: "yellow",
		position: {
			row: 2,
			column: 4,
		},
		id: "HF51E95M1TCHcCb9uE65n",
	},
	{
		kind: "blue",
		position: {
			row: 3,
			column: 4,
		},
		id: "6DH_TShjpI_LxuJZTyf0I",
	},
	{
		kind: "green",
		position: {
			row: 4,
			column: 4,
		},
		id: "NdM3OtEKM6aKQGr2MtqbV",
	},
	{
		kind: "dynamite",
		position: {
			row: 5,
			column: 4,
		},
		id: "5MeBpS2bJOmXyWqL5oPfx",
	},
	{
		kind: "yellow",
		position: {
			row: 6,
			column: 4,
		},
		id: "ghlVRfzdJAc87NSYjsD0k",
	},
	{
		kind: "green",
		position: {
			row: 0,
			column: 5,
		},
		id: "mK7non5l7EuKA6u8_y5Vs",
	},
	{
		kind: "green",
		position: {
			row: 1,
			column: 5,
		},
		id: "cGboV1pll55mxRmAHdXMm",
	},
	{
		kind: "green",
		position: {
			row: 2,
			column: 5,
		},
		id: "YNMPH3CbhKvlJOPYw6tzb",
	},
	{
		kind: "blue",
		position: {
			row: 3,
			column: 5,
		},
		id: "btFBtwZuHTY7tDt2WtGqh",
	},
	{
		kind: "green",
		position: {
			row: 4,
			column: 5,
		},
		id: "SbfRju1TJ4bgpZv_jLdE3",
	},
	{
		kind: "green",
		position: {
			row: 5,
			column: 5,
		},
		id: "msQipRuMpOfbXUG8DCQn9",
	},
	{
		kind: "blue",
		position: {
			row: 6,
			column: 5,
		},
		id: "ggs-rm2tpLEPSHdfIz1Vy",
	},
	{
		kind: "green",
		position: {
			row: 0,
			column: 6,
		},
		id: "cRRybom7zky6wrJCd80aP",
	},
	{
		kind: "blue",
		position: {
			row: 1,
			column: 6,
		},
		id: "Ws-Ppm0Emc7z_6zqslN_N",
	},
	{
		kind: "blue",
		position: {
			row: 2,
			column: 6,
		},
		id: "zarji_w5VDJMVjmDK4fC4",
	},
	{
		kind: "blue",
		position: {
			row: 3,
			column: 6,
		},
		id: "a3t9-yhugyplYM9933L-E",
	},
	{
		kind: "blue",
		position: {
			row: 4,
			column: 6,
		},
		id: "GglC3vT-NB56FizpbSewd",
	},
	{
		kind: "blue",
		position: {
			row: 5,
			column: 6,
		},
		id: "--8L2CYoDqGli9iRtLd1U",
	},
	{
		kind: "blue",
		position: {
			row: 6,
			column: 6,
		},
		id: "snAVBwL0LC3YODdolCdk9",
	},
] satisfies Array<TileProps>

describe("tile click handling", () => {
	it.each([{ clickedPosition: { row: 0, column: 0 } }])(
		"no commands if there is no connection to clicked tile",
		({ clickedPosition }) => {
			const { tileHandler, fieldQueries } = createTileHandler()
			const clickedTile = fieldQueries.getTileByPosition(
				clickedPosition
			) as Tile

			const commands = tileHandler.onClick(clickedTile)

			expect(commands).toBeNull()
		}
	)

	it.each([
		{
			clickedPosition: { row: 1, column: 0 },
			positionsToRemove: [
				{ row: 1, column: 0 },
				{ row: 1, column: 1 },
			],
		},
		{
			clickedPosition: { row: 0, column: 3 },
			positionsToRemove: [
				{ row: 0, column: 3 },
				{ row: 0, column: 4 },
				{ row: 1, column: 4 },
			],
		},
	])(
		"commands to remove tiles if 2 or 3 connections to clicked tile",
		({ clickedPosition, positionsToRemove }) => {
			const { tileHandler, fieldQueries } = createTileHandler()
			const clickedTile = fieldQueries.getTileByPosition(
				clickedPosition
			) as Tile

			const commands = tileHandler.onClick(clickedTile)
			const commandRemove = commands?.[0] as Command<CommandName.REMOVE>
			const tilesToRemove = commandRemove.payload.tiles
			const tilesToRemovePositions = [...tilesToRemove].map((tile) =>
				tile.getPosition()
			)

			expect(commands).toBeDefined()
			expect(commands?.length).toEqual(1)
			expect(commandRemove.name).toEqual(CommandName.REMOVE)
			expect(commandRemove.payload.removingFromPosition).toEqual(
				clickedPosition
			)
			expect(new Set(tilesToRemovePositions)).toEqual(
				new Set(positionsToRemove)
			)
		}
	)

	it.each([
		{
			clickedPosition: { row: 0, column: 6 },
			positionsToRemove: [
				{ row: 0, column: 6 },
				{ row: 0, column: 5 },
				{ row: 1, column: 5 },
				{ row: 2, column: 5 },
			],
			bonusTypes: ["rockets-column", "rockets-row"],
		},
		{
			clickedPosition: { row: 3, column: 3 },
			positionsToRemove: [
				{ row: 3, column: 3 },
				{ row: 3, column: 2 },
				{ row: 3, column: 1 },
				{ row: 2, column: 3 },
				{ row: 2, column: 4 },
			],
			bonusTypes: ["rockets-column", "rockets-row"],
		},
		{
			clickedPosition: { row: 4, column: 5 },
			positionsToRemove: [
				{ row: 5, column: 5 },
				{ row: 4, column: 5 },
				{ row: 4, column: 4 },
				{ row: 4, column: 3 },
				{ row: 4, column: 2 },
				{ row: 4, column: 1 },
			],
			bonusTypes: ["bomb"],
		},
		{
			clickedPosition: { row: 6, column: 1 },
			positionsToRemove: [
				{ row: 6, column: 1 },
				{ row: 6, column: 2 },
				{ row: 6, column: 3 },
				{ row: 5, column: 1 },
				{ row: 5, column: 2 },
				{ row: 5, column: 3 },
				{ row: 6, column: 4 },
			],
			bonusTypes: ["bomb"],
		},
		{
			clickedPosition: { row: 2, column: 0 },
			positionsToRemove: [
				{ row: 2, column: 0 },
				{ row: 2, column: 1 },
				{ row: 2, column: 2 },
				{ row: 1, column: 2 },
				{ row: 1, column: 3 },
				{ row: 3, column: 0 },
				{ row: 4, column: 0 },
				{ row: 5, column: 0 },
			],
			bonusTypes: ["dynamite"],
		},
		{
			clickedPosition: { row: 1, column: 6 },
			positionsToRemove: [
				{ row: 1, column: 6 },
				{ row: 2, column: 6 },
				{ row: 3, column: 6 },
				{ row: 3, column: 5 },
				{ row: 3, column: 4 },
				{ row: 4, column: 6 },
				{ row: 5, column: 6 },
				{ row: 6, column: 6 },
				{ row: 6, column: 5 },
			],
			bonusTypes: ["dynamite"],
		},
	])(
		"commands to remove tiles and add bonus if more than 4 connections to clicked tile",
		({ clickedPosition, positionsToRemove, bonusTypes }) => {
			const { tileHandler, fieldQueries } = createTileHandler()
			const clickedTile = fieldQueries.getTileByPosition(
				clickedPosition
			) as Tile

			const commands = tileHandler.onClick(clickedTile)
			const commandRemove = commands?.[0] as Command<CommandName.REMOVE>
			const tilesToRemove = commandRemove.payload.tiles
			const tilesToRemovePositions = [...tilesToRemove].map((tile) =>
				tile.getPosition()
			)
			const commandAdd = commands?.[1] as Command<CommandName.ADD>
			const bonusType = commandAdd.payload.kind
			const bonusPosition = commandAdd.payload.position

			expect(commands).toBeDefined()
			expect(commands?.length).toEqual(2)
			expect(commandRemove.name).toEqual(CommandName.REMOVE)
			expect(commandRemove.payload.removingFromPosition).toEqual(
				clickedPosition
			)
			expect(new Set(tilesToRemovePositions)).toEqual(
				new Set(positionsToRemove)
			)
			expect(commandAdd.name).toEqual(CommandName.ADD)
			expect(bonusType).toBeOneOf(bonusTypes)
			expect(bonusPosition).toEqual(clickedPosition)
		}
	)
})

describe("tile remove handling", () => {
	it.each([{ clickedPosition: { row: 0, column: 0 } }])(
		"commans nothing after normal tile removal",
		({ clickedPosition }) => {
			const { tileHandler, fieldQueries } = createTileHandler()
			const tile = fieldQueries.getTileByPosition(clickedPosition) as Tile

			const commands = tileHandler.onRemove(tile)

			expect(commands).toBeNull()
		}
	)

	it.each([
		{
			clickedPosition: { row: 0, column: 1 },
			positionsToRemove: [
				{ row: 0, column: 1 },
				{ row: 1, column: 1 },
				{ row: 2, column: 1 },
				{ row: 3, column: 1 },
				{ row: 4, column: 1 },
				{ row: 5, column: 1 },
				{ row: 6, column: 1 },
			],
		},
		{
			clickedPosition: { row: 0, column: 2 },
			positionsToRemove: [
				{ row: 0, column: 0 },
				{ row: 0, column: 1 },
				{ row: 0, column: 2 },
				{ row: 0, column: 3 },
				{ row: 0, column: 4 },
				{ row: 0, column: 5 },
				{ row: 0, column: 6 },
			],
		},
		{
			clickedPosition: { row: 6, column: 0 },
			positionsToRemove: [
				{ row: 6, column: 0 },
				{ row: 6, column: 1 },
				{ row: 6, column: 2 },
				{ row: 5, column: 0 },
				{ row: 5, column: 1 },
				{ row: 5, column: 2 },
				{ row: 4, column: 0 },
				{ row: 4, column: 1 },
				{ row: 4, column: 2 },
			],
		},
		{
			clickedPosition: { row: 5, column: 4 },
			positionsToRemove: tilesProps.map((tile) => tile.position),
		},
	])(
		"commans remove tiles after special tile removal",
		({ clickedPosition, positionsToRemove }) => {
			const { tileHandler, fieldQueries } = createTileHandler()
			const tile = fieldQueries.getTileByPosition(clickedPosition) as Tile

			const commands = tileHandler.onRemove(tile)
			const commandRemove = commands?.[0] as Command<CommandName.REMOVE>
			const tilesToRemove = commandRemove.payload.tiles
			const tilesToRemovePositions = [...tilesToRemove].map((tile) =>
				tile.getPosition()
			)

			expect(commands).toBeDefined()
			expect(commands?.length).toEqual(1)
			expect(commandRemove.name).toEqual(CommandName.REMOVE)
			expect(commandRemove.payload.removingFromPosition).toEqual(
				clickedPosition
			)
			expect(new Set(tilesToRemovePositions)).toEqual(
				new Set(positionsToRemove)
			)
		}
	)
})
