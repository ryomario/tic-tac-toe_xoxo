import { checkGameBoardState, getBoardFromStepHistory, getEmptyBoardCells, getNextPlayer, pushStepHistory } from "../factory";
import { GameState, IGameBoardCoordinate, IGameBoardTurn, IGameOptions, IGamePlayer, IGamePlayerStepHistory } from "../types";

type IState = {
  currentPlayer: IGamePlayer
  stepHistory: IGamePlayerStepHistory
  gameOptions: IGameOptions
}
type IAction = IGameBoardTurn & {
  minimaxVal: number
}

type IMinimaxOptions = {
  aiPlayer: IGamePlayer
  depth?: number
  maxDepth?: number
}

export type AIWorkerMessages = {
  state: IState
  aiPlayer: IGamePlayer
  maxDepth?: number
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

export const aiTurn = (state: IState, aiPlayer: IGamePlayer, maxDepth = 10) => new Promise<IGameBoardCoordinate>((resolve, _reject) => {
  const worker = createWorker('../workers/aiWorker.ts', (coordinate) => {
    if(coordinate) resolve(coordinate as IGameBoardCoordinate)
    // else console.log('AI Move not calculated')
    worker.terminate()
  })

  worker.postMessage({
    state,
    aiPlayer,
    maxDepth,
  } as AIWorkerMessages)

  return () => worker.terminate()
})

/**
 * Slow process on board grid size > 3
 */
export function calculateAIMove(state: IState, aiPlayer: IGamePlayer, maxDepth = 10) {
  const available = getEmptyBoardCells(getBoardFromStepHistory(state.stepHistory, state.gameOptions.boardSize))
  
  const availableActs = available.map(coordinate => {
    const act: IAction = {
      coordinate,
      player: state.currentPlayer,
      minimaxVal: 0
    }
    const nextStepHis = pushStepHistory(state.stepHistory, state.currentPlayer, coordinate, state.gameOptions)
    act.minimaxVal = minimaxValue({
      stepHistory: nextStepHis,
      currentPlayer: getNextPlayer(state.currentPlayer),
      gameOptions: state.gameOptions,
    }, {aiPlayer, depth: 1, maxDepth})

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

function minimaxValue(state: IState, {aiPlayer, depth = 0, maxDepth = 5}: IMinimaxOptions) {
  const board = getBoardFromStepHistory(state.stepHistory, state.gameOptions.boardSize)
  const boardState = checkGameBoardState(board)
  if(boardState.type == GameState.draw) return 0
  else if(boardState.type == GameState.over) {
    if(boardState.winner != aiPlayer) return 1
    return -1
  } else if(depth > maxDepth) {
    return 0
  } else {
    let score: number
    if(state.currentPlayer != aiPlayer)score = -1000
    else score = 1000

    const available = getEmptyBoardCells(board)
    const availableStates = available.map(coordinate => {
      const nextStepHis = pushStepHistory(state.stepHistory, state.currentPlayer, coordinate, state.gameOptions)
      return {
        stepHistory: nextStepHis,
        currentPlayer: getNextPlayer(state.currentPlayer),
        gameOptions: state.gameOptions,
      } as IState
    })

    availableStates.forEach(nextState => {
      const nextScore = minimaxValue(nextState, {aiPlayer, depth: depth + 1})
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