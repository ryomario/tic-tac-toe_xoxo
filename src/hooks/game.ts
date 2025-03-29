import { useCallback } from "react";
import { IGameBoardCoordinate } from "../types";
import { useGameBoard } from "./gameBoard";
import { useGamePlayerTurn } from "./gamePlayerTurn";

export function useGame() {
  const { currentPlayer, nextPlayer, setNextPlayer } = useGamePlayerTurn()
  const { board, setBoardCell, getPlayerInBoard } = useGameBoard()

  const nextTurn = useCallback((coordinate: IGameBoardCoordinate) => {
    if(getPlayerInBoard(coordinate) == null) {
      setBoardCell(coordinate, nextPlayer)
      setNextPlayer()
    }
  },[setBoardCell, nextPlayer])

  return {
    board,
    nextTurn,
    currentPlayer,
    nextPlayer,
  }
}