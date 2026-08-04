import "./assets/style/game-blast-container.css"
import "./assets/style/win-modal.css"
import "./assets/style/loss-modal.css"

import { View } from "../view/view"
import { GameBlast } from "../game-blast/gameBlast"
import {
	getElementInnerSize,
	isHtmlElement,
	queryElement,
} from "../helpers/dom"
import { PhaserRenderer } from "../game-blast/rendering/phaserRenderer"
import { BoosterName } from "../game-blast/boosters/booster"
import { Field } from "../game-blast/field"
import { Grid } from "../game-blast/grid"
import { Progress } from "../helpers/progress"
import { ProgressManager } from "../game-blast/progressManager"
import { LevelGenerator } from "../game-blast/levelGenerator"
import { GameRules } from "../game-blast/gameRules"
import { GamePresenter } from "../game-blast/gamePresenter"
import { AnimationsManager } from "../helpers/animationManager"
import { FieldQueries } from "../game-blast/fieldQueries"
import { createId } from "../helpers/random"

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

	constructor() {
		super("game-blast")
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

		const gameRules = new GameRules()
		const randomizationFunction = Math.random

		const boosterProps = {
			updateCounter: this.updateBoosterCounter.bind(this),
			onActiveChange: this.toggleBoosterButtonActive.bind(this),
		}
		const grid = new Grid({
			getContainerSize: this.getGameContainerSize.bind(this),
		})
		const field = new Field({
			getFieldSnapshot: grid.getSnapshot.bind(grid),
			randomizationFunction,
			createId,
		})

		const scoreProgress = new Progress({
			updateCounter: ({ currentValue, targetValue }) =>
				this.updateScoreCounter({
					score: currentValue,
					goalScore: targetValue,
				}),
		})
		const movesProgress = new Progress({
			updateCounter: ({ currentValue, targetValue }) =>
				this.updateMovesCounter({
					movesNumber: currentValue,
					movesLimit: targetValue,
				}),
		})
		const progressManager = new ProgressManager({
			scoreProgress,
			movesProgress,
		})
		const levelGenerator = new LevelGenerator({
			gameRules,
			randomizationFunction,
		})

		const animationsManager = new AnimationsManager()
		const renderer = new PhaserRenderer({
			container: this.gameContainer,
			getContainerOffset: this.getContainerOffset.bind(this),
		})

		const fieldQueries = new FieldQueries({ field, grid })

		const presenter = new GamePresenter({
			field,
			grid,
			renderer,
			animationsManager,
			setGameContainerSize: this.setGameContainerSize.bind(this),
		})

		this.gameBlast = new GameBlast({
			fieldQueries,
			presenter,
			gameRules,
			levelGenerator,
			progressManager,
			boosterProps,
			randomizationFunction,
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

	private setGameContainerSize(
		sizes: { width: number; height: number } | null
	) {
		const isResetSizes = sizes === null
		this.gameContainer?.classList.toggle(
			"game-blast-container__canvas-container--fullsize",
			isResetSizes
		)
		if (isResetSizes) {
			return
		}

		const { width, height } = sizes
		this.gameContainer?.style.setProperty("--field-width", `${width}px`)
		this.gameContainer?.style.setProperty("--field-height", `${height}px`)
	}

	private getContainerOffset() {
		if (this.gameContainer === undefined) {
			return { offsetX: 0, offsetY: 0 }
		}

		const { x, y } = this.gameContainer.getBoundingClientRect()
		const style = window.getComputedStyle(this.gameContainer)
		const offsetX = x + parseFloat(style.paddingLeft || "0")
		const offsetY = y + parseFloat(style.paddingTop || "0")

		return { offsetX, offsetY }
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

	private getGameContainerSize() {
		if (this.gameContainer === undefined) {
			return { width: 0, height: 0 }
		}
		return getElementInnerSize({ element: this.gameContainer })
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
