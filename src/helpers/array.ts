export function shuffle<T>(
	array: Array<T>,
	options?: { randomizationFunction?: () => number }
): T[] {
	const randomizationFunction = options?.randomizationFunction ?? Math.random
	let currentIndex = array.length,
		randomIndex

	while (currentIndex > 0) {
		randomIndex = Math.floor(randomizationFunction() * currentIndex)
		currentIndex--
		;[array[currentIndex], array[randomIndex]] = [
			array[randomIndex],
			array[currentIndex],
		]
	}

	return array
}
