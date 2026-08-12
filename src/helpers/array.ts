import { RandomizationFunction } from "./random"

export function getShuffledArray<T>(
	array: Array<T>,
	options?: { randomizationFunction?: RandomizationFunction }
): T[] {
	const randomizationFunction = options?.randomizationFunction ?? Math.random
	let currentIndex = array.length,
		randomIndex
	const newArray = [...array]

	while (currentIndex > 0) {
		randomIndex = Math.floor(randomizationFunction() * currentIndex)
		currentIndex--
		;[newArray[currentIndex], newArray[randomIndex]] = [
			newArray[randomIndex],
			newArray[currentIndex],
		]
	}

	return newArray
}
