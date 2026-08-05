import { AnimationsManager } from "../helpers/animationManager"
import { Progress } from "../helpers/progress"
import { createId } from "../helpers/random"
import { CompletionManager } from "./completionManager"
import { Field } from "./field"
import { FieldQueries } from "./fieldQueries"
import { GameBlast, GameBlastProps } from "./gameBlast"
import { GamePresenter } from "./gamePresenter"
import { GameRules } from "./gameRules"
import { LevelGenerator } from "./levelGenerator"
import { ProgressManager } from "./progressManager"
import { PhaserRenderer } from "./rendering/phaserRenderer"
import { Grid } from "./grid"
import { boosterManagerFactory } from "./boosters/boosterManagerFactory"
import { BoosterName } from "./types"
import { tileClickManagerFactory } from "./tile-handlers/tileClickManagerFactory"
import { Layout } from "./layout"

export type GameBlastFactoryProps = {
	gameContainer: HTMLElement
	getGameContainerSize: () => { width: number; height: number }
	getContainerOffset: () => { offsetX: number; offsetY: number }
	setGameContainerSize: (
		sizes: {
			width: number
			height: number
		} | null
	) => void

	updateBoosterCounter: (booster: BoosterName, currentValue: number) => void
	toggleBoosterButtonActive: (booster: BoosterName, active: boolean) => void

	updateScoreCounter: (props: { score: number; goalScore: number }) => void
	updateMovesCounter: (props: {
		movesNumber: number
		movesLimit: number
	}) => void
} & Pick<GameBlastProps, "openWinModal" | "openLossModal">

export function gameBlastFactory(props: GameBlastFactoryProps) {
	const gameRules = new GameRules()
	const randomizationFunction = Math.random

	const layout = new Layout({
		getGameContainerSize: props.getGameContainerSize,
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
		getContainerOffset: props.getContainerOffset,
	})

	const presenter = new GamePresenter({
		layout,
		field,
		grid,
		renderer,
		animationsManager,
		setGameContainerSize: props.setGameContainerSize,
	})

	const tileClickManager = tileClickManagerFactory({
		fieldQueries: fieldQueries,
		presenter: presenter,
		gameRules: gameRules,
		randomizationFunction: randomizationFunction,
	})

	const boosterProps = {
		updateCounter: props.updateBoosterCounter,
		onActiveChange: props.toggleBoosterButtonActive,
	}

	const boosterManager = boosterManagerFactory({
		fieldQueries: fieldQueries,
		presenter: presenter,
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
		presenter: presenter,
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

	return new GameBlast({
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
