import { GameDifficulty, GameMode, GameState, IGameContext, IGamePlayerStepHistory } from "../types";
import { generateBoard } from "./gameBoard";

export const DEFAULT_BOARD_SIZE = 3
export const GAME_MAX_STEP_HISTORY = DEFAULT_BOARD_SIZE

export const DEFAULT_CONTEXT_VALUE: IGameContext = {
  currentPlayer: 'o',
  boardMap: generateBoard(3,null),
  gameState: GameState.start,
  doTurn: () => {},
  nextGame: () => {},
  newGame: () => {},
  startGame: () => {},
  options: {
    mode: GameMode.normal,
    isVsAI: false,
    difficulty: GameDifficulty.medium,
    maxStepHistory: GAME_MAX_STEP_HISTORY,
    boardSize: DEFAULT_BOARD_SIZE,
  },
}

export const GAME_MODES: GameMode[] = [
  GameMode.normal,
  GameMode.endless,
]

export const GAME_DIFFICULTIES: GameDifficulty[] = [
  GameDifficulty.easy,
  GameDifficulty.medium,
  GameDifficulty.hard,
]

export const GAME_EMPTY_PLAYER_STEP_HISTORY: IGamePlayerStepHistory = {
  x: [],
  o: [],
}