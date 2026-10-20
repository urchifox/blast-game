import { View } from "./view"

export const FAKE_VIEW_NAME = "fake-view"
export const SLOW_FAKE_VIEW_NAME = "slow-fake-view"

type FakeViewProps = {
	appRoot: HTMLElement
}

export type MountGate = {
	finish: () => void
	markStarted: () => void
	started: Promise<void>
	mounted: Promise<void>
}

export class FakeView extends View {
	constructor(props: FakeViewProps) {
		super({ name: FAKE_VIEW_NAME, appRoot: props.appRoot })
	}
}

export class SlowFakeView extends View {
	override readonly needLoadingScreenOnMount = true
	private readonly mountGate: MountGate

	constructor(props: FakeViewProps & { mountGate?: MountGate }) {
		super({ name: SLOW_FAKE_VIEW_NAME, appRoot: props.appRoot })
		if (props.mountGate === undefined) {
			throw new Error("SlowFakeView requires a mountGate")
		}
		this.mountGate = props.mountGate
	}

	override async mount() {
		const parentMount = super.mount()
		this.mountGate.markStarted()
		await parentMount
		await this.mountGate.mounted
	}
}

export function createMountGate(): MountGate {
	let finishMounting: (() => void) | undefined
	let markStarted: (() => void) | undefined
	const mounted = new Promise<void>((resolve) => {
		finishMounting = resolve
	})
	const started = new Promise<void>((resolve) => {
		markStarted = resolve
	})

	return {
		finish() {
			if (finishMounting === undefined) {
				return
			}
			finishMounting()
		},
		markStarted() {
			if (markStarted === undefined) {
				return
			}
			markStarted()
		},
		started,
		mounted,
	}
}

export function installFakeViewTemplates() {
	installFakeViewTemplate(FAKE_VIEW_NAME)
	installFakeViewTemplate(SLOW_FAKE_VIEW_NAME)
}

function installFakeViewTemplate(name: string) {
	const template = document.createElement("template")
	template.id = name
	const root = document.createElement("section")
	root.id = `${name}-root`
	template.content.appendChild(root)
	document.body.appendChild(template)
}
