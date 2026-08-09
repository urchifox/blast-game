import { AnimationsManager } from "../helpers/animationManager"
import { Progress } from "../helpers/progress"
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
import { BoosterName } from "./domain/types"
import { tileClickManagerFactory } from "./tile-handlers/tileClickManagerFactory"
import { Layout } from "./layout"
import { LayoutCalculator } from "./layoutCalculator"
import { ActionManager } from "./actionManager"

export type GameFactoryProps = {
	gameContainer: HTMLElement
	toggleGameContainerResetSizes: (isResetSizes: boolean) => void

	updateBoosterCounter: (booster: BoosterName, currentValue: number) => void
	toggleBoosterButtonActive: (booster: BoosterName, active: boolean) => void

	updateScoreCounter: (props: { score: number; goalScore: number }) => void
	updateMovesCounter: (props: {
		movesNumber: number
		movesLimit: number
	}) => void
} & Pick<GameProps, "openWinModal" | "openLossModal">

export function gameFactory(props: GameFactoryProps) {
	const gameRules = new GameRules()
	const randomizationFunction = Math.random

	const layoutCalculator = new LayoutCalculator()
	const layout = new Layout({
		gameContainer: props.gameContainer,
		layoutCalculator: layoutCalculator,
		toggleGameContainerResetSizes: props.toggleGameContainerResetSizes,
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

	const boosterProps = {
		updateCounter: props.updateBoosterCounter,
		onActiveChange: props.toggleBoosterButtonActive,
	}

	const boosterManager = boosterManagerFactory({
		fieldQueries: fieldQueries,
		actionManager: actionManager,
		gameRules: gameRules,
		boosterProps: boosterProps,
	})

	const scoreProgress = new Progress({
		updateCounter: ({ currentValue, targetValue }) =>
			props.updateScoreCounter({
				score: currentValue,
				goalScore: targetValue,
			}),
	})
	const movesProgress = new Progress({
		updateCounter: ({ currentValue, targetValue }) =>
			props.updateMovesCounter({
				movesNumber: currentValue,
				movesLimit: targetValue,
			}),
	})
	const progressManager = new ProgressManager({
		scoreProgress,
		movesProgress,
	})
	const completionManager = new CompletionManager({
		fieldQueries: fieldQueries,
		gameRules: gameRules,
		isScoreTargetReached:
			progressManager.isScoreTargetReached.bind(progressManager),
		isMovesTargetReached:
			progressManager.isMovesTargetReached.bind(progressManager),
	})

	const levelGenerator = new LevelGenerator({
		gameRules,
		randomizationFunction,
	})

	return new Game({
		fieldQueries,
		presenter,
		gameRules,
		levelGenerator,
		progressManager,
		tileClickManager,
		boosterManager,
		completionManager,
		openWinModal: props.openWinModal,
		openLossModal: props.openLossModal,
	})
}
