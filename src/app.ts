import "./assets/style/base.css"

import { GameView } from "./game-blast/view/gameView"
import { ViewManager } from "./view/viewManager"
import { LoadingScreen } from "./view/loadingScreen"

const loadingScreenRoot =
	document.getElementById("loading-screen") ?? document.body
const loadingScreen = new LoadingScreen({ root: loadingScreenRoot })

const appRoot = document.getElementById("app") ?? document.body
const viewManager = new ViewManager({
	appRoot,
	loadingScreen,
})

viewManager.init({ viewClass: GameView, viewProps: {} })
