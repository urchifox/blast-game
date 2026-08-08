import { LoadingScreen } from "./loadingScreen"
import { View, ViewConstructor } from "./view"

type ViewManagerProps = {
	appRoot: HTMLElement
	loadingScreen: LoadingScreen
}

type OpenViewProps<V extends ViewConstructor<{ appRoot: HTMLElement }>> = {
	viewClass: V
	viewProps: Omit<ConstructorParameters<V>[0], "appRoot">
}

export class ViewManager {
	private currentView: View | null = null
	private appRoot: HTMLElement
	private loadingScreen: LoadingScreen

	constructor(props: ViewManagerProps) {
		this.appRoot = props.appRoot
		this.loadingScreen = props.loadingScreen
	}

	async init<V extends ViewConstructor<{ appRoot: HTMLElement }>>(
		props: OpenViewProps<V>
	) {
		await this.openView(props)
	}

	async openView<V extends ViewConstructor<{ appRoot: HTMLElement }>>(
		props: OpenViewProps<V>
	) {
		const { viewClass, viewProps } = props
		await this.currentView?.unmount()
		const newView = new viewClass({
			...viewProps,
			appRoot: this.appRoot,
		})
		this.currentView = newView
		if (newView.needLoadingScreenOnMount) {
			this.loadingScreen.show()
		}
		await newView.mount()
		newView.isMounted = true
		this.loadingScreen.hide()
	}
}
