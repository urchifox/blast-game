import { BoosterName } from "../domain/types"

export type BoosterUIContract = {
	updateBoosterCounter: (currentValue: number) => void
	toggleBoosterButtonActive: (active: boolean) => void
}

export type BoosterUIMap = Record<BoosterName, BoosterUIContract>
