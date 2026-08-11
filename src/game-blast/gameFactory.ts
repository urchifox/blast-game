import { AnimationsManager } from "../helpers/animationManager"
import { createId } from "../helpers/random"
import { CompletionManager } from "./domain/completionManager"
import { Field } from "./domain/field"
import { FieldQueries } from "./domain/fieldQueries"
import { Game, GameProps } from "./game"
import { GamePresenter } from "./gamePresenter"
import { GameRules } from "./domain/gameRules"
import { LevelGenerator } from "./domain/levelGenerator"
import { ProgressManager } from "./progressManager"
import { PhaserRenderer } from "./rendering/phaserRenderer"
import { Grid } from "./domain/grid"
import { boosterManagerFactory } from "./boosters/boosterManagerFactory"
import { tileClickManagerFactory } from "./tile-handlers/tileClickManagerFactory"
import { Layout } from "./layout"
import { LayoutCalculator } from "./layoutCalculator"
import { ActionManager } from "./actionManager"
import { ProgressCounter } from "./domain/progressCounter"
import { Counter } from "../helpers/counter"
import { BoosterUIContract } from "./boosters/types"
import { BoosterName } from "./domain/types"
import { ProgressUIContract } from "./types"

export type GameFactoryProps = {
	gameContainer: HTMLElement
	boosterUI: Record<BoosterName, BoosterUIContract>

	progressUI: ProgressUIContract
} & Pick<GameProps, "openWinModal" | "openLossModal">

export function gameFactory(props: GameFactoryProps) {
	const gameRules = new GameRules()
	const randomizationFunction = Math.random

	const layoutCalculator = new LayoutCalculator()
	const layout = new Layout({
		gameContainer: props.gameContainer,
		layoutCalculator: layoutCalculator,
	})

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
		layout: layout,
	})

	const presenter = new GamePresenter({
		layout: layout,
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
		boosterUI: props.boosterUI,
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
		openWinModal: props.openWinModal,
		openLossModal: props.openLossModal,
	})
}
