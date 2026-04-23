import "./assets/style/base.css"
import "./assets/style/view.css"

import { GameView } from "./game-view/gameBlastView"
import { viewManager } from "./view/viewManager"

const initialView = GameView
viewManager.init(initialView)
