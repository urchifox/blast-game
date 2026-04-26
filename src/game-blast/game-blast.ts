import { getElementInnerSize } from "../helpers/dom"
import { DEFAULT_COLUMNS, DEFAULT_ROWS } from "./config"
import { Field } from "./field"
import { Grid } from "./grid"
import { Renderer } from "./rendering/renderer"

export class GameBlast {
	private readonly container: HTMLElement
	private readonly renderer: Renderer
	private readonly grid: Grid
	private readonly field: Field
	private readonly toggleContainerFullSizeMode: (isFullSize: boolean) => void
	private readonly handleWindowResize = this.onResize.bind(this)

	constructor({
		container,
		renderer,
		toggleContainerFullSizeMode,
	}: {
		container: HTMLElement
		renderer: Renderer
		toggleContainerFullSizeMode: (isFullSize: boolean) => void
	}) {
		this.container = container
		this.renderer = renderer
		this.toggleContainerFullSizeMode = toggleContainerFullSizeMode

		const getContainerSize = () =>
			getElementInnerSize({ element: this.container })
		this.grid = new Grid({
			getContainerSize,
		})

		const getFieldSnapshot = this.grid.getSnapshot.bind(this.grid)

		this.field = new Field({ getFieldSnapshot })

		window.addEventListener("resize", this.handleWindowResize)
	}

	async init() {
		await this.renderer.init()
		this.generateLevel()
	}

	destroy() {
		window.removeEventListener("resize", this.handleWindowResize)
		this.renderer.destroy()
	}

	private onResize() {
		this.toggleContainerFullSizeMode(true)
		const snapshot = this.grid.updateGridSizes()
		this.toggleContainerFullSizeMode(false)
		this.renderer.resize(snapshot)
	}

	generateLevel() {
		const columns = DEFAULT_COLUMNS
		const rows = DEFAULT_ROWS

		this.toggleContainerFullSizeMode(true)
		this.grid.createGrid(columns, rows)
		this.field.generateTiles()
		this.renderer.renderTiles({
			tiles: this.field.getTiles(),
			gridSnapshot: this.grid.getSnapshot(),
		})
		this.toggleContainerFullSizeMode(false)
	}

	clearLevel() {
		this.field.clearTiles()
		this.renderer.clearTiles()
	}
}
