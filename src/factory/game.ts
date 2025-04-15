import { GameDifficulty, GameMode, GameState, IGameContext } from "../types";
import { generateBoard } from "./gameBoard";

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
  },
  resetOptions: () => {},
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