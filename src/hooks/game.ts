import { useCallback, useEffect, useState } from "react";
import { IGameBoardCoordinate, IGameBoardState } from "../types";
import { useGameBoard } from "./gameBoard";
import { useGamePlayerTurn } from "./gamePlayerTurn";
import { checkGameTurn, nextBoardState } from "../factory";

export function useGame() {
  const { currentPlayer, nextPlayer, setNextPlayer, resetTurn } = useGamePlayerTurn()
  const { board, setBoardCell, getPlayerInBoard, resetBoard } = useGameBoard({ size: 7 })
  const [gameState, setGameState] = useState<IGameBoardState>({
    type: 'running',
    winCoors: null,
    winner: null,
  })

  const nextTurn = useCallback((coordinate: IGameBoardCoordinate) => {
    if(getPlayerInBoard(coordinate) == null) {
      const gameState = checkGameTurn(coordinate, nextBoardState(board, { coordinate, player: nextPlayer }))
      setBoardCell(coordinate, nextPlayer)
      setGameState(gameState)
      setNextPlayer()
    }
  },[setBoardCell, nextPlayer])

  const resetGame = () => {
    resetBoard()
    resetTurn()
  }

  useEffect(() => {
    if(gameState.type == 'over') {
      alert(`Winner : ${gameState.winner}`)
      resetGame()
    } else if(gameState.type == 'draw') {
      alert('Game Draw')
      resetGame()
    }
  },[gameState])
  return {
    board,
    nextTurn,
    currentPlayer,
    nextPlayer,
  }
}