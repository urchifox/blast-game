import { isHtmlElement, queryElement } from "../helpers/dom"

export type ViewConstructor<T extends View = View> = new () => T

export abstract class View {
	readonly name: string
	readonly needLoadingScreenOnMount: boolean = false

	private readonly element: HTMLElement
	private readonly appRoot: HTMLElement = queryElement("#app")

	constructor(name: string) {
		this.name = name

		const templateId = this.name
		const template = document.getElementById(templateId)
		if (!(template instanceof HTMLTemplateElement)) {
			throw new Error(`Template "${templateId}" not found or not a <template>`)
		}
		const content = template.content.cloneNode(true) as DocumentFragment
		const element = content.firstElementChild
		if (!isHtmlElement(element)) {
			throw new Error(`Template "${templateId}" has no root HTMLElement`)
		}
		this.element = element
	}

	mount(): void | Promise<void> {
		this.appRoot.appendChild(this.element)
	}

	unmount() {
		this.element.remove()
	}
}
