import { View, ViewConstructor } from "./view"

class ViewManager {
	private currentView: View | null = null

	async init(view: ViewConstructor) {
		await this.openView(view)
	}

	async openView(view: ViewConstructor) {
		this.currentView?.unmount()
		const newView = new view()
		await newView.mount()
		this.currentView = newView
	}
}

export const viewManager = new ViewManager()
