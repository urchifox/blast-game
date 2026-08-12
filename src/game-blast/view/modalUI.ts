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

	async open() {
		this.modal.showModal()
		this.modal.classList.add("modal--opening")
		await new Promise<void>((resolve) => {
			this.modalWrapper.addEventListener(
				"animationend",
				() => {
					this.modal.classList.remove("modal--opening")
					resolve()
				},
				{ once: true }
			)
		})
	}

	private onClick(event: Event) {
		event.preventDefault()
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

	private async close() {
		this.modal.classList.add("modal--closing")
		await new Promise<void>((resolve) => {
			this.modalWrapper.addEventListener(
				"animationend",
				() => {
					this.modal.classList.remove("modal--closing")
					resolve()
				},
				{ once: true }
			)
		})

		this.modal.close()
	}
}
