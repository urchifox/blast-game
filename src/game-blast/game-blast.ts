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

	private readonly handleWindowResize = this.onResize.bind(this)

	constructor({
		container,
		renderer,
	}: {
		container: HTMLElement
		renderer: Renderer
	}) {
		this.container = container
		const getContainerSize = () =>
			getElementInnerSize({ element: this.container })
		this.grid = new Grid({
			getContainerSize,
		})

		const getFieldSnapshot = this.grid.getSnapshot.bind(this.grid)

		this.field = new Field({ getFieldSnapshot })

		this.renderer = renderer

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
		this.renderer.resize(this.grid.updateGridSizes.bind(this.grid))
	}

	generateLevel() {
		const columns = DEFAULT_COLUMNS
		const rows = DEFAULT_ROWS

		this.grid.createGrid(columns, rows)
		this.field.generateTiles()
		this.renderer.renderTiles({
			tiles: this.field.getTiles(),
			gridSnapshot: this.grid.getSnapshot(),
		})
	}
}
