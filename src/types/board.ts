import { IGamePlayer } from "./player";

export type IGameBoard = Array<Array<IGamePlayer|null>>

export type IGameBoardCoordinate = [
  x: number,
  y: number,
]

export type IGameBoardState = {
  type: 'over'|'running'|'draw'
  winner: IGamePlayer|null
  winCoors: null|IGameBoardCoordinate[]
}

export type IGameBoardTurn = {
  coordinate: IGameBoardCoordinate
  player: IGamePlayer
}

export type IGameBoardChain = '\\' | '/' | '|' | '-'