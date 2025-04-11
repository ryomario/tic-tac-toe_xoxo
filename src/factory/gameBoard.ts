import { IGameBoard, IGameBoardCoordinate, IGameBoardState, IGameBoardTurn, IGamePlayer } from "../types";

export const DEFAULT_BOARD_SIZE = 3

export const WIN_MIN_CHAIN = 3

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

export function nextBoardState(board: IGameBoard, turn: IGameBoardTurn) {
  const [col, row] = turn.coordinate
  
  const newBoard: IGameBoard = [
    ...board.map(row => ([...row])),
  ]
  newBoard[row][col] = turn.player

  return newBoard
}

export function checkGameTurn([col, row]: IGameBoardCoordinate, board: IGameBoard): IGameBoardState {
  if(board.length <= row || board[0].length <= col) throw new Error('Out of range')

  const player = board[row][col]
  if(!player) return {
    type: 'running',
  }

  let chain_coors: IGameBoardCoordinate[] = []
  let c_row = row, c_col = col

  // check chain \ above
  while(c_row >= 0 && c_col >= 0 && board[c_row][c_col] == player) {
    chain_coors.push([c_col,c_row])
    c_row--, c_col--
  }
  // check chain \ below
  c_row = row + 1, c_col = col + 1
  while(c_row < board.length && c_col < board[c_row].length && board[c_row][c_col] == player) {
    chain_coors.push([c_col,c_row])
    c_row++, c_col++
  }
  if(chain_coors.length >= WIN_MIN_CHAIN) return {
    type: 'over',
    winner: player,
    winCoors: chain_coors,
  }
  
  // check chain | above
  chain_coors = []
  c_row = row, c_col = col
  while(c_row >= 0 && board[c_row][c_col] == player) {
    chain_coors.push([c_col,c_row])
    c_row--
  }
  // check chain | below
  c_row = row + 1, c_col = col
  while(c_row < board.length && board[c_row][c_col] == player) {
    chain_coors.push([c_col,c_row])
    c_row++
  }
  if(chain_coors.length >= WIN_MIN_CHAIN) return {
    type: 'over',
    winner: player,
    winCoors: chain_coors,
  }

  // check chain / above
  chain_coors = []
  c_row = row, c_col = col
  while(c_row >= 0 && c_col < board[c_row].length && board[c_row][c_col] == player) {
    chain_coors.push([c_col,c_row])
    c_row--, c_col++
  }
  // check chain / below
  c_row = row + 1, c_col = col - 1
  while(c_row < board.length && c_col >= 0 && board[c_row][c_col] == player) {
    chain_coors.push([c_col,c_row])
    c_row++, c_col--
  }
  if(chain_coors.length >= WIN_MIN_CHAIN) return {
    type: 'over',
    winner: player,
    winCoors: chain_coors,
  }
  
  // check chain - left
  chain_coors = []
  c_row = row, c_col = col
  while(c_col >= 0 && board[c_row][c_col] == player) {
    chain_coors.push([c_col,c_row])
    c_col--
  }
  // check chain - right
  c_row = row, c_col = col + 1
  while(c_col < board[c_row].length && board[c_row][c_col] == player) {
    chain_coors.push([c_col,c_row])
    c_col++
  }
  if(chain_coors.length >= WIN_MIN_CHAIN) return {
    type: 'over',
    winner: player,
    winCoors: chain_coors,
  }

  // check not over
  for(const b_row of board) {
    for(const cell of b_row) {
      if(cell == null) return {
        type: 'running',
      }
    }
  }

  return {
    type: 'draw',
  }
}