// @vitest-environment happy-dom

import { LayoutCalculator } from "./layoutCalculator"
import { LayoutUI } from "./layoutUI"

function createSUT() {
	const gameContainer = document.createElement("div")
	const layoutCalculator = new LayoutCalculator()
	const layoutUI = new LayoutUI({ gameContainer, layoutCalculator })
	return { layoutUI, gameContainer, layoutCalculator }
}

describe("LayoutUI", () => {
	it("initializes with zero values", () => {
		const { layoutUI } = createSUT()

		const snapshot = layoutUI.getSnapshot()

		expect(snapshot).toEqual({
			gridWidth: 0,
			gridHeight: 0,
			tileWidth: 0,
			tileHeight: 0,
			tileGapX: 0,
			tileGapY: 0,
		})
	})

	it("updates sizes according to the grid snapshot", () => {
		const { layoutUI, layoutCalculator } = createSUT()
		const getSizesSpy = vi.spyOn(layoutCalculator, "getSizes")
		const mocksizes = {
			gridWidth: 1,
			gridHeight: 2,
			tileWidth: 3,
			tileHeight: 4,
			tileGapX: 5,
			tileGapY: 6,
		}
		getSizesSpy.mockReturnValue(mocksizes)

		const snapshot = layoutUI.updateSizes({ columns: 5, rows: 5 })

		expect(snapshot).toEqual(mocksizes)
		expect(layoutUI.getSnapshot()).toEqual(mocksizes)
	})

	it("sets game container size when the sizes are not null", () => {
		const { layoutUI, gameContainer } = createSUT()

		layoutUI.setGameContainerSize({ width: 300, height: 1000 })

		expect(gameContainer.style.getPropertyValue("--field-width")).toBe("300px")
		expect(gameContainer.style.getPropertyValue("--field-height")).toBe(
			"1000px"
		)
	})

	it("updates game container size when the sizes are not null", () => {
		const { layoutUI, gameContainer } = createSUT()

		layoutUI.setGameContainerSize({ width: 300, height: 1000 })
		layoutUI.setGameContainerSize({ width: 400, height: 1200 })

		expect(gameContainer.style.getPropertyValue("--field-width")).toBe("400px")
		expect(gameContainer.style.getPropertyValue("--field-height")).toBe(
			"1200px"
		)
	})

	it("does not set game container size when the sizes are null", () => {
		const { layoutUI, gameContainer } = createSUT()

		layoutUI.setGameContainerSize(null)

		expect(gameContainer.style.getPropertyValue("--field-width")).toBe("")
		expect(gameContainer.style.getPropertyValue("--field-height")).toBe("")
	})

	it("ignores null values when setting game container size", () => {
		const { layoutUI, gameContainer } = createSUT()

		layoutUI.setGameContainerSize({ width: 300, height: 1000 })
		layoutUI.setGameContainerSize(null)

		expect(gameContainer.style.getPropertyValue("--field-width")).toBe("300px")
		expect(gameContainer.style.getPropertyValue("--field-height")).toBe(
			"1000px"
		)
	})

	it("toggles the fullsize class on the game container when the sizes are not null", () => {
		const { layoutUI, gameContainer } = createSUT()

		layoutUI.setGameContainerSize(null)
		expect(
			gameContainer.classList.contains(
				"game-blast-container__canvas-container--fullsize"
			)
		).toBe(true)

		layoutUI.setGameContainerSize({ width: 300, height: 1000 })
		expect(
			gameContainer.classList.contains(
				"game-blast-container__canvas-container--fullsize"
			)
		).toBe(false)
	})

	it("toggles the fullsize class on the canvas container when the sizes are not null", () => {
		const { layoutUI, gameContainer } = createSUT()
		const canvasContainer = document.createElement("div")
		canvasContainer.classList.add("canvas-container__canvas")
		gameContainer.appendChild(canvasContainer)

		layoutUI.setGameContainerSize(null)
		expect(
			canvasContainer.classList.contains("canvas-container__canvas--fullsize")
		).toBe(true)

		layoutUI.setGameContainerSize({ width: 300, height: 1000 })
		expect(
			canvasContainer.classList.contains("canvas-container__canvas--fullsize")
		).toBe(false)
	})

	it("returns the game container offset including its padding", () => {
		const { layoutUI, gameContainer } = createSUT()
		document.body.appendChild(gameContainer)
		vi.spyOn(gameContainer, "getBoundingClientRect").mockReturnValue({
			x: 10,
			y: 20,
		} as DOMRect)
		gameContainer.style.paddingLeft = "5px"
		gameContainer.style.paddingTop = "7px"

		const offset = layoutUI.getGameContainerOffset()

		expect(offset).toEqual({ offsetX: 15, offsetY: 27 })
		gameContainer.remove()
	})
})
