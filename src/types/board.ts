import { GameState } from "./game";
import { IGamePlayer } from "./player";

export type IGameBoard = Array<Array<IGamePlayer|null>>

export type IGameBoardCoordinate = [
  x: number,
  y: number,
]

export type IGameBoardState = {
  type: GameState
  winner?: IGamePlayer
  winCoors?: IGameBoardCoordinate[]
}

export type IGameBoardTurn = {
  coordinate: IGameBoardCoordinate
  player: IGamePlayer
}

export type IGameBoardChain = '\\' | '/' | '|' | '-'