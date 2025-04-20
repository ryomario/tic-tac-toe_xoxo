import React, { createContext, useMemo, useRef } from "react";
import { IGameContext } from "../types";
import { DEFAULT_CONTEXT_VALUE } from "../factory";
import { Game } from "../utils/game";

const GameContext = createContext<IGameContext>(DEFAULT_CONTEXT_VALUE)

export function GameProvider({ children }: React.PropsWithChildren) {
  const gameRef = useRef<Game>(new Game())

  const currentPlayer = gameRef.current.useCurrentPlayer()
  const boardMap = gameRef.current.useBoard()
  const options = gameRef.current.useOptions()
  const gameBoardState = gameRef.current.useGameBoardState()
  const willBeRemovedFromBoard = gameRef.current.useCellWillBeRemoved()
  const isAITurnLoading = gameRef.current.useIsAITurn()


  const value = useMemo<IGameContext>(() => ({
    currentPlayer,
    boardMap,
    gameState: gameBoardState.type,
    winnerPlayer: gameBoardState.winner,
    winChainCoors: gameBoardState.winCoors,
    doTurn: gameRef.current.doTurn.bind(gameRef.current),
    newGame: gameRef.current.newGame.bind(gameRef.current),
    nextGame: gameRef.current.nextGame.bind(gameRef.current),
    startGame: gameRef.current.startGame.bind(gameRef.current),
    options,
    willBeRemovedFromBoard,
    isAITurnLoading,
  }),[gameRef.current.currentPlayer, boardMap, gameBoardState, options, willBeRemovedFromBoard, isAITurnLoading])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGameContext() {
  return React.useContext(GameContext)
}