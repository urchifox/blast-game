import { Counter } from "../helpers/counter"
import { RandomizationFunction } from "../helpers/random"
import { CompletionManager } from "./domain/completionManager"
import { FieldQueries } from "./domain/fieldQueries"
import { GameRules } from "./domain/gameRules"
import { ProgressCounter } from "./domain/progressCounter"
import {
	createFieldComponentsStubbed,
	createIdGeneratorStub,
	createLevelGeneratorStubbed,
	createRandomizationFunctionStub,
	createTilesProps,
	getNextTileId,
	getTileByPosition,
} from "./domain/testHelpers"
import { TileKind, TilePosition, TileProps } from "./domain/tile"
import { ActionManager } from "./flow/actionManager"
import { ProgressManager } from "./flow/progressManager"
import {
	createPresenterStubbed,
	createBoosterManagerStubbed,
	createProgressUIStub,
	createModalUIStub,
} from "./flow/testHelpers"
import { tilesManagerFactory } from "./flow/tilesManagerFactory"
import { Game } from "./game"
import { LevelGeneratorContract, OnTileClickCallback } from "./types"

const GRID_SIZE = { columns: 7, rows: 7 }
const TILES_KINDS = [
	"green",
	"rockets-column",
	"rockets-row",
	"red",
	"red",
	"green",
	"green",

	"yellow",
	"yellow",
	"purple",
	"purple",
	"red",
	"green",
	"blue",

	"purple",
	"purple",
	"purple",
	"yellow",
	"yellow",
	"green",
	"blue",

	"purple",
	"yellow",
	"yellow",
	"yellow",
	"blue",
	"blue",
	"blue",

	"purple",
	"green",
	"green",
	"green",
	"green",
	"green",
	"blue",

	"purple",
	"yellow",
	"yellow",
	"yellow",
	"dynamite",
	"green",
	"blue",

	"bomb",
	"yellow",
	"yellow",
	"yellow",
	"yellow",
	"blue",
	"blue",
] satisfies Array<TileKind>
const tilesProps = createTilesProps({
	...GRID_SIZE,
	kinds: TILES_KINDS,
})

function createSUT({
	levelGenerator = createLevelGeneratorStubbed(),
	randomizationFunction = createRandomizationFunctionStub(),
}: {
	levelGenerator?: LevelGeneratorContract
	randomizationFunction?: RandomizationFunction
} = {}) {
	const gameRules = new GameRules()
	const { grid, field, fieldQueries } = createFieldComponentsStubbed({
		randomizationFunction,
		createId: createIdGeneratorStub(getNextTileId(new Set(tilesProps))),
	})

	const presenter = createPresenterStubbed({
		field,
		fieldQueries,
		grid,
	})

	const actionManager = new ActionManager({
		presenter: presenter,
	})

	const tilesManager = tilesManagerFactory({
		fieldQueries: fieldQueries,
		actionManager: actionManager,
		gameRules: gameRules,
		randomizationFunction: randomizationFunction,
	})

	const boosterManager = createBoosterManagerStubbed({
		fieldQueries,
		actionManager,
		gameRules,
	})

	const progressCounter = new ProgressCounter({
		scoreCounter: new Counter(),
		movesCounter: new Counter(),
		gameRules: gameRules,
	})

	const progressUI = createProgressUIStub()
	const progressManager = new ProgressManager({
		progressCounter: progressCounter,
		progressUI: progressUI,
	})
	const completionManager = new CompletionManager({
		fieldQueries: fieldQueries,
		gameRules: gameRules,
		progressCounter: progressCounter,
	})

	const winModalUI = createModalUIStub()
	const lossModalUI = createModalUIStub()

	const game = new Game({
		fieldQueries,
		presenter,
		levelGenerator,
		progressManager,
		tilesManager,
		boosterManager,
		completionManager,
		winModalUI,
		lossModalUI,
	})

	return {
		game,
		fieldQueries,
		presenter,
		progressUI,
		winModalUI,
		lossModalUI,
	}
}

async function clickTileByPosition({
	fieldQueries,
	tilePosition,
	onTileClickCallback,
}: {
	fieldQueries: FieldQueries
	tilePosition: TilePosition
	onTileClickCallback: OnTileClickCallback
}) {
	const tile = getTileByPosition(fieldQueries, tilePosition)
	const clickTilePromise = onTileClickCallback(tile.getId())
	await vi.runAllTimersAsync()
	await clickTilePromise
}

describe("Game", () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it("initializes with zero score, positive score goal and positive moves", async () => {
		const { game, progressUI } = createSUT()
		const updateScoreSpy = vi.spyOn(progressUI, "updateScoreCounter")
		const updateMovesSpy = vi.spyOn(progressUI, "updateMovesCounter")

		await game.init()

		expect(updateScoreSpy).toHaveBeenLastCalledWith({
			score: 0,
			goalScore: expect.toSatisfy((goalScore: number) => goalScore > 0),
		})
		expect(updateMovesSpy).toHaveBeenLastCalledWith({
			movesLeft: expect.toSatisfy((movesLeft: number) => movesLeft > 0),
		})
	})

	it("starts new level  with zero score, new score goal and new moves limit", async () => {
		vi.useFakeTimers()
		const levelGenerator = (() => {
			let callsCount = 0
			return {
				generateLevelData: () => {
					callsCount++
					const goalScore = 100 * callsCount
					const movesLimit = 10 * callsCount
					return {
						tilesProps: new Set(tilesProps),
						columns: 7,
						rows: 7,
						goalScore,
						movesLimit,
					}
				},
			} satisfies LevelGeneratorContract
		})()
		const { game, progressUI, presenter, fieldQueries } = createSUT({
			levelGenerator,
		})
		const updateScoreSpy = vi.spyOn(progressUI, "updateScoreCounter")
		const updateMovesSpy = vi.spyOn(progressUI, "updateMovesCounter")
		const presenterInitSpy = vi.spyOn(presenter, "init")

		await game.init()
		await clickTileByPosition({
			fieldQueries,
			tilePosition: { row: 1, column: 0 },
			onTileClickCallback: presenterInitSpy.mock.calls[0][0],
		})
		await game.startNewLevel()

		expect(updateScoreSpy).toHaveBeenLastCalledWith({
			score: 0,
			goalScore: 200,
		})
		expect(updateMovesSpy).toHaveBeenLastCalledWith({
			movesLeft: 20,
		})
	})

	it("restarts level with same score, score goal and moves limit", async () => {
		vi.useFakeTimers()
		const levelGenerator = (() => {
			let callsCount = 0
			return {
				generateLevelData: () => {
					callsCount++
					const goalScore = 100 * callsCount
					const movesLimit = 10 * callsCount
					return {
						tilesProps: new Set(tilesProps),
						columns: 7,
						rows: 7,
						goalScore,
						movesLimit,
					}
				},
			} satisfies LevelGeneratorContract
		})()
		const { game, progressUI, presenter, fieldQueries } = createSUT({
			levelGenerator,
		})
		const updateScoreSpy = vi.spyOn(progressUI, "updateScoreCounter")
		const updateMovesSpy = vi.spyOn(progressUI, "updateMovesCounter")
		const presenterInitSpy = vi.spyOn(presenter, "init")

		await game.init()
		await clickTileByPosition({
			fieldQueries,
			tilePosition: { row: 1, column: 0 },
			onTileClickCallback: presenterInitSpy.mock.calls[0][0],
		})
		await game.restartLevel()

		expect(updateScoreSpy).toHaveBeenLastCalledWith({
			score: 0,
			goalScore: 100,
		})
		expect(updateMovesSpy).toHaveBeenLastCalledWith({
			movesLeft: 10,
		})
	})

	it("ignores tile click without connections", async () => {
		vi.useFakeTimers()
		const { game, presenter, fieldQueries, progressUI } = createSUT({
			levelGenerator: {
				generateLevelData: () => ({
					tilesProps: new Set(tilesProps),
					columns: 7,
					rows: 7,
					goalScore: 100,
					movesLimit: 10,
				}),
			},
		})
		const updateScoreSpy = vi.spyOn(progressUI, "updateScoreCounter")
		const updateMovesSpy = vi.spyOn(progressUI, "updateMovesCounter")
		const presenterInitSpy = vi.spyOn(presenter, "init")

		await game.init()
		const { score: initialScore, goalScore } = updateScoreSpy.mock.calls[0][0]
		const { movesLeft: initialMovesLeft } = updateMovesSpy.mock.calls[0][0]
		await clickTileByPosition({
			fieldQueries,
			tilePosition: { row: 0, column: 0 },
			onTileClickCallback: presenterInitSpy.mock.calls[0][0],
		})

		expect(updateScoreSpy).toHaveBeenLastCalledWith({
			score: initialScore,
			goalScore: goalScore,
		})
		expect(updateMovesSpy).toHaveBeenLastCalledWith({
			movesLeft: initialMovesLeft,
		})
	})

	it("ignores tile click without unlnown id", async () => {
		vi.useFakeTimers()
		const { game, presenter, progressUI } = createSUT({
			levelGenerator: {
				generateLevelData: () => ({
					tilesProps: new Set(tilesProps),
					columns: 7,
					rows: 7,
					goalScore: 100,
					movesLimit: 10,
				}),
			},
		})
		const updateScoreSpy = vi.spyOn(progressUI, "updateScoreCounter")
		const updateMovesSpy = vi.spyOn(progressUI, "updateMovesCounter")
		const presenterInitSpy = vi.spyOn(presenter, "init")

		await game.init()
		const { score: initialScore, goalScore } = updateScoreSpy.mock.calls[0][0]
		const { movesLeft: initialMovesLeft } = updateMovesSpy.mock.calls[0][0]
		const onTileClickCallback = presenterInitSpy.mock.calls[0][0]
		const clickTilePromise = onTileClickCallback("unknown-id")
		await vi.runAllTimersAsync()
		await clickTilePromise

		expect(updateScoreSpy).toHaveBeenLastCalledWith({
			score: initialScore,
			goalScore: goalScore,
		})
		expect(updateMovesSpy).toHaveBeenLastCalledWith({
			movesLeft: initialMovesLeft,
		})
	})

	it("ignores locked tile click", async () => {
		vi.useFakeTimers()
		const { game, presenter, progressUI, fieldQueries } = createSUT({
			levelGenerator: {
				generateLevelData: () => ({
					tilesProps: new Set(tilesProps),
					columns: 7,
					rows: 7,
					goalScore: 100,
					movesLimit: 10,
				}),
			},
		})
		const updateScoreSpy = vi.spyOn(progressUI, "updateScoreCounter")
		const updateMovesSpy = vi.spyOn(progressUI, "updateMovesCounter")
		const presenterInitSpy = vi.spyOn(presenter, "init")

		await game.init()
		const { score: initialScore, goalScore } = updateScoreSpy.mock.calls[0][0]
		const { movesLeft: initialMovesLeft } = updateMovesSpy.mock.calls[0][0]
		const onTileClickCallback = presenterInitSpy.mock.calls[0][0]
		const tile = getTileByPosition(fieldQueries, { row: 1, column: 0 })
		tile.lock()
		const clickTilePromise = onTileClickCallback(tile.getId())
		await vi.runAllTimersAsync()
		await clickTilePromise

		expect(updateScoreSpy).toHaveBeenLastCalledWith({
			score: initialScore,
			goalScore: goalScore,
		})
		expect(updateMovesSpy).toHaveBeenLastCalledWith({
			movesLeft: initialMovesLeft,
		})
	})

	it("processes tile click with connections by updating scoring and move spending", async () => {
		vi.useFakeTimers()
		const { game, presenter, fieldQueries, progressUI } = createSUT({
			levelGenerator: {
				generateLevelData: () => ({
					tilesProps: new Set(tilesProps),
					columns: 7,
					rows: 7,
					goalScore: 100,
					movesLimit: 10,
				}),
			},
		})
		const updateScoreSpy = vi.spyOn(progressUI, "updateScoreCounter")
		const updateMovesSpy = vi.spyOn(progressUI, "updateMovesCounter")
		const presenterInitSpy = vi.spyOn(presenter, "init")

		await game.init()
		const { score: initialScore, goalScore } = updateScoreSpy.mock.calls[0][0]
		const { movesLeft: initialMovesLeft } = updateMovesSpy.mock.calls[0][0]
		await clickTileByPosition({
			fieldQueries,
			tilePosition: { row: 1, column: 0 },
			onTileClickCallback: presenterInitSpy.mock.calls[0][0],
		})
		expect(updateScoreSpy).toHaveBeenLastCalledWith({
			score: expect.toSatisfy((score: number) => score > initialScore),
			goalScore: goalScore,
		})
		expect(updateMovesSpy).toHaveBeenLastCalledWith({
			movesLeft: initialMovesLeft - 1,
		})
	})

	it.each([
		{
			goalScore: 50,
			movesLimit: 3,
			tilesPositions: [
				{ row: 1, column: 0 },
				{ row: 0, column: 3 },
			],
			isLoss: false,
			isWIn: false,
		},
		{
			goalScore: 10,
			movesLimit: 2,
			tilesPositions: [{ row: 1, column: 0 }],
			isLoss: false,
			isWIn: true,
		},
		{
			goalScore: 20,
			movesLimit: 2,
			tilesPositions: [
				{ row: 1, column: 0 },
				{ row: 0, column: 3 },
			],
			isLoss: false,
			isWIn: true,
		},
		{
			goalScore: 50,
			movesLimit: 2,
			tilesPositions: [
				{ row: 1, column: 0 },
				{ row: 0, column: 3 },
			],
			isLoss: true,
			isWIn: false,
		},
	])(
		"opens wins or loss modal when game is completed",
		async ({ goalScore, movesLimit, tilesPositions, isLoss, isWIn }) => {
			vi.useFakeTimers()
			const { game, presenter, fieldQueries, winModalUI, lossModalUI } =
				createSUT({
					levelGenerator: {
						generateLevelData: () => ({
							tilesProps: new Set(tilesProps),
							columns: 7,
							rows: 7,
							goalScore,
							movesLimit,
						}),
					},
				})
			const presenterInitSpy = vi.spyOn(presenter, "init")
			const showWinModalSpy = vi.spyOn(winModalUI, "open")
			const showLossModalSpy = vi.spyOn(lossModalUI, "open")

			await game.init()
			for (const tilePosition of tilesPositions) {
				await clickTileByPosition({
					fieldQueries,
					tilePosition,
					onTileClickCallback: presenterInitSpy.mock.calls[0][0],
				})
			}

			const winModalOpenTimes = showWinModalSpy.mock.calls.length
			const lossModalOpenTimes = showLossModalSpy.mock.calls.length
			const isWinModalOpen = winModalOpenTimes === 1
			const isLossModalOpen = lossModalOpenTimes === 1
			expect(winModalOpenTimes).not.toBeGreaterThan(1)
			expect(lossModalOpenTimes).not.toBeGreaterThan(1)
			expect(isWinModalOpen).toBe(isWIn)
			expect(isLossModalOpen).toBe(isLoss)
		}
	)

	it.each([
		{
			goalScore: 20,
			movesLimit: 2,
			tilesPositions: [
				{ row: 1, column: 0 },
				{ row: 0, column: 3 },
			],
		},
		{
			goalScore: 50,
			movesLimit: 2,
			tilesPositions: [
				{ row: 1, column: 0 },
				{ row: 0, column: 3 },
			],
		},
	])(
		"ignores tile click after game is completed",
		async ({ goalScore, movesLimit, tilesPositions }) => {
			vi.useFakeTimers()
			const {
				game,
				presenter,
				fieldQueries,
				winModalUI,
				lossModalUI,
				progressUI,
			} = createSUT({
				levelGenerator: {
					generateLevelData: () => ({
						tilesProps: new Set(tilesProps),
						columns: 7,
						rows: 7,
						goalScore,
						movesLimit,
					}),
				},
			})
			const presenterInitSpy = vi.spyOn(presenter, "init")
			const showWinModalSpy = vi.spyOn(winModalUI, "open")
			const showLossModalSpy = vi.spyOn(lossModalUI, "open")
			const updateScoreSpy = vi.spyOn(progressUI, "updateScoreCounter")
			const updateMovesSpy = vi.spyOn(progressUI, "updateMovesCounter")

			await game.init()
			for (const tilePosition of tilesPositions) {
				await clickTileByPosition({
					fieldQueries,
					tilePosition,
					onTileClickCallback: presenterInitSpy.mock.calls[0][0],
				})
			}
			await clickTileByPosition({
				fieldQueries,
				tilePosition: {
					row: 6,
					column: 0,
				},
				onTileClickCallback: presenterInitSpy.mock.calls[0][0],
			})

			const winModalOpenTimes = showWinModalSpy.mock.calls.length
			const lossModalOpenTimes = showLossModalSpy.mock.calls.length
			const isWinModalOpen = winModalOpenTimes === 1
			const isLossModalOpen = lossModalOpenTimes === 1
			const isOneCompletitionModalOpened =
				(isWinModalOpen && !isLossModalOpen) ||
				(isLossModalOpen && !isWinModalOpen)
			const updateScoreTimes = updateScoreSpy.mock.calls.length
			const updateMovesTimes = updateMovesSpy.mock.calls.length

			expect(winModalOpenTimes).not.toBeGreaterThan(1)
			expect(lossModalOpenTimes).not.toBeGreaterThan(1)
			expect(isOneCompletitionModalOpened).toBe(true)
			expect(updateScoreTimes).toBe(tilesPositions.length + 1)
			expect(updateMovesTimes).toBe(tilesPositions.length + 1)
		}
	)

	it.each([
		{
			tilePosition: { row: 0, column: 1 },
		},
		{
			tilePosition: { row: 0, column: 2 },
		},
		{
			tilePosition: { row: 6, column: 0 },
		},
		{
			tilePosition: { row: 5, column: 4 },
		},
	])(
		"processes special tile click by updating scoring and one move spending",
		async ({ tilePosition }) => {
			vi.useFakeTimers()
			const { game, presenter, fieldQueries, progressUI } = createSUT({
				levelGenerator: {
					generateLevelData: () => ({
						tilesProps: new Set(tilesProps),
						columns: 7,
						rows: 7,
						goalScore: 100,
						movesLimit: 10,
					}),
				},
			})
			const presenterInitSpy = vi.spyOn(presenter, "init")
			const updateScoreSpy = vi.spyOn(progressUI, "updateScoreCounter")
			const updateMovesSpy = vi.spyOn(progressUI, "updateMovesCounter")

			await game.init()
			await clickTileByPosition({
				fieldQueries,
				tilePosition,
				onTileClickCallback: presenterInitSpy.mock.calls[0][0],
			})

			expect(updateScoreSpy.mock.calls.length).toBe(2)
			expect(updateMovesSpy.mock.calls.length).toBe(2)
			expect(updateScoreSpy).toHaveBeenLastCalledWith({
				score: expect.toSatisfy((score: number) => score > 0),
				goalScore: 100,
			})
			expect(updateMovesSpy).toHaveBeenLastCalledWith({
				movesLeft: 9,
			})
		}
	)

	it.each([
		{
			name: "bomb",
			tilesPositions: [{ row: 0, column: 0 }],
			doesUpdateScore: true,
		},
		{
			name: "teleport",
			tilesPositions: [
				{ row: 0, column: 0 },
				{ row: 6, column: 0 },
			],
			doesUpdateScore: false,
		},
	] as const)(
		"processes booster use by spending one move and optionally updating score",
		async ({ name, tilesPositions, doesUpdateScore }) => {
			vi.useFakeTimers()
			const { game, presenter, fieldQueries, progressUI } = createSUT({
				levelGenerator: {
					generateLevelData: () => ({
						tilesProps: new Set(tilesProps),
						columns: 7,
						rows: 7,
						goalScore: 100,
						movesLimit: 10,
					}),
				},
			})
			const updateScoreSpy = vi.spyOn(progressUI, "updateScoreCounter")
			const updateMovesSpy = vi.spyOn(progressUI, "updateMovesCounter")
			const presenterInitSpy = vi.spyOn(presenter, "init")

			await game.init()
			game.onBoosterButtonClick(name)
			for (const tilePosition of tilesPositions) {
				await clickTileByPosition({
					fieldQueries,
					tilePosition,
					onTileClickCallback: presenterInitSpy.mock.calls[0][0],
				})
			}

			expect(updateMovesSpy).toHaveBeenLastCalledWith({
				movesLeft: 9,
			})
			expect(updateScoreSpy).toHaveBeenLastCalledWith({
				score: doesUpdateScore
					? expect.toSatisfy((score: number) => score > 0)
					: 0,
				goalScore: 100,
			})
		}
	)

	it("processes no matching field with successful shuffle", async () => {
		vi.useFakeTimers()
		const randomizationFunction = (() => {
			let isEven = true
			return () => {
				isEven = !isEven
				return isEven ? 0 : 1 - Number.EPSILON
			}
		})()
		const { game, presenter, fieldQueries, lossModalUI, winModalUI } =
			createSUT({
				levelGenerator: {
					generateLevelData: () => ({
						tilesProps: new Set(tilesProps),
						columns: 7,
						rows: 7,
						goalScore: 10000,
						movesLimit: 10,
					}),
				},
				randomizationFunction,
			})
		const presenterInitSpy = vi.spyOn(presenter, "init")
		const showLossModalSpy = vi.spyOn(lossModalUI, "open")
		const showWinModalSpy = vi.spyOn(winModalUI, "open")
		const shuffleFieldSpy = vi.spyOn(presenter, "shuffleField")

		await game.init()
		await clickTileByPosition({
			fieldQueries,
			tilePosition: { row: 5, column: 4 },
			onTileClickCallback: presenterInitSpy.mock.calls[0][0],
		})

		expect(shuffleFieldSpy).toHaveBeenCalled()
		expect(showLossModalSpy).not.toHaveBeenCalled()
		expect(showWinModalSpy).not.toHaveBeenCalled()
	})

	it("opens the loss modal when a shuffle never restores a move", async () => {
		vi.useFakeTimers()
		const randomizationFunction = (() => {
			let isEven = true
			return () => {
				isEven = !isEven
				return isEven ? 0 : 1 - Number.EPSILON
			}
		})()
		const { game, presenter, fieldQueries, lossModalUI, winModalUI } =
			createSUT({
				levelGenerator: {
					generateLevelData: () => ({
						tilesProps: new Set<TileProps>([
							{
								id: "1",
								kind: "red",
								position: { row: 0, column: 0 },
							},
							{
								id: "2",
								kind: "red",
								position: { row: 0, column: 1 },
							},
						]),
						columns: 2,
						rows: 1,
						goalScore: 100,
						movesLimit: 10,
					}),
				},
				randomizationFunction,
			})
		const presenterInitSpy = vi.spyOn(presenter, "init")
		const showLossModalSpy = vi.spyOn(lossModalUI, "open")
		const showWinModalSpy = vi.spyOn(winModalUI, "open")
		const shuffleFieldSpy = vi.spyOn(presenter, "shuffleField")

		await game.init()
		await clickTileByPosition({
			fieldQueries,
			tilePosition: { row: 0, column: 0 },
			onTileClickCallback: presenterInitSpy.mock.calls[0][0],
		})

		expect(shuffleFieldSpy).toHaveBeenCalled()
		expect(showLossModalSpy).toHaveBeenCalledOnce()
		expect(showWinModalSpy).not.toHaveBeenCalled()
	})
})
