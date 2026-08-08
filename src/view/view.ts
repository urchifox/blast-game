import { isHtmlElement } from "../helpers/dom"

export type ViewConstructor<P = ViewProps> = new (props: P) => View

export type ViewProps = {
	name: string
	appRoot: HTMLElement
}

export abstract class View {
	readonly name: ViewProps["name"]
	private readonly appRoot: ViewProps["appRoot"]

	readonly needLoadingScreenOnMount: boolean = false
	isMounted = false

	private readonly element: HTMLElement

	constructor(props: ViewProps) {
		this.name = props.name
		this.appRoot = props.appRoot

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

	unmount(): void | Promise<void> {
		this.isMounted = false
		this.element.remove()
	}
}
