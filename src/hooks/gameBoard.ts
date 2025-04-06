import { useCallback, useState } from "react"
import { generateBoard, nextBoardState } from "../factory/gameBoard"
import { IGameBoard, IGameBoardCoordinate, IGamePlayer } from "../types"

type Params = {
  size: number
}

export function useGameBoard({
  size = 3,
}: Params) {
  const [board, setBoard] = useState<IGameBoard>(generateBoard(size))

  const setBoardCell = (coordinate :IGameBoardCoordinate, player: IGamePlayer) => {
    setBoard(oldBoard => {
      return nextBoardState(oldBoard, { coordinate, player })
    })
  }

  const getPlayerInBoard = useCallback((coordinate: IGameBoardCoordinate) => {
    const [col, row] = coordinate

    return board[row][col]
  },[board])

  const resetBoard = () => {
    setBoard(generateBoard(size))
  }

  return {
    board,
    setBoardCell,
    getPlayerInBoard,
    resetBoard,
  }
}