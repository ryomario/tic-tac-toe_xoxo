import { useEffect, useState } from "react";
import { checkGameBoardState, DEFAULT_BOARD_SIZE, DEFAULT_CONTEXT_VALUE, GAME_EMPTY_PLAYER_STEP_HISTORY, GAME_MAX_STEP_HISTORY, getBoardFromStepHistory, getNextPlayer, getPlayerInBoard, randomPlayer } from "../factory";
import { GameDifficulty, GameMode, GameState, IGameBoard, IGameBoardCoordinate, IGameBoardState, IGameOptions, IGamePlayer, IGamePlayerStepHistory } from "../types";
import { aiTurn } from "./ai";

export class Game {
  private _options: IGameOptions = DEFAULT_CONTEXT_VALUE.options;
  private _currentPlayer: IGamePlayer = 'o';
  private _gameBoardState: IGameBoardState = { type: DEFAULT_CONTEXT_VALUE.gameState };

  private _playerStepHistory: IGamePlayerStepHistory = GAME_EMPTY_PLAYER_STEP_HISTORY;
  boardSize: number = DEFAULT_BOARD_SIZE;
  maxStepHistory: number = GAME_MAX_STEP_HISTORY;

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
    this.boardSize = DEFAULT_BOARD_SIZE
    this.maxStepHistory = GAME_MAX_STEP_HISTORY

    this.triggerChange('boardSize', this.boardSize)
    this.triggerChange('maxStepHistory', this.maxStepHistory)
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
    return getBoardFromStepHistory(this.playerStepHistory, this.boardSize)
  }
  get cellWillBeRemoved() {
    if(this.playerStepHistory[this.currentPlayer].length < this.maxStepHistory || this.options.mode != GameMode.endless) return;
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
  triggerChange(attr: string, newValue: any) {
    if(!this._changeListeners[attr] || this._changeListeners[attr].length == 0) return;
    for (const callback of this._changeListeners[attr]) {
      if(typeof callback == 'function') callback.call(this, newValue)
    }
  }

  setNextPlayer() {
    this.currentPlayer = getNextPlayer(this.currentPlayer)
  }

  pushStepHistory(player: IGamePlayer, coordinate: IGameBoardCoordinate) {
    const oldHistory = this.playerStepHistory
    const newHistory: IGamePlayerStepHistory = {
      x: [ ...oldHistory.x ],
      o: [ ...oldHistory.o ],
    }
    const playerHis = newHistory[player]
    playerHis.push(coordinate)
    if(this.options.mode == GameMode.endless && playerHis.length > this.maxStepHistory) {
      playerHis.shift()
    }
    newHistory[player] = playerHis

    this.playerStepHistory = newHistory

    this.gameBoardState = checkGameBoardState(this.board)
  }
  
  doTurn(coordinate: IGameBoardCoordinate) {
    if(getPlayerInBoard(this.board,coordinate) == null) {
      this.pushStepHistory(this.currentPlayer, coordinate)
      this.setNextPlayer()
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
    const board = this.board
    const currentPlayer = this.currentPlayer
    aiTurn({
      board,
      currentPlayer,
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
  useCurrentPlayer() {
    const [player, setPlayer] = useState<IGamePlayer>(this.currentPlayer)

    useEffect(() => {
      this.addChangeListener<IGamePlayer>('currentPlayer', setPlayer)
      return () => this.removeChangeListener<IGamePlayer>('currentPlayer', setPlayer)
    },[setPlayer])

    return player
  }

  useBoard() {
    const [board, setBoard] = useState<IGameBoard>(this.board)

    useEffect(() => {
      this.addChangeListener<IGameBoard>('board', setBoard)
      return () => this.removeChangeListener<IGameBoard>('board', setBoard)
    },[setBoard])

    return board
  }

  useOptions() {
    const [options, setOptions] = useState<IGameOptions>(this.options)

    useEffect(() => {
      this.addChangeListener<IGameOptions>('options', setOptions)
      return () => this.removeChangeListener<IGameOptions>('options', setOptions)
    },[setOptions])

    return options
  }

  useGameBoardState() {
    const [state, setState] = useState<IGameBoardState>(this.gameBoardState)

    useEffect(() => {
      this.addChangeListener<IGameBoardState>('gameBoardState', setState)
      return () => this.removeChangeListener<IGameBoardState>('gameBoardState', setState)
    },[setState])

    return state
  }

  useCellWillBeRemoved() {
    const [state, setState] = useState<IGameBoardCoordinate|undefined>(this.cellWillBeRemoved)

    useEffect(() => {
      this.addChangeListener<IGameBoardCoordinate>('cellWillBeRemoved', setState)
      return () => this.removeChangeListener<IGameBoardCoordinate>('cellWillBeRemoved', setState)
    },[setState])

    return state
  }

  useIsAITurn() {
    const [state, setState] = useState<boolean>(this.isAITurn)

    useEffect(() => {
      this.addChangeListener<boolean>('isAITurn', setState)
      return () => this.removeChangeListener<boolean>('isAITurn', setState)
    },[setState])

    return state
  }
}