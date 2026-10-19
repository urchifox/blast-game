import { LayoutCalculator } from "./layoutCalculator"

describe("LayoutCalculator", () => {
	const layoutCalculator = new LayoutCalculator()

	it("fits tiles to the container width when height is not a constraint", () => {
		const sizes = layoutCalculator.getSizes({
			columns: 5,
			rows: 5,
			containerWidth: 300,
			containerHeight: 1000,
		})

		expect(sizes.tileWidth).toBeCloseTo(60)
		expect(sizes.tileHeight).toBeCloseTo(67.2)
		expect(sizes.gridWidth).toBeCloseTo(300)
		expect(sizes.gridHeight).toBeCloseTo(309.12)
		expect(sizes.tileGapX).toBe(0)
		expect(sizes.tileGapY).toBeCloseTo(-6.72)
	})

	it("caps the tile width when the container is large", () => {
		const sizes = layoutCalculator.getSizes({
			columns: 2,
			rows: 2,
			containerWidth: 1000,
			containerHeight: 1000,
		})

		expect(sizes.tileWidth).toBe(70)
		expect(sizes.tileHeight).toBeCloseTo(78.4)
		expect(sizes.gridWidth).toBeCloseTo(140)
		expect(sizes.gridHeight).toBeCloseTo(148.96)
		expect(sizes.tileGapX).toBe(0)
		expect(sizes.tileGapY).toBeCloseTo(-7.84)
	})

	it("fits tiles to the container height when the width-based grid is too tall", () => {
		const sizes = layoutCalculator.getSizes({
			columns: 5,
			rows: 10,
			containerWidth: 1000,
			containerHeight: 455,
		})

		expect(sizes.tileWidth).toBeCloseTo(44.64)
		expect(sizes.tileHeight).toBeCloseTo(50)
		expect(sizes.gridWidth).toBeCloseTo(223.21)
		expect(sizes.gridHeight).toBeCloseTo(455)
		expect(sizes.tileGapX).toBe(0)
		expect(sizes.tileGapY).toBeCloseTo(-5)
	})

	it.each([
		{ columns: 8, rows: 8, containerWidth: 400, containerHeight: 600 },
		{ columns: 8, rows: 8, containerWidth: 600, containerHeight: 400 },
		{ columns: 3, rows: 12, containerWidth: 320, containerHeight: 480 },
		{ columns: 12, rows: 3, containerWidth: 320, containerHeight: 480 },
		{ columns: 1, rows: 1, containerWidth: 10, containerHeight: 10 },
	])(
		"keeps the grid inside the container and preserves the tile ratio for %o",
		(params) => {
			const sizes = layoutCalculator.getSizes(params)

			expect(sizes.gridWidth).toBeLessThanOrEqual(params.containerWidth + 1e-9)
			expect(sizes.gridHeight).toBeLessThanOrEqual(
				params.containerHeight + 1e-9
			)
			expect(sizes.tileWidth / sizes.tileHeight).toBeCloseTo(0.89)
			expect(sizes.tileWidth).toBeLessThanOrEqual(70)
		}
	)

	it("return all zeros for a zero-size container", () => {
		const sizes = layoutCalculator.getSizes({
			columns: 5,
			rows: 10,
			containerWidth: 0,
			containerHeight: 0,
		})

		expect(sizes.tileWidth).toBe(0)
		expect(sizes.tileHeight).toBe(0)
		expect(sizes.gridWidth).toBe(0)
		expect(sizes.gridHeight).toBe(0)
		expect(sizes.tileGapX).toBe(0)
		expect(Math.abs(sizes.tileGapY)).toBe(0)
	})
})
