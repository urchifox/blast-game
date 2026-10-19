// @vitest-environment happy-dom

import { flushPromises } from "../flow/testHelpers"
import { ModalUI } from "./modalUI"

function createSUT() {
	const modal = document.createElement("dialog")
	const modalWrapper = document.createElement("div")
	modalWrapper.classList.add("modal__wrapper")
	modal.appendChild(modalWrapper)
	const modalButton = document.createElement("button")
	modalButton.classList.add("modal__button")
	modalWrapper.appendChild(modalButton)
	const onButtonClick = vi.fn()
	const onBackdropClick = vi.fn()
	const modalUI = new ModalUI({ modal, onButtonClick, onBackdropClick })

	return {
		modalUI,
		modal,
		modalWrapper,
		modalButton,
		onButtonClick,
		onBackdropClick,
	}
}

describe("ModalUI", () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it("sets button click handler", () => {
		const { modalButton, onButtonClick } = createSUT()

		modalButton.click()

		expect(onButtonClick).toHaveBeenCalledOnce()
	})

	it("opens modal with opening animation", async () => {
		const { modalUI, modal, modalWrapper } = createSUT()

		modalUI.open()
		expect(modal.open).toBe(true)
		expect(modal.classList.contains("modal--opening")).toBe(true)

		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()
		expect(modal.classList.contains("modal--opening")).toBe(false)
	})

	it("ignores opening if already opened", async () => {
		const { modalUI, modal, modalWrapper } = createSUT()

		modalUI.open()
		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()

		modalUI.open()
		expect(modal.open).toBe(true)
		expect(modal.classList.contains("modal--opening")).toBe(false)
	})

	it("sets button click handler and closes modal after animation ends", async () => {
		const {
			modalUI,
			modal,
			modalButton,
			modalWrapper,
			onButtonClick,
			onBackdropClick,
		} = createSUT()
		modalUI.open()
		modalWrapper.dispatchEvent(new Event("animationend"))

		modalButton.click()
		expect(modal.open).toBe(true)
		expect(modal.classList.contains("modal--closing")).toBe(true)

		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()
		expect(modal.classList.contains("modal--closing")).toBe(false)
		expect(onButtonClick).toHaveBeenCalledOnce()
		expect(onBackdropClick).not.toHaveBeenCalled()
		expect(modal.open).toBe(false)
	})

	it("sets backdrop click handler and closes modal after animation ends", async () => {
		const { modalUI, modal, modalWrapper, onBackdropClick, onButtonClick } =
			createSUT()
		modalUI.open()
		modalWrapper.dispatchEvent(new Event("animationend"))

		modal.click()
		expect(modal.open).toBe(true)
		expect(modal.classList.contains("modal--closing")).toBe(true)

		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()
		expect(modal.classList.contains("modal--closing")).toBe(false)
		expect(onBackdropClick).toHaveBeenCalledOnce()
		expect(onButtonClick).not.toHaveBeenCalled()
		expect(modal.open).toBe(false)
	})

	it("does not close modal if clicked on wrapper", async () => {
		const { modalUI, modal, modalWrapper, onBackdropClick, onButtonClick } =
			createSUT()
		modalUI.open()
		modalWrapper.dispatchEvent(new Event("animationend"))

		modalWrapper.click()
		expect(modal.classList.contains("modal--closing")).toBe(false)
		await flushPromises()

		expect(onBackdropClick).not.toHaveBeenCalled()
		expect(onButtonClick).not.toHaveBeenCalled()
		expect(modal.open).toBe(true)
	})

	it("ignores button click while opening", async () => {
		const {
			modalUI,
			modal,
			modalWrapper,
			modalButton,
			onBackdropClick,
			onButtonClick,
		} = createSUT()
		modalUI.open()
		modalButton.click()
		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()

		expect(onBackdropClick).not.toHaveBeenCalled()
		expect(onButtonClick).not.toHaveBeenCalled()
		expect(modal.open).toBe(true)
	})

	it("ignores modal click while opening", async () => {
		const { modalUI, modal, modalWrapper, onBackdropClick, onButtonClick } =
			createSUT()
		modalUI.open()
		modal.click()
		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()

		expect(onBackdropClick).not.toHaveBeenCalled()
		expect(onButtonClick).not.toHaveBeenCalled()
		expect(modal.open).toBe(true)
	})

	it("ignores clicks while closing", async () => {
		const {
			modalUI,
			modal,
			modalWrapper,
			modalButton,
			onBackdropClick,
			onButtonClick,
		} = createSUT()
		modalUI.open()
		modalWrapper.dispatchEvent(new Event("animationend"))

		modal.click()
		modalButton.click()
		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()

		expect(onBackdropClick).toHaveBeenCalledOnce()
		expect(onButtonClick).not.toHaveBeenCalled()
		expect(modal.open).toBe(false)
	})

	it("ignores opening while closing", async () => {
		const {
			modalUI,
			modal,
			modalButton,
			modalWrapper,
			onButtonClick,
			onBackdropClick,
		} = createSUT()
		modalUI.open()
		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()

		modalButton.click()
		modalUI.open()
		expect(modal.classList.contains("modal--opening")).toBe(false)
		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()

		expect(modal.classList.contains("modal--closing")).toBe(false)
		expect(modal.classList.contains("modal--opening")).toBe(false)
		expect(onButtonClick).toHaveBeenCalledOnce()
		expect(onBackdropClick).not.toHaveBeenCalled()
		expect(modal.open).toBe(false)
	})

	it("opens and closes modal after it was opened and closed", async () => {
		const {
			modalUI,
			modal,
			modalButton,
			modalWrapper,
			onButtonClick,
			onBackdropClick,
		} = createSUT()
		modalUI.open()
		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()
		modalButton.click()
		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()

		modalUI.open()
		expect(modal.open).toBe(true)
		expect(modal.classList.contains("modal--opening")).toBe(true)

		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()
		expect(modal.classList.contains("modal--opening")).toBe(false)

		modalButton.click()
		expect(modal.open).toBe(true)
		expect(modal.classList.contains("modal--closing")).toBe(true)

		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()
		expect(modal.classList.contains("modal--closing")).toBe(false)
		expect(onButtonClick).toHaveBeenCalledTimes(2)
		expect(onBackdropClick).not.toHaveBeenCalled()
		expect(modal.open).toBe(false)
	})

	it("prevents default behaviour for cancel event", async () => {
		const { modalUI, modal, modalWrapper, onBackdropClick, onButtonClick } =
			createSUT()
		modalUI.open()
		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()

		const cancelEvent = new Event("cancel", { cancelable: true })
		modal.dispatchEvent(cancelEvent)
		expect(cancelEvent.defaultPrevented).toBe(true)
		expect(onBackdropClick).not.toHaveBeenCalled()
		expect(onButtonClick).not.toHaveBeenCalled()
		expect(modal.open).toBe(true)
	})

	it("prevents default behaviour for escape key event", async () => {
		const { modalUI, modal, modalWrapper, onBackdropClick, onButtonClick } =
			createSUT()
		modalUI.open()
		modalWrapper.dispatchEvent(new Event("animationend"))
		await flushPromises()

		const keydownEvent = new KeyboardEvent("keydown", {
			key: "Escape",
			cancelable: true,
		})
		modal.dispatchEvent(keydownEvent)
		expect(keydownEvent.defaultPrevented).toBe(true)
		expect(onBackdropClick).not.toHaveBeenCalled()
		expect(onButtonClick).not.toHaveBeenCalled()
		expect(modal.open).toBe(true)
	})
})
