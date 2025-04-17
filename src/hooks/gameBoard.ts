import { useCallback, useState } from "react"
import { DEFAULT_BOARD_SIZE, generateBoard, nextBoardState } from "../factory"
import { IGameBoard, IGameBoardCoordinate, IGamePlayer, IGamePlayerStepHistory } from "../types"

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

  const applyFromPlayerStepHistory = useCallback((playerStepHistory: IGamePlayerStepHistory) => {
    let newBoard = generateBoard(size)
    for (const key in playerStepHistory) {
      const player = key as IGamePlayer
      playerStepHistory[player].forEach(coordinate => {
        newBoard = nextBoardState(newBoard, { coordinate, player })
      })
    }
    setBoard(newBoard)
  },[setBoard])

  return {
    board,
    setBoardCell,
    getPlayerInBoard,
    resetBoard,
    applyFromPlayerStepHistory,
  }
}