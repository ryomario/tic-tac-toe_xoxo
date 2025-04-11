import { useCallback, useState } from "react"
import { DEFAULT_BOARD_SIZE, generateBoard, nextBoardState } from "../factory"
import { IGameBoard, IGameBoardCoordinate, IGamePlayer } from "../types"

type Params = {
  size: number
}

export function useGameBoard({
  size = DEFAULT_BOARD_SIZE,
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