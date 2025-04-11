import { IGameBoard, IGameBoardCoordinate } from "./board";
import { IGamePlayer } from "./player";

export type IGameState = 'start'|'running'|'over'|'draw'

export interface IGameContext {
  currentPlayer: IGamePlayer
  boardMap: IGameBoard
  gameState: IGameState
  winnerPlayer?: IGamePlayer
  winChainCoors?: IGameBoardCoordinate[]
  doTurn: (coors: IGameBoardCoordinate) => void
  doReset: () => void
}