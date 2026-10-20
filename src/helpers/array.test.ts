import { getShuffledArray } from "./array"

describe("array", () => {
	describe("getShuffledArray", () => {
		it.each([
			{ array: [1, 2, 3, 4, 5] },
			{ array: [10, 20, 30, 40, 50] },
			{ array: [5, 4, 3, 2, 1] },
		])("returns a shuffled array", ({ array }) => {
			const stringifiedArray = JSON.stringify(array)
			const shuffledArray = getShuffledArray(array)

			expect(shuffledArray).not.toBe(array)
			expect(JSON.stringify(array)).toBe(stringifiedArray)
			expect(shuffledArray).toHaveLength(array.length)
			expect(shuffledArray).toEqual(expect.arrayContaining(array))
		})

		it.each([
			{ array: [1, 2, 3, 4, 5] },
			{ array: [10, 20, 30, 40, 50] },
			{ array: [5, 4, 3, 2, 1] },
		])(
			"doesnt change order when randomization function returns 0",
			({ array }) => {
				const stringifiedArray = JSON.stringify(array)
				const shuffledArray = getShuffledArray(array, {
					randomizationFunction: () => 0,
				})

				expect(shuffledArray).not.toBe(array)
				expect(JSON.stringify(shuffledArray)).toBe(stringifiedArray)
			}
		)

		it.each([
			{ array: [1, 3], expected: [3, 1] },
			{ array: [10, 20, 30], expected: [30, 20, 10] },
			{ array: [3, 2, 1], expected: [1, 2, 3] },
		])(
			"reverse array when randomization function returns 1 - Number.EPSILON",
			({ array, expected }) => {
				const shuffledArray = getShuffledArray(array, {
					randomizationFunction: () => 1 - Number.EPSILON,
				})

				expect(shuffledArray).not.toBe(array)
				expect(JSON.stringify(shuffledArray)).toBe(JSON.stringify(expected))
			}
		)
	})
})
