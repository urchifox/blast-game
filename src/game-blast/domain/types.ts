import { BOOSTER_NAMES } from "./config"

export type BoosterName = (typeof BOOSTER_NAMES)[number]

export enum GameCompletionStatus {
	WIN = "win",
	LOSS = "loss",
	IN_PROGRESS = "in_progress",
}
