import { View, ViewConstructor } from "./view"

class ViewManager {
	private currentView: View | null = null

	init(view: ViewConstructor) {
		this.openView(view)
	}

	openView(view: ViewConstructor) {
		this.currentView?.unmount()
		const newView = new view()
        newView.mount()
		this.currentView = newView
	}
}

export const viewManager = new ViewManager()
