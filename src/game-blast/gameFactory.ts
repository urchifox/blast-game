import { AnimationsManager } from "../helpers/animationManager"
import { createId } from "../helpers/random"
import { CompletionManager } from "./domain/completionManager"
import { Field } from "./domain/field"
import { FieldQueries } from "./domain/fieldQueries"
import { Game } from "./game"
import { Presenter } from "./flow/presenter"
import { GameRules } from "./domain/gameRules"
import { LevelGenerator } from "./domain/levelGenerator"
import { ProgressManager } from "./flow/progressManager"
import { PhaserRenderer } from "./rendering/phaserRenderer"
import { Grid } from "./domain/grid"
import { boosterManagerFactory } from "./flow/boosterManagerFactory"
import { tileClickManagerFactory } from "./flow/tileClickManagerFactory"
import { ActionManager } from "./flow/actionManager"
import { ProgressCounter } from "./domain/progressCounter"
import { Counter } from "../helpers/counter"
import {
	LayoutUIContract,
	ModalUIContract,
	BoosterUIMap,
	ProgressUIContract,
} from "./types"

export type GameFactoryProps = {
	gameContainer: HTMLElement
	layoutUI: LayoutUIContract
	boosterUIMap: BoosterUIMap
	progressUI: ProgressUIContract
	winModalUI: ModalUIContract
	lossModalUI: ModalUIContract
}

export function gameFactory(props: GameFactoryProps) {
	const gameRules = new GameRules()
	const randomizationFunction = Math.random

	const grid = new Grid()

	const field = new Field({
		getFieldSnapshot: grid.getSnapshot.bind(grid),
		randomizationFunction,
		createId,
	})
	const fieldQueries = new FieldQueries({ field, grid })

	const animationsManager = new AnimationsManager()
	const renderer = new PhaserRenderer({
		container: props.gameContainer,
		layoutUI: props.layoutUI,
	})

	const presenter = new Presenter({
		layoutUI: props.layoutUI,
		field,
		grid,
		renderer,
		animationsManager,
	})

	const actionManager = new ActionManager({
		presenter: presenter,
	})

	const tileClickManager = tileClickManagerFactory({
		fieldQueries: fieldQueries,
		actionManager: actionManager,
		gameRules: gameRules,
		randomizationFunction: randomizationFunction,
	})

	const boosterManager = boosterManagerFactory({
		boosterUIMap: props.boosterUIMap,
		fieldQueries: fieldQueries,
		actionManager: actionManager,
		gameRules: gameRules,
	})

	const progressCounter = new ProgressCounter({
		scoreCounter: new Counter(),
		movesCounter: new Counter(),
		gameRules: gameRules,
	})

	const progressManager = new ProgressManager({
		progressCounter: progressCounter,
		progressUI: props.progressUI,
	})
	const completionManager = new CompletionManager({
		fieldQueries: fieldQueries,
		gameRules: gameRules,
		progressCounter: progressCounter,
	})

	const levelGenerator = new LevelGenerator({
		gameRules,
		randomizationFunction,
	})

	return new Game({
		fieldQueries,
		presenter,
		levelGenerator,
		progressManager,
		tileClickManager,
		boosterManager,
		completionManager,
		winModalUI: props.winModalUI,
		lossModalUI: props.lossModalUI,
	})
}
