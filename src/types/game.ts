import { IGameBoard, IGameBoardCoordinate } from "./board";
import { IGamePlayer } from "./player";

export enum GameState {
  start = 'start',
  running = 'running',
  over = 'over',
  draw = 'draw',
}

export interface IGameContext {
  currentPlayer: IGamePlayer
  boardMap: IGameBoard
  gameState: GameState
  winnerPlayer?: IGamePlayer
  winChainCoors?: IGameBoardCoordinate[]
  doTurn: (coors: IGameBoardCoordinate) => void
  nextGame: () => void
  newGame: () => void
  startGame: (options: any) => void
  options: IGameOptions
  resetOptions: () => void
}

export enum GameMode {
  normal = 'normal',
  endless = 'endless',
}

export enum GameDifficulty {
  easy = 'easy',
  medium = 'medium',
  hard = 'hard',
}

export interface IGameOptions {
  mode: GameMode
  isVsAI?: boolean
  difficulty: GameDifficulty
}