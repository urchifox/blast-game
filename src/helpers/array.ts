import { getRandomNumber, RandomizationFunction } from "./random"

export function getShuffledArray<T>(
	array: Array<T>,
	options?: { randomizationFunction?: RandomizationFunction }
): T[] {
	const randomizationFunction = options?.randomizationFunction ?? Math.random
	const pending = [...array]
	const newArray: T[] = []

	while (pending.length > 0) {
		const randomIndex = getRandomNumber(
			{ min: 0, max: pending.length - 1 },
			randomizationFunction
		)
		const [picked] = pending.splice(randomIndex, 1)
		newArray.push(picked)
	}

	return newArray
}
