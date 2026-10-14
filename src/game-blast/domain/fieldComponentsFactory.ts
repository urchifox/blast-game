import { IdGenerator, RandomizationFunction } from "../../helpers/random"
import { Field } from "./field"
import { FieldQueries } from "./fieldQueries"
import { Grid } from "./grid"

export type FieldComponentsFactoryProps = {
	randomizationFunction: RandomizationFunction
	createId: IdGenerator
}

export function fieldComponentsFactory(props: FieldComponentsFactoryProps) {
	const grid = new Grid()

	const field = new Field({
		getGridSnapshot: grid.getSnapshot.bind(grid),
		randomizationFunction: props.randomizationFunction,
		createId: props.createId,
	})

	const fieldQueries = new FieldQueries({ field, grid })

	return { grid, field, fieldQueries }
}
