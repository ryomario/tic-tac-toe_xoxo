import React, { createContext, useMemo, useRef } from "react";
import { IGameContext } from "../types";
import { DEFAULT_CONTEXT_VALUE } from "../factory";
import { Game } from "../utils/game";

const GameContext = createContext<IGameContext>(DEFAULT_CONTEXT_VALUE)

export function GameProvider({ children }: React.PropsWithChildren) {
  const gameRef = useRef<Game>(new Game())
  const {
    currentPlayer,
    boardMap,
    options,
    gameState : gameBoardState,
    cellWillBeRemoved: willBeRemovedFromBoard,
    isAITurn: isAITurnLoading,
  } = gameRef.current.useGameState()


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
  }),[currentPlayer, boardMap, gameBoardState, options, willBeRemovedFromBoard, isAITurnLoading])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGameContext() {
  return React.useContext(GameContext)
}