import { GameState, IGameBoard, IGameBoardCoordinate, IGameBoardState, IGameBoardTurn, IGamePlayer, IGamePlayerStepHistory, IGameStepHistory } from "../types";
import { GAME_MAX_STEP_HISTORY } from "./game";

export const DEFAULT_BOARD_SIZE = 3

export const WIN_MIN_CHAIN = GAME_MAX_STEP_HISTORY

export function generateBoard(size: number, fill: IGamePlayer|null = null): IGameBoard {
  const board: IGameBoard = []
  for(let row = 0; row < size; row++) {
    board[row] = []
    for(let col = 0; col < size; col++) {
      board[row][col] = fill
    }
  }
  return board
}

export function getEmptyBoardCells(board: IGameBoard) {
  const emptyCells: IGameBoardCoordinate[] = []
  for(let row = 0; row < board.length; row++) {
    for(let col = 0; col < board[row].length; col++) {
      if(board[row][col] == null) {
        emptyCells.push([col, row])
      }
    }
  }
  return emptyCells
}

export function getBoardFromStepHistory(playerStepHistory: IGamePlayerStepHistory, boardSize: number) {
  let newBoard = generateBoard(boardSize)
  for (const key in playerStepHistory) {
    const player = key as IGamePlayer
    playerStepHistory[player].forEach(coordinate => {
      newBoard = nextBoardState(newBoard, { coordinate, player })
    })
  }
  return newBoard
}

export function nextBoardState(board: IGameBoard, turn: IGameBoardTurn) {
  const [col, row] = turn.coordinate
  
  const newBoard: IGameBoard = [
    ...board.map(row => ([...row])),
  ]
  newBoard[row][col] = turn.player

  return newBoard
}

export function getPlayerInBoard(board: IGameBoard,coordinate: IGameBoardCoordinate) {
  const [col, row] = coordinate

  return board[row][col]
}

function checkRowState(row_idx: number,board: IGameBoard): IGameBoardState|null {
  if(!board[row_idx])return null;
  let c_player: IGamePlayer|null = null
  let coordinates: IGameBoardCoordinate[] = []
  for(let col = 0; col < board[row_idx].length; col++) {
    const board_cell = board[row_idx][col]
    if(board_cell != null) {
      if(c_player != board_cell) {
        c_player = board_cell
        coordinates = []
      }
      coordinates.push([col, row_idx])
      if(coordinates.length >= WIN_MIN_CHAIN) return {
        type: GameState.over,
        winner: c_player,
        winCoors: coordinates,
      }
    } else {
      coordinates = []
    }
  }
  return null
}

function checkColState(col_idx: number,board: IGameBoard): IGameBoardState|null {
  if(!board || board.length == 0 || !board[0][col_idx] || board[0][col_idx].length == 0)return null;
  let c_player: IGamePlayer|null = null
  let coordinates: IGameBoardCoordinate[] = []
  for(let row = 0; row < board.length; row++) {
    const board_cell = board[row][col_idx]
    if(board_cell != null) {
      if(c_player != board_cell) {
        c_player = board_cell
        coordinates = []
      }
      coordinates.push([col_idx, row])
      if(coordinates.length >= WIN_MIN_CHAIN) return {
        type: GameState.over,
        winner: c_player,
        winCoors: coordinates,
      }
    } else {
      coordinates = []
    }
  }
  return null
}

function checkLeftDiagState(k: number,board: IGameBoard): IGameBoardState|null {
  if(!board || board.length == 0 || !board[0] || board[0].length == 0)return null;
  let c_player: IGamePlayer|null = null
  let coordinates: IGameBoardCoordinate[] = []
  const size = board.length
  let start_i = Math.max(0, k)
  let end_i = Math.min(size, size+k)
  for(let i = start_i; i < end_i; i++) {
    const col = i-k, row = i
    const board_cell = board[row][col]
    if(board_cell != null) {
      if(c_player != board_cell) {
        c_player = board_cell
        coordinates = []
      }
      coordinates.push([col, row])
      if(coordinates.length >= WIN_MIN_CHAIN) return {
        type: GameState.over,
        winner: c_player,
        winCoors: coordinates,
      }
    } else {
      coordinates = []
    }
  }
  return null
}

function checkRightDiagState(k: number,board: IGameBoard): IGameBoardState|null {
  if(!board || board.length == 0 || !board[0] || board[0].length == 0)return null;
  let c_player: IGamePlayer|null = null
  let coordinates: IGameBoardCoordinate[] = []
  const size = board.length
  let start_i = Math.max(0, k)
  let end_i = Math.min(size, size+k)
  for(let i = start_i; i < end_i; i++) {
    const col = size -1 + k-i, row = i
    const board_cell = board[row][col]
    if(board_cell != null) {
      if(c_player != board_cell) {
        c_player = board_cell
        coordinates = []
      }
      coordinates.push([col, row])
      if(coordinates.length >= WIN_MIN_CHAIN) return {
        type: GameState.over,
        winner: c_player,
        winCoors: coordinates,
      }
    } else {
      coordinates = []
    }
  }
  return null
}

export function checkGameBoardState(board: IGameBoard): IGameBoardState {
  let isOver = true
  for(let row = 0; row < board.length; row++) {
    // check row
    const rowState = checkRowState(row, board)
    if(rowState != null) return rowState
    for(let col = 0; col < board.length; col++) {
      if(row == 0) {
        // check col
        const colState = checkColState(col, board)
        if(colState != null) return colState
      }
      if(board[row][col] == null) isOver = false
    }
  }
  const size = board.length
  for(let k = WIN_MIN_CHAIN - size; k <= (size - WIN_MIN_CHAIN); k++) {
    const leftDiagState = checkLeftDiagState(k, board)
    if(leftDiagState != null) return leftDiagState

    const rightDiagState = checkRightDiagState(k, board)
    if(rightDiagState != null) return rightDiagState
  }
  return {
    type: isOver ? GameState.draw : GameState.running,
  }
}
