import "./assets/style/base.css"
import "./assets/style/booster.css"
import "./assets/style/boosters-container.css"
import "./assets/style/canvas-container.css"
import "./assets/style/movements-counter.css"
import "./assets/style/points-counter.css"
import "./assets/style/progress-block.css"
import "./assets/style/view.css"

import { GameView } from "./game-view/gameBlastView"
import { viewManager } from "./view/viewManager"

const initialView = GameView
viewManager.init(initialView)
