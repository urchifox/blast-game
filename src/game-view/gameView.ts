import "./assets/style/game-blast-container.css"
import "./assets/style/modal.css"

import { View, ViewProps } from "../view/view"
import { Game } from "../game-blast/game"
import { queryElement } from "../helpers/dom"
import { gameFactory } from "../game-blast/gameFactory"
import { BoosterUI } from "./boosterUI"
import { ProgressUI } from "./progressUI"
import { ModalUI } from "./modalUI"
import { BOOSTER_NAMES } from "../game-blast/domain/config"
import { BoosterUIMap } from "../game-blast/types"
import { LayoutUI } from "./layoutUI"
import { LayoutCalculator } from "../game-blast/layoutCalculator"

type GameViewProps = Omit<ViewProps, "name">

export class GameView extends View {
	override readonly needLoadingScreenOnMount: boolean = true
	private game?: Game
	private gameContainer?: HTMLElement

	constructor(props: GameViewProps) {
		super({ name: "game-blast", ...props })
	}

	override async mount() {
		super.mount()
		this.gameContainer = queryElement("#canvas-container")

		const layoutCalculator = new LayoutCalculator()
		const layoutUI = new LayoutUI({
			gameContainer: this.gameContainer,
			layoutCalculator: layoutCalculator,
		})

		const boosterUIMap = BOOSTER_NAMES.reduce((acc, boosterName) => {
			const button = queryElement(`#booster-${boosterName}`, this.appRoot)
			const counter = queryElement(
				`#booster-counter-${boosterName}`,
				this.appRoot
			)
			const toggleGameContainerRaised =
				this.toggleGameContainerRaised.bind(this)
			const onClick = () => this.game?.onBoosterButtonClick(boosterName)

			acc[boosterName] = new BoosterUI({
				button: button,
				counter: counter,
				toggleGameContainerRaised: toggleGameContainerRaised,
				onClick: onClick,
			})

			return acc
		}, {} as BoosterUIMap)

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
			layoutUI: layoutUI,
			boosterUIMap: boosterUIMap,
			gameContainer: this.gameContainer,
			progressUI: progressUI,
			winModalUI: winModalUI,
			lossModalUI: lossModalUI,
		})

		this.setListeners()

		await this.game.init()
	}

	private setListeners() {
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

	private toggleGameContainerRaised(isRaised: boolean) {
		this.gameContainer?.classList.toggle(
			"game-blast-container__canvas-container--raised",
			isRaised
		)
	}
}
