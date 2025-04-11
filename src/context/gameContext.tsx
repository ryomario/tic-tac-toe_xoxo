import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { IGameBoardCoordinate, IGameContext, IGamePlayer, IGameState } from "../types";
import { checkGameTurn, DEFAULT_BOARD_SIZE, DEFAULT_CONTEXT_VALUE, nextBoardState, randomPlayer } from "../factory";
import { useGameBoard, useGamePlayerTurn } from "../hooks";

const GameContext = createContext<IGameContext>(DEFAULT_CONTEXT_VALUE)

export function GameProvider({ children }: React.PropsWithChildren) {
  const { currentPlayer, resetTurn, setNextPlayer } = useGamePlayerTurn({ initialPlayer: randomPlayer() })
  const { board: boardMap, setBoardCell, getPlayerInBoard, resetBoard } = useGameBoard({ size: DEFAULT_BOARD_SIZE })
  const [gameState, setGameState] = useState<IGameState>(DEFAULT_CONTEXT_VALUE.gameState)
  const [winState, setWinState] = useState<{ winnerPlayer?: IGamePlayer, winChainCoors?: IGameBoardCoordinate[] }>({})

  const doTurn = useCallback((coordinate: IGameBoardCoordinate) => {
    if(getPlayerInBoard(coordinate) == null) {
      const boardState = checkGameTurn(coordinate, nextBoardState(boardMap, { coordinate, player: currentPlayer }))
      setBoardCell(coordinate, currentPlayer)
      setGameState(boardState.type)
      setWinState({
        winnerPlayer: boardState.winner,
        winChainCoors: boardState.winCoors,
      })
      setNextPlayer()
    }
  },[setBoardCell, currentPlayer])

  const resetGame = useCallback(() => {
    resetBoard()
    resetTurn()
  },[resetBoard,resetTurn])

  useEffect(() => {
    if(gameState == 'over') {
      alert(`Winner : ${winState.winnerPlayer}`)
      resetGame()
    } else if(gameState == 'draw') {
      alert('Game Draw')
      resetGame()
    }
  },[gameState])

  const value = useMemo<IGameContext>(() => ({
    currentPlayer,
    boardMap,
    gameState,
    winnerPlayer: winState.winnerPlayer,
    winChainCoors: winState.winChainCoors,
    doTurn,
    doReset: resetGame,
  }),[currentPlayer, boardMap, gameState, winState, doTurn, resetGame])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGameContext() {
  return React.useContext(GameContext)
}