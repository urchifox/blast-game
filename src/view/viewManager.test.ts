// @vitest-environment happy-dom

import { queryElement, queryElements } from "../helpers/dom"
import {
	createMountGate,
	FAKE_VIEW_NAME,
	FakeView,
	installFakeViewTemplates,
	SLOW_FAKE_VIEW_NAME,
	SlowFakeView,
} from "./fakeViews"
import { LoadingScreen } from "./loadingScreen"
import { ViewManager } from "./viewManager"

function createSUT() {
	const loadingScreenRoot = document.createElement("div")
	document.body.appendChild(loadingScreenRoot)
	const appRoot = document.createElement("div")
	const loadingScreen = new LoadingScreen({ root: loadingScreenRoot })
	loadingScreen.hide()
	const viewManager = new ViewManager({
		appRoot,
		loadingScreen,
	})

	return { viewManager, appRoot, loadingScreenRoot }
}

function isLoadingScreenHidden(loadingScreenRoot: HTMLElement) {
	return loadingScreenRoot.classList.contains("loading-screen--hidden")
}

describe("ViewManager", () => {
	beforeEach(() => {
		installFakeViewTemplates()
	})

	afterEach(() => {
		document.body.replaceChildren()
	})

	it("mounts the view and hides the loading screen", async () => {
		const { viewManager, appRoot, loadingScreenRoot } = createSUT()

		await viewManager.init({ viewClass: FakeView, viewProps: {} })

		expect(appRoot.querySelector(`#${FAKE_VIEW_NAME}-root`)).not.toBeNull()
		expect(isLoadingScreenHidden(loadingScreenRoot)).toBe(true)
	})

	it("shows the loading screen until the view finishes mounting", async () => {
		const { viewManager, appRoot, loadingScreenRoot } = createSUT()
		const mountGate = createMountGate()

		const opening = viewManager.init({
			viewClass: SlowFakeView,
			viewProps: { mountGate },
		})
		await mountGate.started

		expect(isLoadingScreenHidden(loadingScreenRoot)).toBe(false)

		mountGate.finish()
		await opening

		expect(appRoot.querySelector(`#${SLOW_FAKE_VIEW_NAME}-root`)).not.toBeNull()
		expect(isLoadingScreenHidden(loadingScreenRoot)).toBe(true)
	})

	it("removes the previous view when another view opens", async () => {
		const { viewManager, appRoot } = createSUT()

		await viewManager.init({ viewClass: FakeView, viewProps: {} })
		const firstView = queryElement(`#${FAKE_VIEW_NAME}-root`, appRoot)

		await viewManager.openView({ viewClass: FakeView, viewProps: {} })

		expect(appRoot.contains(firstView)).toBe(false)
		expect(queryElements(`#${FAKE_VIEW_NAME}-root`, appRoot)).toHaveLength(1)
	})
})
