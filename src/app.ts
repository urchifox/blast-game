import "./assets/style/base.css"
import "./assets/style/booster.css"
import "./assets/style/boosters-container.css"
import "./assets/style/canvas-container.css"
import "./assets/style/movements-counter.css"
import "./assets/style/points-counter.css"
import "./assets/style/progress-block.css"
import "./assets/style/view.css"

import { GameView } from "./game-view/gameView"
import { ViewManager } from "./view/viewManager"
import { LoadingScreen } from "./view/loadingScreen"

const loadingScreenRoot = document.getElementById("loading-screen") ?? document.body
const loadingScreen = new LoadingScreen({ root: loadingScreenRoot })

const appRoot = document.getElementById("app") ?? document.body
const viewManager = new ViewManager({
	appRoot,
	loadingScreen,
})

viewManager.init({ viewClass: GameView, viewProps: {} })
