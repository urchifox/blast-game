import { loadingScreen } from "./loadingScreen"
import { View, ViewConstructor } from "./view"

class ViewManager {
	private currentView: View | null = null

	async init(view: ViewConstructor) {
		await this.openView(view)
	}

	async openView(view: ViewConstructor) {
		this.currentView?.unmount()
		const newView = new view()
		this.currentView = newView
		if (newView.needLoadingScreenOnMount) {
			loadingScreen.show()
		}
		await newView.mount()
		newView.isMounted = true
		loadingScreen.hide()
	}
}

export const viewManager = new ViewManager()
