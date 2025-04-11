import { IGameContext } from "../types";
import { generateBoard } from "./gameBoard";

export const DEFAULT_CONTEXT_VALUE: IGameContext = {
  currentPlayer: 'o',
  boardMap: generateBoard(3,null),
  gameState: "start",
  doTurn: () => {},
  doReset: () => {},
}
