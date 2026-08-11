import "./assets/style/loading-screen.css"

type LoadingScreenProps = {
	root: HTMLElement
}

export class LoadingScreen {
	private readonly loadingScreen: HTMLElement

	constructor(props: LoadingScreenProps) {
		this.loadingScreen = props.root
	}

	show() {
		this.toggleVisibility(true)
	}

	hide() {
		this.toggleVisibility(false)
	}

	private toggleVisibility(visible: boolean) {
		this.loadingScreen.classList.toggle("loading-screen--hidden", !visible)
	}
}
