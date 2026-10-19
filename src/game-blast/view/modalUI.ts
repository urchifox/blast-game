import { isHtmlElement, queryElement } from "../../helpers/dom"
import { ModalUIContract } from "../types"

export type ModalProps = {
	modal: HTMLDialogElement
	onButtonClick?: () => void
	onBackdropClick?: () => void
}

export class ModalUI implements ModalUIContract {
	private readonly modal: ModalProps["modal"]
	private readonly _onButtonClick: ModalProps["onButtonClick"]
	private readonly _onBackdropClick: ModalProps["onBackdropClick"]

	private readonly modalWrapper: HTMLElement
	private isOpening = false
	private isClosing = false

	constructor(props: ModalProps) {
		this.modal = props.modal
		this.modalWrapper = queryElement(".modal__wrapper", this.modal)
		this._onButtonClick = props.onButtonClick
		this._onBackdropClick = props.onBackdropClick

		this.modal.addEventListener("click", this.onClick.bind(this))
		this.modal.addEventListener("cancel", (event: Event) =>
			event.preventDefault()
		)
		this.modal.addEventListener("keydown", (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault()
			}
		})
	}

	open() {
		if (this.modal.open || this.isOpening || this.isClosing) {
			return
		}

		this.isOpening = true
		this.modal.showModal()
		this.modal.classList.add("modal--opening")

		void new Promise<void>(() => {
			this.modalWrapper.addEventListener(
				"animationend",
				() => {
					this.modal.classList.remove("modal--opening")
					this.isOpening = false
				},
				{ once: true }
			)
		})
	}

	private onClick(event: Event) {
		event.preventDefault()
		if (this.isOpening || this.isClosing) {
			return
		}

		const target = event.target
		if (!isHtmlElement(target)) {
			return
		}
		if (target.closest(".modal__button") !== null) {
			this.onButtonClick()
			return
		}
		if (target.closest(".modal__wrapper") !== null) {
			return
		}
		this.onBackdropClick()
	}

	private onButtonClick() {
		this._onButtonClick?.()
		this.close()
	}

	private onBackdropClick() {
		this._onBackdropClick?.()
		this.close()
	}

	private close() {
		if (!this.modal.open) {
			return
		}

		this.isClosing = true
		this.modal.classList.add("modal--closing")

		void new Promise<void>(() => {
			this.modalWrapper.addEventListener(
				"animationend",
				() => {
					this.modal.classList.remove("modal--closing")
					this.modal.close()
					this.isClosing = false
				},
				{ once: true }
			)
		})
	}
}
