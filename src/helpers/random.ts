export function pickRandomItem<Item>(
	array: Array<Item> | Readonly<Array<Item>>
): Item {
	return array[Math.floor(Math.random() * array.length)]
}

export function getRandomNumber({
	min,
	max,
	step = 1,
}: {
	min: number
	max: number
	step?: number
}): number {
	return min + Math.floor(Math.random() * ((max - min) / step + 1)) * step
}
