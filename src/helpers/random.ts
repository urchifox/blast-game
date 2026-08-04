import { nanoid } from "nanoid"

export type RandomizationFunction = () => number
export type IdGenerator = () => string

export function pickRandomItem<Item>(
	array: Array<Item> | ReadonlyArray<Item>,
	randomizationFunction: RandomizationFunction = Math.random
): Item {
	return array[Math.floor(randomizationFunction() * array.length)]
}

export function getRandomNumber(
	{
		min,
		max,
		step = 1,
	}: {
		min: number
		max: number
		step?: number
	},
	randomizationFunction: RandomizationFunction = Math.random
): number {
	if (step <= 0) {
		throw new Error("Step must be greater than 0")
	}

	if (max < min) {
		throw new Error("Max must be greater than or equal to min")
	}

	const stepsCount = Math.floor((max - min) / step)
	return min + Math.floor(randomizationFunction() * (stepsCount + 1)) * step
}

export function createId(): string {
	return nanoid()
}
