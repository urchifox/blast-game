export function queryElement<T extends HTMLElement = HTMLElement>(
	selector: string,
	parent?: HTMLElement
): T {
	const parentElement = parent ?? document
	const element = parentElement.querySelector<T>(selector)

	if (element === null) {
		throw Error(`Element "${selector}" not found in ${parentElement}`)
	}

	if (!isHtmlElement(element)) {
		throw Error(`Element "${selector}" is not an HTMLElement`)
	}

	return element
}

export function queryElements<T extends HTMLElement = HTMLElement>(
	selector: string,
	parent?: HTMLElement
): T[] {
	return [...(parent ?? document).querySelectorAll<T>(selector)]
}

export function isHtmlElement(element: unknown): element is HTMLElement {
	return element instanceof HTMLElement
}
