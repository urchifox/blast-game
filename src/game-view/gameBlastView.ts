import "./assets/style/game-blast-container.css"
import "./assets/style/win-modal.css"
import "./assets/style/loss-modal.css"

import { View } from "../view/view"
import { GameBlast } from "../game-blast/game-blast"
import { isHtmlElement, queryElement } from "../helpers/dom"
import { PhaserRenderer } from "../game-blast/rendering/phaserRenderer"

export class GameView extends View {
	private gameBlast?: GameBlast
	private gameContainer?: HTMLElement
	private movesCounter?: HTMLElement
	private scoreCounter?: HTMLElement
	private winModal?: HTMLDialogElement
	private lossModal?: HTMLDialogElement

	constructor() {
		super("game-blast")
	}

	override async mount() {
		super.mount()

		this.gameContainer = queryElement("#canvas-container")
		this.movesCounter = queryElement("#movements-counter-text")
		this.scoreCounter = queryElement("#points-counter-result")
		this.winModal = queryElement<HTMLDialogElement>("#win-modal")
		this.lossModal = queryElement<HTMLDialogElement>("#loss-modal")
		this.setWinModalListeners()
		this.setLossModalListeners()
		window.addEventListener("resize", this.handleWindowResize)

		const renderer = new PhaserRenderer({
			container: this.gameContainer,
		})
		this.gameBlast = new GameBlast({
			container: this.gameContainer,
			renderer,
			toggleContainerFullSizeMode:
				this.toggleGameContainerFullSizeMode.bind(this),
			updateMovesCounter: this.updateMovesCounter.bind(this),
			updateScoreCounter: this.updateScoreCounter.bind(this),
			openWinModal: this.openWinModal.bind(this),
			openLossModal: this.openLossModal.bind(this),
		})
		await this.gameBlast.init()
	}

	override unmount() {
		super.unmount()
		this.gameBlast?.destroy()
		window.removeEventListener("resize", this.handleWindowResize)
	}

	private handleWindowResize = this.onResize.bind(this)
	private onResize() {
		this.gameBlast?.onResize()
	}

	private toggleGameContainerFullSizeMode(isFullSize: boolean) {
		this.gameContainer?.classList.toggle(
			"game-blast-container__canvas-container--fullsize",
			isFullSize
		)
	}

	private updateMovesCounter({
		movesNumber,
		movesLimit,
	}: {
		movesNumber: number
		movesLimit: number
	}) {
		if (this.movesCounter === undefined) {
			return
		}
		const movesLeft = movesLimit - movesNumber
		this.movesCounter.textContent = movesLeft.toString()
	}

	private updateScoreCounter({
		score,
		goalScore,
	}: {
		score: number
		goalScore: number
	}) {
		if (this.scoreCounter === undefined) {
			return
		}
		this.scoreCounter.textContent = `${score}/${goalScore}`
	}

	// #region Win Modal

	private setWinModalListeners() {
		this.winModal?.addEventListener("click", this.onWinModalClick.bind(this))
		this.winModal?.addEventListener("cancel", (event: Event) =>
			event.preventDefault()
		)
		this.winModal?.addEventListener("keydown", (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault()
			}
		})
	}

	private openWinModal() {
		this.winModal?.showModal()
	}

	private onWinModalClick(event: Event) {
		event.preventDefault()
		const target = event.target
		if (!isHtmlElement(target)) {
			return
		}
		if (target.id === "win-modal-button") {
			this.onWinModalButtonClick()
			return
		}
		if (target.closest(".win-modal__wrapper")) {
			return
		}
		this.onWinModalBackdropClick()
	}

	private onWinModalButtonClick() {
		this.gameBlast?.startNewLevel()
		this.winModal?.close()
	}

	private onWinModalBackdropClick() {
		this.gameBlast?.startNewLevel()
		this.winModal?.close()
	}

	// #endregion

	// #region Loss Modal

	private setLossModalListeners() {
		this.lossModal?.addEventListener("click", this.onLossModalClick.bind(this))
		this.lossModal?.addEventListener("cancel", (event: Event) =>
			event.preventDefault()
		)
		this.lossModal?.addEventListener("keydown", (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault()
			}
		})
	}

	private openLossModal() {
		this.lossModal?.showModal()
	}

	private onLossModalClick(event: Event) {
		event.preventDefault()
		const target = event.target
		if (!isHtmlElement(target)) {
			return
		}
		if (target.id === "loss-modal-button") {
			this.onLossModalButtonClick()
			return
		}
		if (target.closest(".loss-modal__wrapper")) {
			return
		}
		this.onLossModalBackdropClick()
	}

	private onLossModalButtonClick() {
		this.gameBlast?.restartLevel()
		this.lossModal?.close()
	}

	private onLossModalBackdropClick() {
		this.gameBlast?.restartLevel()
		this.lossModal?.close()
	}

	// #endregion
}
