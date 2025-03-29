import { IGamePlayer } from "./player";

export type IGameBoard = Array<Array<IGamePlayer|null>>

export type IGameBoardCoordinate = [
  x: number,
  y: number,
]