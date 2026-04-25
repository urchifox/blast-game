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

/**
 * @param isIncludeBorders - default false, if true - return size with bordera and paddings
 * @param isIncludePadding - default false, if true - return size with padding
 */
export function getElementInnerSize(props: {
	element: HTMLElement
	isIncludeBorders?: boolean
	isIncludePadding?: boolean
}) {
	const { element, isIncludeBorders = false, isIncludePadding = false } = props
	const { clientWidth, clientHeight } = element
	const size = { width: clientWidth, height: clientHeight }

	if (isIncludeBorders) {
		return size
	}

	const style = window.getComputedStyle(element)
	const bordersInlineSum =
		parseFloat(style.borderLeftWidth || "0") +
		parseFloat(style.borderRightWidth || "0")
	const bordersBlockSum =
		parseFloat(style.borderTopWidth || "0") +
		parseFloat(style.borderBottomWidth || "0")

	size.width = Math.floor(size.width - bordersInlineSum)
	size.height = Math.floor(size.height - bordersBlockSum)

	if (isIncludePadding) {
		return size
	}

	const paddingInlineSum =
		parseFloat(style.paddingLeft || "0") + parseFloat(style.paddingRight || "0")
	const paddingBlockSum =
		parseFloat(style.paddingTop || "0") + parseFloat(style.paddingBottom || "0")

	size.width = Math.floor(size.width - paddingInlineSum)
	size.height = Math.floor(size.height - paddingBlockSum)

	return size
}
