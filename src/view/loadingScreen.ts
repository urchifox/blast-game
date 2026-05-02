import "./../assets/style/loading-screen.css"

import { queryElement } from "../helpers/dom"

class LoadingScreen {
	private readonly loadingScreen: HTMLElement = queryElement("#loading-screen")

	show() {
		this.toggleVisibility(true)
	}

	hide() {
		this.toggleVisibility(false)
	}

	private toggleVisibility(visible: boolean) {
		this.loadingScreen.classList.toggle("hidden", !visible)
	}
}

export const loadingScreen = new LoadingScreen()
