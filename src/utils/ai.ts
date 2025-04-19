import { checkGameBoardState, getEmptyBoardCells, getNextPlayer, nextBoardState } from "../factory";
import { GameState, IGameBoard, IGameBoardCoordinate, IGameBoardTurn, IGamePlayer } from "../types";

type IState = {
  board: IGameBoard
  currentPlayer: IGamePlayer
}
type IAction = IGameBoardTurn & {
  minimaxVal: number
}

export type AIWorkerMessages = {
  state: IState
  aiPlayer: IGamePlayer
}
const IAction_ASCENDING = function(act1: IAction,act2: IAction) {
  if(act1.minimaxVal < act2.minimaxVal)return -1
  else if(act1.minimaxVal > act2.minimaxVal)return 1
  return 0
}
const IAction_DESCENDING = function(act1: IAction,act2: IAction) {
  if(act1.minimaxVal > act2.minimaxVal)return -1
  else if(act1.minimaxVal < act2.minimaxVal)return 1
  return 0
}

export const aiTurn = (state: IState, aiPlayer: IGamePlayer) => new Promise<IGameBoardCoordinate>((resolve, reject) => {
  const worker = createWorker('../workers/aiWorker.ts', (coordinate) => {
    if(coordinate) resolve(coordinate as IGameBoardCoordinate)
    // else reject('AI Move not calculated')
  })

  worker.postMessage({
    state,
    aiPlayer
  } as AIWorkerMessages)

  return () => worker.terminate()
})

/**
 * Slow process on board grid size > 3
 */
export function calculateAIMove(state: IState, aiPlayer: IGamePlayer) {
  const available = getEmptyBoardCells(state.board)
  
  const availableActs = available.map(coordinate => {
    const act: IAction = {
      coordinate,
      player: state.currentPlayer,
      minimaxVal: 0
    }
    const nextBoard = nextBoardState(state.board, act)
    act.minimaxVal = minimaxValue({
      board: nextBoard,
      currentPlayer: getNextPlayer(state.currentPlayer),
    }, aiPlayer)

    return act
  })

  if(state.currentPlayer != aiPlayer) availableActs.sort(IAction_DESCENDING)
  else availableActs.sort(IAction_ASCENDING)

  if(availableActs.length > 0) {
    let chosenAct = availableActs[0]
    const sameChosenActs = availableActs.filter(act => act.minimaxVal == chosenAct.minimaxVal)
                    
    const randid = Math.round(Math.random() * (sameChosenActs.length - 1))
    chosenAct = sameChosenActs[randid]

    return chosenAct.coordinate
  }

  return null
}

function minimaxValue(state: IState, aiPlayer: IGamePlayer) {
  const boardState = checkGameBoardState(state.board)
  if(boardState.type == GameState.draw) return 0
  else if(boardState.type == GameState.over) {
    if(boardState.winner != aiPlayer) return 10
    return -10
  } else {
    let score: number
    if(state.currentPlayer != aiPlayer)score = -1000
    else score = 1000

    const available = getEmptyBoardCells(state.board)
    const availableStates = available.map(coordinate => {
      const turn: IGameBoardTurn = {
        coordinate,
        player: state.currentPlayer,
      }
      const nextBoard = nextBoardState(state.board, turn)
      return {
        board: nextBoard,
        currentPlayer: getNextPlayer(state.currentPlayer),
      } as IState
    })

    availableStates.forEach(nextState => {
      const nextScore = minimaxValue(nextState, aiPlayer)
      if(state.currentPlayer != aiPlayer) {
        if(nextScore > score) score = nextScore
      } else {
        if(nextScore < score) score = nextScore
      }
    })

    return score
  }
}

export const createWorker = <T>(url: string, callback: (data: T) => void): Worker => {
  const worker = new Worker(new URL(url, import.meta.url), { type: 'module' })
  worker.onmessage = (event: { data: T }) => callback(event.data)
  return worker
};