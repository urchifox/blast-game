// @vitest-environment happy-dom

import indexHtml from "../../../index.html?raw"
import { queryElement } from "../../helpers/dom"
import { Game } from "../game"
import { gameFactory } from "../gameFactory"
import { BOOSTER_NAMES } from "../domain/config"
import { BoosterUI } from "./boosterUI"
import { GameView } from "./gameView"
import { LayoutUI } from "./layoutUI"
import { ModalUI } from "./modalUI"
import { ProgressUI } from "./progressUI"

vi.mock("../gameFactory", () => ({
	gameFactory: vi.fn(),
}))

function createGameDouble() {
	return {
		init: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
		destroy: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
		startNewLevel: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
		restartLevel: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
		onResize: vi.fn(),
		onBoosterButtonClick: vi.fn(),
	}
}

function createSUT() {
	const page = new DOMParser().parseFromString(indexHtml, "text/html")
	document.body.replaceChildren(...page.body.childNodes)
	const appRoot = queryElement("#app")
	const game = createGameDouble()
	vi.mocked(gameFactory).mockReturnValue(game as unknown as Game)
	const gameView = new GameView({ appRoot })
	return { gameView, appRoot, game }
}

describe("GameView", () => {
	afterEach(() => {
		document.body.replaceChildren()
		vi.clearAllMocks()
	})

	it("passes one booster control per booster and the view to the game factory", async () => {
		const { gameView, appRoot } = createSUT()

		await gameView.mount()

		expect(gameFactory).toHaveBeenCalledOnce()
		expect(gameFactory).toHaveBeenCalledWith({
			layoutUI: expect.any(LayoutUI),
			boosterUIMap: Object.fromEntries(
				BOOSTER_NAMES.map((boosterName) => [boosterName, expect.any(BoosterUI)])
			),
			gameContainer: queryElement("#canvas-container", appRoot),
			progressUI: expect.any(ProgressUI),
			winModalUI: expect.any(ModalUI),
			lossModalUI: expect.any(ModalUI),
		})
	})

	it("starts a new level when the win modal button is clicked", async () => {
		const { gameView, game } = createSUT()
		await gameView.mount()

		queryElement("#win-modal .modal__button").click()

		expect(game.startNewLevel).toHaveBeenCalledOnce()
		expect(game.restartLevel).not.toHaveBeenCalled()
	})

	it("starts a new level when the win modal backdrop is clicked", async () => {
		const { gameView, game } = createSUT()
		await gameView.mount()

		queryElement("#win-modal").click()

		expect(game.startNewLevel).toHaveBeenCalledOnce()
		expect(game.restartLevel).not.toHaveBeenCalled()
	})

	it("restarts the level when the loss modal button is clicked", async () => {
		const { gameView, game } = createSUT()
		await gameView.mount()

		queryElement("#loss-modal .modal__button").click()

		expect(game.restartLevel).toHaveBeenCalledOnce()
		expect(game.startNewLevel).not.toHaveBeenCalled()
	})

	it("restarts the level when the loss modal backdrop is clicked", async () => {
		const { gameView, game } = createSUT()
		await gameView.mount()

		queryElement("#loss-modal").click()

		expect(game.restartLevel).toHaveBeenCalledOnce()
		expect(game.startNewLevel).not.toHaveBeenCalled()
	})

	it("resizes the game when the window is resized", async () => {
		const { gameView, game } = createSUT()
		await gameView.mount()

		window.dispatchEvent(new Event("resize"))

		expect(game.onResize).toHaveBeenCalledOnce()
	})

	it("destroys the game and ignores later resizes when unmounted", async () => {
		const { gameView, game } = createSUT()
		await gameView.mount()

		await gameView.unmount()
		window.dispatchEvent(new Event("resize"))

		expect(game.onResize).not.toHaveBeenCalled()
	})
})
