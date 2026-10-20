import { getRandomNumber, pickRandomItem } from "./random"

describe("random", () => {
	describe("getRandomNumber", () => {
		it.each([
			{ min: 0, max: 3, expected: [0, 1, 2, 3] },
			{ min: 2, max: 3, expected: [2, 3] },
			{ min: 0, max: 3, step: 2, expected: [0, 2] },
			{ min: 2, max: 3, step: 0.5, expected: [2, 2.5, 3] },
		])(
			"generates a random number between $min and $max according to step $step",
			({ min, max, step, expected }) => {
				const randomNumber = getRandomNumber({ min, max, step })

				expect(randomNumber).toBeOneOf(expected)
				expect(randomNumber).toBeGreaterThanOrEqual(min)
				expect(randomNumber).toBeLessThanOrEqual(max)
			}
		)

		it("reorder max and min if max is less than min", () => {
			const randomNumber = getRandomNumber({ min: 10, max: 0 })

			expect(randomNumber).toBeGreaterThanOrEqual(0)
			expect(randomNumber).toBeLessThanOrEqual(10)
		})

		it.each([
			{ min: 0, max: 3 },
			{ min: 2, max: 3 },
			{ min: 0, max: 3, step: 2 },
			{ min: 2, max: 3, step: 0.5 },
		])("returns min if max is equal min", ({ min, max, step }) => {
			const randomNumber = getRandomNumber({ min, max, step }, () => 0)

			expect(randomNumber).toBe(min)
		})

		it.each([{ step: 0 }, { step: -0.5 }, { step: -1 }])(
			"throws an error if step is equal to or less than 0",
			({ step }) => {
				expect(() => getRandomNumber({ min: 0, max: 10, step })).toThrow()
			}
		)

		it.each([
			{ min: 0, max: 3 },
			{ min: 2, max: 3 },
			{ min: 0, max: 3, step: 2 },
			{ min: 2, max: 3, step: 0.5 },
		])(
			"return min for randomization function that returns 0",
			({ min, max, step }) => {
				const randomNumber = getRandomNumber({ min, max, step }, () => 0)

				expect(randomNumber).toBe(min)
			}
		)

		it.each([
			{ min: 0, max: 3, expected: 3 },
			{ min: 2, max: 3, expected: 3 },
			{ min: 0, max: 3, step: 2, expected: 2 },
			{ min: 2, max: 3, step: 0.5, expected: 3 },
		])(
			"returns $expected for randomization function that returns 1 - Number.EPSILON",
			({ min, max, step, expected }) => {
				const randomNumber = getRandomNumber(
					{ min, max, step },
					() => 1 - Number.EPSILON
				)

				expect(randomNumber).toBe(expected)
			}
		)
	})

	describe("pickRandomItem", () => {
		it.each([{ array: [1, 3] }, { array: [10, 20, 30] }, { array: [3, 2, 1] }])(
			"returns a random item from the array",
			({ array }) => {
				const item = pickRandomItem(array)

				expect(item).toBeOneOf(array)
			}
		)

		it.each([
			{ array: [1, 3], expected: 1 },
			{ array: [10, 20, 30], expected: 10 },
			{ array: [3, 2, 1], expected: 3 },
		])(
			"returns first item from the array when randomization function returns 0",
			({ array, expected }) => {
				const item = pickRandomItem(array, () => 0)

				expect(item).toBe(expected)
			}
		)

		it.each([
			{ array: [1, 3], expected: 3 },
			{ array: [10, 20, 30], expected: 30 },
			{ array: [3, 2, 1], expected: 1 },
		])(
			"returns last item from the array when randomization function returns 1 - Number.EPSILON",
			({ array, expected }) => {
				const item = pickRandomItem(array, () => 1 - Number.EPSILON)

				expect(item).toBe(expected)
			}
		)
	})
})
