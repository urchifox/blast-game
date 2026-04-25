import { getElementInnerSize, queryElement } from "../helpers/dom"
import { DEFAULT_COLUMNS, DEFAULT_ROWS } from "./config"
import { Field } from "./field"
import { Grid } from "./grid"
import { Visualization } from "./visualization/visualization"

export class GameBlast {
	private readonly container = queryElement("#canvas-container")
	private readonly visualization: Visualization
	private readonly grid: Grid
	private readonly field: Field

	private readonly handleWindowResize = this.onResize.bind(this)

	constructor() {
		this.grid = new Grid({
			getContainerSize: () => getElementInnerSize({ element: this.container }),
		})

		const getFieldSnapshot = this.grid.getSnapshot.bind(this.grid)

		this.field = new Field({ getFieldSnapshot })

		this.visualization = new Visualization({
			container: this.container,
			getFieldSnapshot,
		})

		window.addEventListener("resize", this.handleWindowResize)
	}

	async init() {
		await this.generateLevel()
	}

	destroy() {
		window.removeEventListener("resize", this.handleWindowResize)
		this.visualization.destroy()
	}

	private onResize() {
		this.visualization.resetContainerSizes()
		this.grid.updateGridSizes()
		this.visualization.updateContainerSizes()
	}

	async generateLevel() {
		const columns = DEFAULT_COLUMNS
		const rows = DEFAULT_ROWS

		this.grid.createGrid(columns, rows)
		this.field.generateTiles()
		await this.visualization.readyPromise
		this.visualization.renderTiles(this.field.getTiles())
	}
}
