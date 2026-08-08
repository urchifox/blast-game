import "./assets/style/game-blast-container.css"
import "./assets/style/win-modal.css"
import "./assets/style/loss-modal.css"

import { View, ViewProps } from "../view/view"
import { GameBlast } from "../game-blast/gameBlast"
import { isHtmlElement, queryElement } from "../helpers/dom"
import { gameBlastFactory } from "../game-blast/gameBlastFactory"
import { BoosterName } from "../game-blast/types"

type GameViewProps = Omit<ViewProps, "name">

export class GameView extends View {
	override readonly needLoadingScreenOnMount: boolean = true
	private gameBlast?: GameBlast
	private gameContainer?: HTMLElement
	private movesCounter?: HTMLElement
	private scoreCounter?: HTMLElement
	private winModal?: HTMLDialogElement
	private winModalWrapper?: HTMLElement
	private lossModal?: HTMLDialogElement
	private lossModalWrapper?: HTMLElement

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
		this.movesCounter = queryElement("#movements-counter-text")
		this.scoreCounter = queryElement("#points-counter-result")
		this.winModal = queryElement<HTMLDialogElement>("#win-modal")
		this.winModalWrapper = queryElement(".win-modal__wrapper", this.winModal)
		this.lossModal = queryElement<HTMLDialogElement>("#loss-modal")
		this.lossModalWrapper = queryElement(".loss-modal__wrapper", this.lossModal)

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

		this.gameBlast = gameBlastFactory({
			gameContainer: this.gameContainer,
			updateBoosterCounter: this.updateBoosterCounter.bind(this),
			toggleBoosterButtonActive: this.toggleBoosterButtonActive.bind(this),
			updateScoreCounter: this.updateScoreCounter.bind(this),
			updateMovesCounter: this.updateMovesCounter.bind(this),
			openWinModal: this.openWinModal.bind(this),
			openLossModal: this.openLossModal.bind(this),
		})

		this.setListeners()

		await this.gameBlast.init()
	}

	private setListeners() {
		this.setWinModalListeners()
		this.setLossModalListeners()
		this.setBoostersButtonsListeners()
		window.addEventListener("resize", this.handleWindowResize)
	}

	override async unmount() {
		window.removeEventListener("resize", this.handleWindowResize)
		await this.gameBlast?.destroy()
		super.unmount()
	}

	private handleWindowResize = this.onResize.bind(this)
	private onResize() {
		this.gameBlast?.onResize()
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

	private updateBoosterCounter(booster: BoosterName, currentValue: number) {
		if (this.boostersElementsMap === null) {
			return
		}
		const counter = this.boostersElementsMap[booster].counter
		counter.textContent = currentValue.toString()
	}

	private setBoostersButtonsListeners() {
		if (this.boostersElementsMap === null || this.gameBlast === undefined) {
			return
		}

		for (const [boosterName, booster] of Object.entries(
			this.boostersElementsMap
		)) {
			const button = booster.button
			const onClick = this.gameBlast.onBoosterButtonClick.bind(
				this.gameBlast,
				boosterName as BoosterName
			)

			button.addEventListener("click", onClick)
		}
	}

	private toggleBoosterButtonActive(boosterName: BoosterName, active: boolean) {
		if (this.boostersElementsMap === null) {
			return
		}
		const button = this.boostersElementsMap[boosterName].button
		button.classList.toggle("booster--active", active)
		button.parentElement?.classList.toggle(
			"boosters-container__item--raised",
			active
		)
		this.gameContainer?.classList.toggle(
			"game-blast-container__canvas-container--raised",
			active
		)
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

	private async openWinModal() {
		this.winModal?.showModal()
		this.winModal?.classList.add("win-modal--opening")
		await new Promise<void>((resolve) => {
			this.winModalWrapper?.addEventListener(
				"animationend",
				() => {
					this.winModal?.classList.remove("win-modal--opening")
					resolve()
				},
				{ once: true }
			)
		})
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
		this.closeWinModal()
	}

	private onWinModalBackdropClick() {
		this.gameBlast?.startNewLevel()
		this.closeWinModal()
	}

	private async closeWinModal() {
		this.winModal?.classList.add("win-modal--closing")
		await new Promise<void>((resolve) => {
			this.winModalWrapper?.addEventListener(
				"animationend",
				() => {
					this.winModal?.classList.remove("win-modal--closing")
					resolve()
				},
				{ once: true }
			)
		})

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

	private async openLossModal() {
		this.lossModal?.showModal()
		this.lossModal?.classList.add("loss-modal--opening")
		await new Promise<void>((resolve) => {
			this.lossModalWrapper?.addEventListener(
				"animationend",
				() => {
					this.lossModal?.classList.remove("loss-modal--opening")
					resolve()
				},
				{ once: true }
			)
		})
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
		this.closeLossModal()
	}

	private onLossModalBackdropClick() {
		this.gameBlast?.restartLevel()
		this.closeLossModal()
	}

	private async closeLossModal() {
		this.lossModal?.classList.add("loss-modal--closing")
		await new Promise<void>((resolve) => {
			this.lossModalWrapper?.addEventListener(
				"animationend",
				() => {
					this.lossModal?.classList.remove("loss-modal--closing")
					resolve()
				},
				{ once: true }
			)
		})

		this.lossModal?.close()
	}

	// #endregion
}
