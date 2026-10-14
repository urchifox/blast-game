import { Command, CommandName } from "../domain/command"
import { Tile } from "../domain/tile"
import { ActionName } from "./actionManager"
import { createActionManagerStubbed, createPresenterStub } from "./testHelpers"

function createSUT() {
	const presenter = createPresenterStub()
	const actionManager = createActionManagerStubbed({ presenter })
	return {
		actionManager,
		presenter,
	}
}

function createTile(id: string, row = 0, column = 0) {
	return new Tile({ id, kind: "blue", position: { row, column } })
}

describe("ActionManager", () => {
	describe("doCommands", () => {
		it("maps REMOVE to an action with centerPosition taken from removingFromPosition", () => {
			const { actionManager, presenter } = createSUT()
			const removeTilesFromCenter = vi.spyOn(presenter, "removeTilesFromCenter")
			const tiles = new Set([createTile("1", 0, 0), createTile("2", 0, 1)])
			const removingFromPosition = { row: 0, column: 1 }
			const payload = { tiles, removingFromPosition }

			const result = actionManager.doCommands([
				{ name: CommandName.REMOVE, payload },
			])

			expect(removeTilesFromCenter).toHaveBeenCalledTimes(1)
			expect(removeTilesFromCenter).toHaveBeenCalledWith(
				tiles,
				removingFromPosition
			)
			expect(result.removedTiles).toEqual(tiles)
		})

		it("ADD calls addTile and renders the tile it returns", () => {
			const { actionManager, presenter } = createSUT()
			const addTile = vi.spyOn(presenter, "addTile")
			const renderTile = vi.spyOn(presenter, "renderTile")
			const payload = {
				kind: "green" as const,
				position: { row: 2, column: 1 },
			}

			const result = actionManager.doCommands([
				{ name: CommandName.ADD, payload },
			])

			expect(addTile).toHaveBeenCalledTimes(1)
			expect(addTile).toHaveBeenCalledWith(payload)
			const addedTile = addTile.mock.results[0].value as Tile
			expect(renderTile).toHaveBeenCalledTimes(1)
			expect(renderTile).toHaveBeenCalledWith(addedTile)
			expect(result.addedTiles).toEqual(new Set([addedTile]))
		})

		it("combines results from mixed commands", () => {
			const { actionManager, presenter } = createSUT()
			const addTile = vi.spyOn(presenter, "addTile")
			const removeTilesFromCenter = vi.spyOn(presenter, "removeTilesFromCenter")
			const swapTiles = vi.spyOn(presenter, "swapTiles")
			const removedA = createTile("1", 0, 0)
			const removedB = createTile("2", 0, 1)
			const removedC = createTile("3", 1, 0)
			const swapPair: [Tile, Tile] = [
				createTile("4", 2, 0),
				createTile("5", 2, 1),
			]

			const result = actionManager.doCommands([
				{
					name: CommandName.REMOVE,
					payload: {
						tiles: new Set([removedA, removedB]),
						removingFromPosition: { row: 0, column: 0 },
					},
				},
				{
					name: CommandName.ADD,
					payload: { kind: "blue", position: { row: 0, column: 0 } },
				},
				{
					name: CommandName.REMOVE,
					payload: {
						tiles: new Set([removedC]),
						removingFromPosition: { row: 1, column: 0 },
					},
				},
				{
					name: CommandName.ADD,
					payload: { kind: "purple", position: { row: 0, column: 1 } },
				},
				{ name: CommandName.SWAP, payload: swapPair },
			])

			const addedTiles = addTile.mock.results.map(({ value }) => value as Tile)
			expect(addedTiles).toHaveLength(2)
			expect(result.addedTiles).toEqual(new Set(addedTiles))
			expect(result.removedTiles).toEqual(
				new Set([removedA, removedB, removedC])
			)
			expect(result.swappedTiles).toEqual(new Set([swapPair]))
			expect(result.selectedTiles.size).toBe(0)
			expect(result.unselectedTiles.size).toBe(0)
			expect(removeTilesFromCenter).toHaveBeenCalledTimes(2)
			expect(swapTiles).toHaveBeenCalledWith(...swapPair)
		})

		it("silently drops unknown commands", () => {
			const { actionManager, presenter } = createSUT()
			const spies = [
				vi.spyOn(presenter, "addTile"),
				vi.spyOn(presenter, "renderTile"),
				vi.spyOn(presenter, "removeTilesFromCenter"),
				vi.spyOn(presenter, "swapTiles"),
				vi.spyOn(presenter, "selectTile"),
				vi.spyOn(presenter, "unselectTile"),
			]
			const swapPair: [Tile, Tile] = [
				createTile("1", 0, 0),
				createTile("2", 0, 1),
			]
			const unknownCommand = {
				name: "unknown",
				payload: { kind: "blue", position: { row: 0, column: 0 } },
			} as unknown as Command

			let result: ReturnType<typeof actionManager.doCommands> | undefined
			expect(() => {
				result = actionManager.doCommands([unknownCommand])
			}).not.toThrow()

			spies.forEach((spy) => expect(spy).not.toHaveBeenCalled())
			expect(result).toEqual({
				addedTiles: new Set(),
				removedTiles: new Set(),
				selectedTiles: new Set(),
				unselectedTiles: new Set(),
				swappedTiles: new Set(),
			})

			const mixedResult = actionManager.doCommands([
				unknownCommand,
				{ name: CommandName.SWAP, payload: swapPair },
				unknownCommand,
			])
			expect(mixedResult).toEqual({
				addedTiles: new Set(),
				removedTiles: new Set(),
				selectedTiles: new Set(),
				unselectedTiles: new Set(),
				swappedTiles: new Set([swapPair]),
			})
		})
	})

	describe("doActions", () => {
		it("combines select and unselect results with other actions", () => {
			const { actionManager, presenter } = createSUT()
			const selectTile = vi.spyOn(presenter, "selectTile")
			const unselectTile = vi.spyOn(presenter, "unselectTile")
			const selected = createTile("1", 0, 0)
			const unselected = createTile("2", 0, 1)
			const removed = createTile("3", 1, 1)

			const result = actionManager.doActions([
				{ name: ActionName.SELECT, payload: selected },
				{ name: ActionName.UNSELECT, payload: unselected },
				{
					name: ActionName.REMOVE,
					payload: {
						tiles: new Set([removed]),
						centerPosition: { row: 1, column: 1 },
					},
				},
			])

			expect(selectTile).toHaveBeenCalledWith(selected)
			expect(unselectTile).toHaveBeenCalledWith(unselected)
			expect(result.selectedTiles).toEqual(new Set([selected]))
			expect(result.unselectedTiles).toEqual(new Set([unselected]))
			expect(result.removedTiles).toEqual(new Set([removed]))
			expect(result.addedTiles.size).toBe(0)
			expect(result.swappedTiles.size).toBe(0)
		})
	})
})
