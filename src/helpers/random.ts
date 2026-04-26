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
	if (step <= 0) {
		throw new Error("Step must be greater than 0")
	}

	if (max < min) {
		throw new Error("Max must be greater than or equal to min")
	}

	const stepsCount = Math.floor((max - min) / step)
	return min + Math.floor(Math.random() * (stepsCount + 1)) * step
}
