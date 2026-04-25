export function pickRandomItem<Item>(
	array: Array<Item> | Readonly<Array<Item>>
): Item {
	return array[Math.floor(Math.random() * array.length)]
}
