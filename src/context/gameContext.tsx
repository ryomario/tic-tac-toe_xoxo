import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { IGameBoardCoordinate, IGameContext, IGameOptions, IGamePlayer, GameState, IGamePlayerStepHistory, GameMode, IGameBoard, IGameBoardState } from "../types";
import { checkGameBoardState, DEFAULT_BOARD_SIZE, DEFAULT_CONTEXT_VALUE, GAME_EMPTY_PLAYER_STEP_HISTORY, GAME_MAX_STEP_HISTORY, getBoardFromStepHistory, getNextPlayer, getPlayerInBoard, randomPlayer } from "../factory";
import { aiTurn } from "../utils/ai";

const GameContext = createContext<IGameContext>(DEFAULT_CONTEXT_VALUE)

export function GameProvider({ children }: React.PropsWithChildren) {
  const [currentPlayer, setCurrentPlayer] = useState<IGamePlayer>(randomPlayer)
  const setNextPlayer = useCallback(() => setCurrentPlayer(getNextPlayer(currentPlayer)),[currentPlayer,setCurrentPlayer])
  const resetTurn = useCallback(() => setCurrentPlayer(randomPlayer()),[])
  const [gameBoardState, setGameBoardState] = useState<IGameBoardState>({
    type: DEFAULT_CONTEXT_VALUE.gameState,
  })
  const [options, setOptions] = useState<IGameOptions>(DEFAULT_CONTEXT_VALUE.options)
  const [playerStepHistory, setPlayerStepHistory] = useState<IGamePlayerStepHistory>(GAME_EMPTY_PLAYER_STEP_HISTORY)
  const boardMap = useMemo<IGameBoard>(() => getBoardFromStepHistory(playerStepHistory, 3),[playerStepHistory])
  const willBeRemovedFromBoard = useMemo<IGameBoardCoordinate|undefined>(() => {
    if(playerStepHistory[currentPlayer].length < GAME_MAX_STEP_HISTORY || options.mode != GameMode.endless) return;
    return playerStepHistory[currentPlayer][0]
  },[playerStepHistory,currentPlayer,options.mode])
  const [isAITurnLoading, setIsAITurnLoading] = useState(false)
  const resetGameBoardState = useCallback(() => setGameBoardState({ type: DEFAULT_CONTEXT_VALUE.gameState }),[setGameBoardState])
  const resetOptions = useCallback(() => setOptions(DEFAULT_CONTEXT_VALUE.options),[setOptions])
  const resetPlayerStepHistory = useCallback(() => setPlayerStepHistory(GAME_EMPTY_PLAYER_STEP_HISTORY),[setPlayerStepHistory])

  useEffect(() => {
    if(gameBoardState.type != GameState.running) return;
    const boardState = checkGameBoardState(boardMap)
    setGameBoardState(boardState)
  },[playerStepHistory])

  useEffect(() => {
    if(gameBoardState.type != GameState.running || !options.isVsAI)return;

    if(currentPlayer == options.aiPlayer) {
      setIsAITurnLoading(true)
      aiTurn({
        board: boardMap,
        currentPlayer: currentPlayer,
      }, options.aiPlayer).then((coordinate) => {
        doTurn(coordinate)
      }).finally(() => {
        setIsAITurnLoading(false)
      })
    }
  },[currentPlayer, options.aiPlayer, options.isVsAI, gameBoardState.type])

  const pushStepHistory = useCallback((player: IGamePlayer, coordinate: IGameBoardCoordinate) => setPlayerStepHistory(oldHistory => {
    const newHistory: IGamePlayerStepHistory = {
      x: [ ...oldHistory.x ],
      o: [ ...oldHistory.o ],
    }
    const playerHis = newHistory[player]
    playerHis.push(coordinate)
    if(options.mode == GameMode.endless && playerHis.length > GAME_MAX_STEP_HISTORY) {
      playerHis.shift()
    }
    newHistory[player] = playerHis

    return newHistory
  }),[setPlayerStepHistory, options.mode])

  const doTurn = useCallback((coordinate: IGameBoardCoordinate) => {
    if(getPlayerInBoard(boardMap,coordinate) == null) {
      pushStepHistory(currentPlayer, coordinate)
      setNextPlayer()
    }
  },[boardMap, currentPlayer, pushStepHistory])

  const nextGame = useCallback(() => {
    resetPlayerStepHistory()
    resetTurn()
    setGameBoardState({ type: GameState.running })
  },[resetPlayerStepHistory,resetTurn,setGameBoardState])

  const newGame = useCallback(() => {
    // @TODO reset score and more
    resetPlayerStepHistory()
    resetTurn()
    resetGameBoardState()
  },[resetPlayerStepHistory,resetTurn,resetGameBoardState])

  const startGame = useCallback((options: IGameOptions) => {
    if(options.isVsAI) {
      options.aiPlayer = randomPlayer()
    }
    setOptions(options)
    setGameBoardState({ type: GameState.running })
  },[])

  const value = useMemo<IGameContext>(() => ({
    currentPlayer,
    boardMap,
    gameState: gameBoardState.type,
    winnerPlayer: gameBoardState.winner,
    winChainCoors: gameBoardState.winCoors,
    doTurn,
    newGame,
    nextGame,
    startGame,
    options,
    resetOptions,
    willBeRemovedFromBoard,
    isAITurnLoading,
  }),[currentPlayer, boardMap, gameBoardState, doTurn, nextGame, newGame, startGame, options, resetOptions, willBeRemovedFromBoard, isAITurnLoading])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGameContext() {
  return React.useContext(GameContext)
}