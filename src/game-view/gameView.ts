import "./assets/style/game-blast-container.css"
import "./assets/style/modal.css"

import { View, ViewProps } from "../view/view"
import { Game } from "../game-blast/game"
import { queryElement } from "../helpers/dom"
import { gameFactory } from "../game-blast/gameFactory"
import { BoosterName } from "../game-blast/domain/types"
import { BoosterUI } from "./boosterUI"
import { ProgressUI } from "./progressUI"
import { ModalUI } from "./modalUI"

type GameViewProps = Omit<ViewProps, "name">

export class GameView extends View {
	override readonly needLoadingScreenOnMount: boolean = true
	private game?: Game
	private gameContainer?: HTMLElement

	private boostersElementsMap: Record<
		BoosterName,
		{
			button: HTMLElement
			counter: HTMLElement
		}
	> | null = null

	constructor(props: GameViewProps) {
		super({ name: "game-blast", ...props })
	}

	override async mount() {
		super.mount()

		this.gameContainer = queryElement("#canvas-container")

		this.boostersElementsMap = {
			bomb: {
				button: queryElement("#booster-bomb"),
				counter: queryElement("#booster-counter-bomb"),
			},
			teleport: {
				button: queryElement("#booster-teleport"),
				counter: queryElement("#booster-counter-teleport"),
			},
		}

		const boosterUI = Object.entries(this.boostersElementsMap).reduce(
			(acc, [boosterName, booster]) => {
				if (this.gameContainer === undefined) {
					return acc
				}
				acc[boosterName as BoosterName] = new BoosterUI({
					button: booster.button,
					counter: booster.counter,
					toggleGameContainerRaised: (isRaised) =>
						this.gameContainer?.classList.toggle(
							"game-blast-container__canvas-container--raised",
							isRaised
						),
				})
				return acc
			},
			{} as Record<BoosterName, BoosterUI>
		)

		const scoreCounter = queryElement("#points-counter-result", this.appRoot)
		const movesCounter = queryElement("#movements-counter-text", this.appRoot)
		const progressUI = new ProgressUI({
			scoreCounter: scoreCounter,
			movesCounter: movesCounter,
		})

		const winModal = queryElement<HTMLDialogElement>("#win-modal")
		const winModalUI = new ModalUI({
			modal: winModal,
			onButtonClick: () => this.game?.startNewLevel(),
			onBackdropClick: () => this.game?.startNewLevel(),
		})

		const lossModal = queryElement<HTMLDialogElement>("#loss-modal")
		const lossModalUI = new ModalUI({
			modal: lossModal,
			onButtonClick: () => this.game?.restartLevel(),
			onBackdropClick: () => this.game?.restartLevel(),
		})

		this.game = gameFactory({
			boosterUI: boosterUI,
			gameContainer: this.gameContainer,
			progressUI: progressUI,
			winModalUI: winModalUI,
			lossModalUI: lossModalUI,
		})

		this.setListeners()

		await this.game.init()
	}

	private setListeners() {
		this.setBoostersButtonsListeners()
		window.addEventListener("resize", this.handleWindowResize)
	}

	override async unmount() {
		window.removeEventListener("resize", this.handleWindowResize)
		await this.game?.destroy()
		super.unmount()
	}

	private handleWindowResize = this.onResize.bind(this)
	private onResize() {
		this.game?.onResize()
	}

	private setBoostersButtonsListeners() {
		if (this.boostersElementsMap === null || this.game === undefined) {
			return
		}

		for (const [boosterName, booster] of Object.entries(
			this.boostersElementsMap
		)) {
			const button = booster.button
			const onClick = this.game.onBoosterButtonClick.bind(
				this.game,
				boosterName as BoosterName
			)

			button.addEventListener("click", onClick)
		}
	}
}
