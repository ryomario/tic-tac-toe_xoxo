import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { IGameBoardCoordinate, IGameContext, IGameOptions, IGamePlayer, GameState, IGameStepHistory, IGamePlayerStepHistory, GameMode } from "../types";
import { checkGamePlayerStep, checkGameTurn, DEFAULT_BOARD_SIZE, DEFAULT_CONTEXT_VALUE, GAME_EMPTY_PLAYER_STEP_HISTORY, GAME_MAX_STEP_HISTORY, nextBoardState, randomPlayer } from "../factory";
import { useGameBoard, useGamePlayerTurn } from "../hooks";

const GameContext = createContext<IGameContext>(DEFAULT_CONTEXT_VALUE)

export function GameProvider({ children }: React.PropsWithChildren) {
  const { currentPlayer, resetTurn, setNextPlayer } = useGamePlayerTurn({ initialPlayer: randomPlayer() })
  const { board: boardMap, applyFromPlayerStepHistory, getPlayerInBoard, resetBoard } = useGameBoard({ size: DEFAULT_BOARD_SIZE })
  const [gameState, setGameState] = useState<GameState>(DEFAULT_CONTEXT_VALUE.gameState)
  const [winState, setWinState] = useState<{ winnerPlayer?: IGamePlayer, winChainCoors?: IGameBoardCoordinate[] }>({})
  const [options, setOptions] = useState<IGameOptions>(DEFAULT_CONTEXT_VALUE.options)
  const [playerStepHistory, setPlayerStepHistory] = useState<IGamePlayerStepHistory>(GAME_EMPTY_PLAYER_STEP_HISTORY)
  const resetGameState = useCallback(() => setGameState(DEFAULT_CONTEXT_VALUE.gameState),[setGameState])
  const resetWinState = useCallback(() => setWinState({}),[setWinState])
  const resetOptions = useCallback(() => setOptions(DEFAULT_CONTEXT_VALUE.options),[setOptions])
  const resetPlayerStepHistory = useCallback(() => setPlayerStepHistory(GAME_EMPTY_PLAYER_STEP_HISTORY),[setPlayerStepHistory])

  useEffect(() => {
    applyFromPlayerStepHistory(playerStepHistory)
  },[playerStepHistory, applyFromPlayerStepHistory])
  useEffect(() => {
    const boardState = checkGamePlayerStep(playerStepHistory, boardMap)
    setGameState(boardState.type)
    setWinState({
      winnerPlayer: boardState.winner,
      winChainCoors: boardState.winCoors,
    })
  },[playerStepHistory, boardMap])

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
    if(getPlayerInBoard(coordinate) == null) {
      // const boardState = checkGameTurn(coordinate, nextBoardState(boardMap, { coordinate, player: currentPlayer }))
      pushStepHistory(currentPlayer, coordinate)
      // setGameState(boardState.type)
      // setWinState({
      //   winnerPlayer: boardState.winner,
      //   winChainCoors: boardState.winCoors,
      // })
      setNextPlayer()
    }
  },[boardMap, currentPlayer, pushStepHistory])

  const nextGame = useCallback(() => {
    resetBoard()
    resetPlayerStepHistory()
    resetTurn()
    setGameState(GameState.running)
    resetWinState()
  },[resetBoard,resetTurn,setGameState,resetWinState])

  const newGame = useCallback(() => {
    // @TODO reset score and more
    nextGame()
    resetGameState()
  },[nextGame,resetGameState])

  const startGame = useCallback((options: IGameOptions) => {
    setOptions(options)
    setGameState(GameState.running)
  },[])

  useEffect(() => {
    console.log('ss',gameState)
    if(gameState == GameState.over) {
      alert(`Winner : ${winState.winnerPlayer}`)
      newGame()
    } else if(gameState == GameState.draw) {
      alert('Game Draw')
      nextGame()
    }
  },[gameState])

  const value = useMemo<IGameContext>(() => ({
    currentPlayer,
    boardMap,
    gameState,
    winnerPlayer: winState.winnerPlayer,
    winChainCoors: winState.winChainCoors,
    doTurn,
    newGame,
    nextGame,
    startGame,
    options,
    resetOptions,
  }),[currentPlayer, boardMap, gameState, winState, doTurn, nextGame, newGame, startGame, options, resetOptions])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGameContext() {
  return React.useContext(GameContext)
}