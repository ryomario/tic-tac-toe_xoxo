import { useCallback, useState } from "react"
import { EMPTY_GAME_BOARD } from "../factory/gameBoard"
import { IGameBoard, IGameBoardCoordinate, IGamePlayer } from "../types"

export function useGameBoard() {
  const [board, setBoard] = useState<IGameBoard>(EMPTY_GAME_BOARD)

  const setBoardCell = (coordinate :IGameBoardCoordinate, player: IGamePlayer|null) => {
    const [col, row] = coordinate
    
    setBoard(oldBoard => {
      const newBoard: IGameBoard = [
        ...oldBoard.map(row => ([...row])),
      ]
      newBoard[row][col] = player

      return newBoard
    })
  }

  const getPlayerInBoard = useCallback((coordinate: IGameBoardCoordinate) => {
    const [col, row] = coordinate

    return board[row][col]
  },[board])

  return {
    board,
    setBoardCell,
    getPlayerInBoard,
  }
}