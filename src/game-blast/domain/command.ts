import { Tile, TileKind, TilePosition } from "./tile"

export type Command<T extends CommandName = CommandName> = {
	[K in T]: {
		name: K
		payload: CommandPayload[K]
	}
}[T]

export enum CommandName {
	ADD = "add",
	REMOVE = "remove",
	SWAP = "swap",
}

export type CommandPayload = {
	[CommandName.ADD]: {
		kind: TileKind
		position: TilePosition
	}
	[CommandName.REMOVE]: {
		tiles: Set<Tile>
		removingFromPosition: TilePosition
	}
	[CommandName.SWAP]: [Tile, Tile]
}
