import { checkGameBoardState, getBoardFromStepHistory, getEmptyBoardCells, getNextPlayer, pushStepHistory } from "../factory";
import { GameState, IGameBoardCoordinate, IGameBoardTurn, IGameOptions, IGamePlayer, IGamePlayerStepHistory } from "../types";
import AIWorker from "../workers/aiWorker?worker"

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
  alpha: number
  beta: number
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
  const worker = new AIWorker()
  worker.onmessage = (event: { data: IGameBoardCoordinate }) => {
    if(event.data) resolve(event.data)
    // else console.log('AI Move not calculated')
    worker.terminate()
  }

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
    }, {aiPlayer, depth: 1, maxDepth, alpha: -Infinity, beta: Infinity})

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

function minimaxValue(state: IState, {aiPlayer, depth = 0, maxDepth = 5, alpha, beta}: IMinimaxOptions) {
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
    if(state.currentPlayer != aiPlayer)score = -Infinity
    else score = Infinity

    const available = getEmptyBoardCells(board)
    for(const coordinate of available) {
      const nextStepHis = pushStepHistory(state.stepHistory, state.currentPlayer, coordinate, state.gameOptions)
      const nextState: IState = {
        stepHistory: nextStepHis,
        currentPlayer: getNextPlayer(state.currentPlayer),
        gameOptions: state.gameOptions,
      }
      const nextScore = minimaxValue(nextState, {aiPlayer, depth: depth + 1, alpha, beta})

      if(state.currentPlayer != aiPlayer) {
        score = Math.max(score, nextScore)
        alpha = Math.max(alpha, score)
      } else {
        score = Math.min(score, nextScore)
        beta = Math.min(beta, score)
      }

      if(beta <= alpha) break;
    }

    return score
  }
}
