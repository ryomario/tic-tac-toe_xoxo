import { useCallback, useEffect, useState } from "react";
import { checkGameBoardState, DEFAULT_CONTEXT_VALUE, GAME_EMPTY_PLAYER_STEP_HISTORY, getBoardFromStepHistory, getNextPlayer, getPlayerInBoard, pushStepHistory, randomPlayer } from "../factory";
import { GameDifficulty, GameMode, GameState, IGameBoard, IGameBoardCoordinate, IGameBoardState, IGameContext, IGameOptions, IGamePlayer, IGamePlayerStepHistory } from "../types";
import { aiTurn } from "./ai";

type State = {
  boardMap: IGameBoard
  currentPlayer: IGamePlayer
  options: IGameOptions
  gameState: IGameBoardState
  cellWillBeRemoved?: IGameBoardCoordinate
  isAITurn: boolean
}

export class Game {
  private _options: IGameOptions = DEFAULT_CONTEXT_VALUE.options;
  private _currentPlayer: IGamePlayer = 'o';
  private _gameBoardState: IGameBoardState = { type: DEFAULT_CONTEXT_VALUE.gameState };

  private _playerStepHistory: IGamePlayerStepHistory = GAME_EMPTY_PLAYER_STEP_HISTORY;

  private _aiTurn: boolean = false;

  _changeListeners: { [key in string]:((value: any) => void)[] } = {};
  constructor() {

    this.reset()

  }
  reset() {
    this._changeListeners = {}
    this.options = DEFAULT_CONTEXT_VALUE.options
    this.currentPlayer = randomPlayer()
    this.playerStepHistory = GAME_EMPTY_PLAYER_STEP_HISTORY
  }

  get maxAIMinimaxDepth() {
    if(this.options.difficulty == GameDifficulty.hard) return 10
    if(this.options.difficulty == GameDifficulty.medium) return 5
    return 1
  }

  set currentPlayer(player: IGamePlayer) {
    this._currentPlayer = player
    this.triggerChange('currentPlayer', player)
  }
  get currentPlayer() {
    return this._currentPlayer
  }

  set gameBoardState(state: IGameBoardState) {
    this._gameBoardState = state
    this.triggerChange('gameBoardState',state)
  }
  get gameBoardState() {
    return this._gameBoardState
  }

  set playerStepHistory(state: IGamePlayerStepHistory) {
    this._playerStepHistory = state
    this.triggerChange('playerStepHistory',state)
    this.triggerChange('board',this.board)
    this.triggerChange('cellWillBeRemoved',this.cellWillBeRemoved)
  }
  get playerStepHistory() {
    return this._playerStepHistory
  }

  get board() {
    return getBoardFromStepHistory(this.playerStepHistory, this.options.boardSize)
  }
  get cellWillBeRemoved() {
    if(this.playerStepHistory[this.currentPlayer].length < this.options.maxStepHistory || this.options.mode != GameMode.endless) return;
    return this.playerStepHistory[this.currentPlayer][0]
  }

  set options(options: IGameOptions) {
    this._options = options
    this.triggerChange('options',options)
  }
  get options() {
    return this._options
  }

  set isAITurn(isTrue: boolean) {
    this._aiTurn = isTrue
    this.triggerChange('isAITurn',isTrue)
  }
  get isAITurn() {
    return this._aiTurn
  }

  addChangeListener<T>(attr: string, callback: (value: T) => void) {
    if(typeof callback != 'function') return;
    if(!this._changeListeners[attr]) this._changeListeners[attr] = [];
    if(this._changeListeners[attr].includes(callback)) return;
    this._changeListeners[attr].push(callback)
  }

  removeChangeListener<T>(attr: string, callback: (value: T) => void) {
    if(typeof callback != 'function') return;
    if(!this._changeListeners[attr]) return;
    const idx = this._changeListeners[attr].findIndex(c => c === callback)
    if(idx == -1) return;
    this._changeListeners[attr].splice(idx,1)
  }
  triggerChange<T>(attr: string, newValue: T) {
    if(!this._changeListeners[attr] || this._changeListeners[attr].length == 0) return;
    for (const callback of this._changeListeners[attr]) {
      if(typeof callback == 'function') callback.call(this, newValue)
    }
  }

  setNextPlayer() {
    this.currentPlayer = getNextPlayer(this.currentPlayer)
  }

  pushStepHistory(player: IGamePlayer, coordinate: IGameBoardCoordinate) {
    const newHistory = pushStepHistory(this.playerStepHistory, player, coordinate, this.options)

    this.playerStepHistory = newHistory

    this.gameBoardState = checkGameBoardState(this.board)
  }
  
  doTurn(coordinate: IGameBoardCoordinate) {
    if(getPlayerInBoard(this.board,coordinate) == null) {
      const currentPlayer = this.currentPlayer
      this.setNextPlayer()
      this.pushStepHistory(currentPlayer, coordinate)
      if(this.gameBoardState.type == GameState.running) {        
        this.doAITurn()
      }
    }
  }
  doAITurn() {
    // check is vs ai
    if(!this.options.isVsAI) return;
    // check is ai turn
    if(this.currentPlayer != this.options.aiPlayer) return;

    this.isAITurn = true
    const gameOptions = this.options
    const currentPlayer = this.currentPlayer
    const stepHistory = this.playerStepHistory
    aiTurn({
      currentPlayer,
      stepHistory,
      gameOptions,
    }, this.options.aiPlayer, this.maxAIMinimaxDepth).then(coordinate => {
      this.doTurn(coordinate)
    }).finally(() => {
      this.isAITurn = false
    })
  }

  nextGame() {
    this.playerStepHistory = GAME_EMPTY_PLAYER_STEP_HISTORY
    this.currentPlayer = randomPlayer()
    this.gameBoardState = { type: GameState.running }
  }
  newGame() {
    this.playerStepHistory = GAME_EMPTY_PLAYER_STEP_HISTORY
    this.currentPlayer = randomPlayer()
    this.gameBoardState = { type: GameState.start }
  }
  startGame(options: IGameOptions) {
    if(options.isVsAI) {
      options.aiPlayer = randomPlayer()
    }
    const olOptions = this.options
    this.options = {
      ...olOptions,
      ...options,
    }
    this.gameBoardState = { type: GameState.running }

    if(this.options.isVsAI) {
      if(this.options.aiPlayer == this.currentPlayer) {
        this.doAITurn()
      }
    }
  }

  // hooks
  useGameState() {
    const game = this;
    const [state, _setState] = useState<State>({
      boardMap: game.board,
      currentPlayer: game.currentPlayer,
      options: game.options,
      gameState: game.gameBoardState,
      cellWillBeRemoved: game.cellWillBeRemoved,
      isAITurn: game.isAITurn,
    })

    const setCurrentPlayer = useCallback((value: IGamePlayer) => {
      _setState(oldState => {
        const newState = {
          ...oldState,
          currentPlayer: value,
        }
        return newState;
      })
    },[_setState])

    const setBoard = useCallback((value: IGameBoard) => {
      _setState(oldState => {
        const newState = {
          ...oldState,
          boardMap: value,
        }
        return newState;
      })
    },[_setState])

    const setOptions = useCallback((value: IGameOptions) => {
      _setState(oldState => {
        const newState = {
          ...oldState,
          options: value,
        }
        return newState;
      })
    },[_setState])

    const setBoardState = useCallback((value: IGameBoardState) => {
      _setState(oldState => {
        const newState = {
          ...oldState,
          gameState: value,
        }
        return newState;
      })
    },[_setState])

    const setCellWillBeRemoved = useCallback((value: IGameBoardCoordinate) => {
      _setState(oldState => {
        const newState = {
          ...oldState,
          cellWillBeRemoved: value,
        }
        return newState;
      })
    },[_setState])

    const setIsAITurn = useCallback((value: boolean) => {
      _setState(oldState => {
        const newState = {
          ...oldState,
          isAITurn: value,
        }
        return newState;
      })
    },[_setState])

    useEffect(() => {
      this.addChangeListener<IGamePlayer>('currentPlayer', setCurrentPlayer)
      this.addChangeListener<IGameBoard>('board', setBoard)
      this.addChangeListener<IGameOptions>('options', setOptions)
      this.addChangeListener<IGameBoardState>('gameBoardState', setBoardState)
      this.addChangeListener<IGameBoardCoordinate>('cellWillBeRemoved', setCellWillBeRemoved)
      this.addChangeListener<boolean>('isAITurn', setIsAITurn)
      return () => {
        this.removeChangeListener<IGamePlayer>('currentPlayer', setCurrentPlayer)
        this.removeChangeListener<IGameBoard>('board', setBoard)
        this.removeChangeListener<IGameOptions>('options', setOptions)
        this.removeChangeListener<IGameBoardState>('gameBoardState', setBoardState)
        this.removeChangeListener<IGameBoardCoordinate>('cellWillBeRemoved', setCellWillBeRemoved)
        this.removeChangeListener<boolean>('isAITurn', setIsAITurn)
      }
    },[setCurrentPlayer, setBoard, setOptions, setBoardState, setCellWillBeRemoved, setIsAITurn])

    return state
  }
}