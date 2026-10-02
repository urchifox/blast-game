import { Counter } from "../helpers/counter"
import { CompletionManager } from "./domain/completionManager"
import { GameRules } from "./domain/gameRules"
import { ProgressCounter } from "./domain/progressCounter"
import { ActionManager } from "./flow/actionManager"
import { ProgressManager } from "./flow/progressManager"
import { tilesManagerFactory } from "./flow/tilesManagerFactory"

import {
	createBoosterManagerStubbed,
	createModalUIStub,
	createPresenterStub,
	createProgressUIStub,
} from "./flow/testHelpers"
import { Game } from "./game"
import { FieldQueries } from "./domain/fieldQueries"
import {
	createLevelGeneratorStubbed,
	createRandomizationFunctionStub,
	createIdGeneratorStub,
} from "./domain/testHelpers"
import { ModalUIContract, PresenterContract, ProgressUIContract } from "./types"
import { IdGenerator, RandomizationFunction } from "../helpers/random"

export function createGameStubbed({
	fieldQueries,
	presenter = createPresenterStub(),
	progressUI = createProgressUIStub(),
	winModalUI = createModalUIStub(),
	lossModalUI = createModalUIStub(),
	randomizationFunction = createRandomizationFunctionStub(),
	createId = createIdGeneratorStub(),
}: {
	fieldQueries: FieldQueries
	presenter?: PresenterContract
	progressUI?: ProgressUIContract
	winModalUI?: ModalUIContract
	lossModalUI?: ModalUIContract
	randomizationFunction?: RandomizationFunction
	createId?: IdGenerator
}) {
	const gameRules = new GameRules()

	const actionManager = new ActionManager({
		presenter: presenter,
	})

	const tilesManager = tilesManagerFactory({
		fieldQueries: fieldQueries,
		actionManager: actionManager,
		gameRules: gameRules,
		randomizationFunction: randomizationFunction,
	})

	const boosterManager = createBoosterManagerStubbed({
		fieldQueries,
		actionManager,
		gameRules,
	})

	const progressCounter = new ProgressCounter({
		scoreCounter: new Counter(),
		movesCounter: new Counter(),
		gameRules: gameRules,
	})

	const progressManager = new ProgressManager({
		progressCounter: progressCounter,
		progressUI: progressUI,
	})
	const completionManager = new CompletionManager({
		fieldQueries: fieldQueries,
		gameRules: gameRules,
		progressCounter: progressCounter,
	})

	const levelGenerator = createLevelGeneratorStubbed({
		randomizationFunction: randomizationFunction,
		createId: createId,
	})

	return new Game({
		fieldQueries,
		presenter,
		levelGenerator,
		progressManager,
		tilesManager,
		boosterManager,
		completionManager,
		winModalUI,
		lossModalUI,
	})
}
